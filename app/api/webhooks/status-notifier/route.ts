import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: Request) {
  try {
    // 1. Verify API Key
    const apiKey = req.headers.get('x-api-key');
    const secret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!secret || apiKey !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Payload from Supabase Database Webhook
    const body = await req.json();
    const { table, type, record, old_record } = body;
    const tableName = table || type;

    if (!record || !tableName) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 3. Prevent duplicate notifications
    const newStatus = tableName === 'leads' ? record.stage : record.status;
    const oldStatus = tableName === 'leads' ? old_record?.stage : old_record?.status;

    if (newStatus === oldStatus) {
      return NextResponse.json({ message: 'Status unchanged' }, { status: 200 });
    }

    if (record.whatsapp_notified_status === newStatus) {
      return NextResponse.json({ message: 'Already notified for this status' }, { status: 200 });
    }

    // 4. Fetch Tenant Meta API Credentials
    const supabase = createServiceClient();
    
    let waPhoneNumberId = '';
    let waAccessToken = '';
    let businessName = 'us';

    const { data: tenant } = await supabase
      .from('tenants')
      .select('wa_phone_number_id, wa_token_enc, business_name')
      .eq('id', record.tenant_id)
      .single();

    if (tenant) {
      if (tenant.business_name) businessName = tenant.business_name;
      if (tenant.wa_phone_number_id && tenant.wa_token_enc) {
        waPhoneNumberId = tenant.wa_phone_number_id;
        waAccessToken = tenant.wa_token_enc;
      }
    }

    // Fallback to integrations table if not found on tenant directly
    if (!waPhoneNumberId || !waAccessToken) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('credentials, external_account_id')
        .eq('tenant_id', record.tenant_id)
        .eq('platform', 'meta')
        .maybeSingle();
      
      if (integration?.credentials) {
        const creds = integration.credentials as any;
        waPhoneNumberId = creds.phone_number_id || integration.external_account_id || '';
        waAccessToken = creds.access_token || '';
      }
    }

    // Final fallback to environment variables
    waPhoneNumberId = waPhoneNumberId || process.env.META_PHONE_NUMBER_ID || '';
    waAccessToken = waAccessToken || process.env.META_ACCESS_TOKEN || '';

    if (!waPhoneNumberId || !waAccessToken) {
      console.error(`[status-notifier] No Meta API credentials for tenant: ${record.tenant_id}`);
      return NextResponse.json({ error: 'No Meta credentials configured for this tenant' }, { status: 500 });
    }

    // 5. Construct the Localized Message
    let messageText = '';
    const customerName = table === 'appointments' ? record.patient_name : (record.customer_name || 'Customer');
    const customerPhone = table === 'appointments' ? record.patient_phone : record.customer_phone;

    if (!customerPhone) {
      return NextResponse.json({ error: 'No customer phone number' }, { status: 400 });
    }

    // Orders Flow
    if (tableName === 'orders') {
      if (newStatus === 'confirmed') messageText = `Hi ${customerName}, your order has been confirmed by ${businessName}. We will let you know once it's on the way!`;
      else if (newStatus === 'dispatched') messageText = `Great news ${customerName}, your order has been dispatched and is on its way to you!`;
      else if (newStatus === 'delivered') messageText = `Hi ${customerName}, your order has been marked as delivered. Thank you for shopping with ${businessName}!`;
      else if (newStatus === 'cancelled') messageText = `Hi ${customerName}, your order has been cancelled. Please reply if you have any questions.`;
    } 
    // Appointments Flow
    else if (tableName === 'appointments') {
      if (newStatus === 'confirmed') messageText = `Hi ${customerName}, your appointment has been confirmed! We look forward to seeing you.`;
      else if (newStatus === 'cancelled') messageText = `Hi ${customerName}, your appointment has been cancelled. Please reply to reschedule.`;
    } 
    // Leads Flow
    else if (tableName === 'leads') {
      if (newStatus === 'visit_scheduled') messageText = `Hi ${customerName}, your property visit is scheduled. We will share the details shortly.`;
    }

    // 6. Send the WhatsApp Message via Meta Graph API
    if (messageText) {
      // Remove any non-numeric characters (like + or spaces) for WhatsApp API
      const toPhone = customerPhone.replace(/\D/g, '');
      
      const metaUrl = `https://graph.facebook.com/v21.0/${waPhoneNumberId}/messages`;
      const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: toPhone,
          type: 'text',
          text: { body: messageText }
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('[status-notifier] Meta API Error:', responseData);
        throw new Error(responseData.error?.message || 'Meta API failed');
      }

      // 7. Update the whatsapp_notified_status in Supabase to prevent duplicate sends
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ whatsapp_notified_status: newStatus })
        .eq('id', record.id);

      if (updateError) {
        console.error('[status-notifier] Error updating notified status:', updateError);
        // We don't fail the request here since the message was already sent
      }

      return NextResponse.json({ success: true, notified_status: newStatus, message_id: responseData.messages?.[0]?.id });
    }

    // If no specific message was defined for this status
    return NextResponse.json({ message: 'No notification needed for this specific status' }, { status: 200 });

  } catch (error: any) {
    console.error('[status-notifier] Server Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
