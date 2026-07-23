export async function processCampaign(supabase, campaignId) {
  try {
    console.log(`[campaign] Starting processing for campaign: ${campaignId}`);

    // 1. Fetch Campaign Details
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campErr || !campaign) {
      console.error('[campaign] Campaign not found', campErr);
      return;
    }

    // Mark as In Progress
    await supabase.from('campaigns').update({ status: 'In Progress' }).eq('id', campaignId);

    // 2. Fetch Tenant Meta Credentials
    let waPhoneNumberId = '';
    let waAccessToken = '';

    const { data: tenant } = await supabase
      .from('tenants')
      .select('wa_phone_number_id, wa_token_enc')
      .eq('id', campaign.tenant_id)
      .single();

    if (tenant?.wa_phone_number_id && tenant?.wa_token_enc) {
      waPhoneNumberId = tenant.wa_phone_number_id;
      waAccessToken = tenant.wa_token_enc;
    } else {
      const { data: integration } = await supabase
        .from('integrations')
        .select('credentials, external_account_id')
        .eq('tenant_id', campaign.tenant_id)
        .eq('platform', 'meta')
        .maybeSingle();

      if (integration?.credentials) {
        waPhoneNumberId = integration.credentials.phone_number_id || integration.external_account_id || '';
        waAccessToken = integration.credentials.access_token || '';
      }
    }

    // Fallbacks
    waPhoneNumberId = waPhoneNumberId || process.env.META_PHONE_NUMBER_ID || '';
    waAccessToken = waAccessToken || process.env.META_ACCESS_TOKEN || '';

    if (!waPhoneNumberId || !waAccessToken) {
      console.error('[campaign] No Meta API credentials found for tenant');
      await supabase.from('campaigns').update({ status: 'Failed' }).eq('id', campaignId);
      return;
    }

    // 3. Fetch Contacts (By Segment)
    let contacts = [];
    
    // Simplest approach: "All Contacts" fetches all unique WhatsApp conversations for this tenant
    if (campaign.segment_name === 'All Contacts' || !campaign.segment_name) {
      const { data: convs } = await supabase
        .from('conversations')
        .select('external_conversation_id, customer_name')
        .eq('tenant_id', campaign.tenant_id)
        .eq('platform', 'whatsapp');
      
      // Deduplicate by phone number
      const unique = new Map();
      convs?.forEach(c => unique.set(c.external_conversation_id, c.customer_name));
      unique.forEach((name, phone) => contacts.push({ phone, name }));
    }

    if (contacts.length === 0) {
      console.log('[campaign] No contacts found for segment.');
      await supabase.from('campaigns').update({ status: 'Completed', total_recipients: 0 }).eq('id', campaignId);
      return;
    }

    // Update total recipients
    await supabase.from('campaigns').update({ total_recipients: contacts.length }).eq('id', campaignId);

    // 4. Batch Sending with Rate Limiting (50ms delay between messages)
    let sentCount = 0;
    let failedCount = 0;

    for (const contact of contacts) {
      try {
        const toPhone = contact.phone.replace(/\D/g, '');
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
            type: 'template',
            template: {
              name: campaign.template_name,
              language: { code: 'en_US' } // Using en_US as default fallback
            }
          })
        });

        const responseData = await response.json();
        const status = response.ok ? 'sent' : 'failed';

        if (response.ok) {
          sentCount++;
        } else {
          failedCount++;
          console.error(`[campaign] Failed sending to ${toPhone}:`, responseData.error?.message);
        }

        // Log individual message delivery attempt
        await supabase.from('campaign_messages').insert({
          campaign_id: campaignId,
          tenant_id: campaign.tenant_id,
          recipient_phone: toPhone,
          recipient_name: contact.name,
          meta_message_id: responseData.messages?.[0]?.id || null,
          status: status,
          error_message: response.ok ? null : responseData.error?.message
        });

      } catch (err) {
        failedCount++;
        console.error(`[campaign] Network error sending to ${contact.phone}:`, err.message);
      }

      // Respect Meta API rate limits (Wait 50ms before the next send)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 5. Finalize Campaign Metrics
    await supabase.from('campaigns').update({
      status: 'Completed',
      sent_count: sentCount,
      failed_count: failedCount
    }).eq('id', campaignId);

    console.log(`[campaign] Completed processing for campaign: ${campaignId}. Sent: ${sentCount}, Failed: ${failedCount}`);

  } catch (error) {
    console.error('[campaign] Fatal error:', error);
    await supabase.from('campaigns').update({ status: 'Failed' }).eq('id', campaignId);
  }
}
