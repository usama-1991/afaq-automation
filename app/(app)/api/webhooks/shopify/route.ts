import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { decrypt } from '@/lib/crypto';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    // Determine the event type from Shopify headers
    const topic = req.headers.get('x-shopify-topic');
    if (!topic) {
      return NextResponse.json({ error: 'Missing Shopify topic header' }, { status: 400 });
    }

    const rawBody = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id');

    if (!tenantId) {
      console.error('[Shopify Webhook] ❌ tenant_id is missing from webhook URL query parameters.');
      return NextResponse.json({ error: 'tenant_id required in query params' }, { status: 400 });
    }

    // ── HMAC-SHA256 Signature Verification ──────────────────────────────────
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    if (!hmacHeader) {
      console.warn(`[ECOMMERCE_WEBHOOK_AUTH_MISSING_HEADER] 🚨 Missing X-Shopify-Hmac-Sha256 header for tenant ${tenantId}`);
      return NextResponse.json({ error: 'Unauthorized: Missing X-Shopify-Hmac-Sha256 header' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: credRow } = await supabase
      .from('integration_credentials')
      .select('id, credentials')
      .eq('tenant_id', tenantId)
      .eq('platform', 'shopify')
      .maybeSingle();

    const rawSecret = (credRow?.credentials as any)?.webhook_secret;
    const webhookSecret = decrypt(rawSecret);

    if (!webhookSecret) {
      console.error(`[ECOMMERCE_WEBHOOK_AUTH_MISSING_SECRET] 🚨 Platform: shopify | Tenant: ${tenantId} | Order sync blocked: webhook_secret is not configured.`);
      
      // Tier 2: Write persistent alert to audit_logs
      try {
        await supabase.from('audit_logs').insert({
          tenant_id: tenantId,
          action: 'webhook_auth_missing_secret',
          details: {
            platform: 'shopify',
            severity: 'CRITICAL',
            message: 'Shopify order sync rejected: Webhook secret has not been configured in Settings > eCommerce.',
            timestamp: new Date().toISOString(),
            topic: topic,
          }
        });
      } catch (err: any) {
        console.error('[Shopify Webhook] Failed to write audit log:', err.message);
      }

      // Tier 3: Flag integration_credentials for Settings UI warning banner
      if (credRow?.id) {
        const updatedCreds = {
          ...((credRow.credentials as any) || {}),
          webhook_status: 'secret_missing',
          last_webhook_error: `Order sync blocked at ${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()}): Webhook secret is not configured.`
        };
        await supabase.from('integration_credentials').update({ credentials: updatedCreds }).eq('id', credRow.id);
      }

      return NextResponse.json({ error: 'Unauthorized: Webhook secret not configured' }, { status: 401 });
    }

    const computedHmac = crypto.createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('base64');
    const computedBuf = Buffer.from(computedHmac, 'utf8');
    const receivedBuf = Buffer.from(hmacHeader, 'utf8');

    if (computedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(computedBuf, receivedBuf)) {
      console.warn(`[ECOMMERCE_WEBHOOK_AUTH_INVALID_SIGNATURE] 🚨 Invalid HMAC signature for tenant ${tenantId}`);
      return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
    }

    // Clear error flag if previously flagged
    if (credRow?.id && (credRow.credentials as any)?.webhook_status === 'secret_missing') {
      const clearedCreds = { ...((credRow.credentials as any) || {}), webhook_status: 'active', last_webhook_error: null };
      await supabase.from('integration_credentials').update({ credentials: clearedCreds }).eq('id', credRow.id);
    }
    console.log(`[Shopify Webhook] Received ${topic} for order ID: ${payload.id}`);

    // Map Shopify status to our app's status
    let localStatus = 'pending';
    
    if (payload.cancelled_at) {
      localStatus = 'cancelled';
    } else if (payload.fulfillment_status === 'fulfilled') {
      localStatus = 'delivered';
    } else if (payload.financial_status === 'paid' || payload.financial_status === 'partially_paid') {
      localStatus = 'confirmed';
    } else if (payload.financial_status === 'refunded' || payload.financial_status === 'voided') {
      localStatus = 'cancelled';
    }

    // Format the items
    const items = (payload.line_items || []).map((item: any) => ({
      name: item.title,
      qty: item.quantity,
      price: item.price,
    }));

    if (topic === 'orders/create' || topic === 'orders/updated') {
      // Upsert the order into the database
      const customerName = `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim() || 'Guest';
      const address = payload.shipping_address 
        ? `${payload.shipping_address.address1 || ''} ${payload.shipping_address.city || ''}`.trim() 
        : '';
        
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .upsert(
          {
            tenant_id: tenantId,
            niche: 'ecommerce',
            customer_name: customerName,
            customer_phone: payload.shipping_address?.phone || payload.customer?.phone || payload.phone || 'Unknown',
            customer_email: payload.customer?.email || payload.contact_email || null,
            order_amount: payload.total_price,
            currency: payload.currency || 'USD',
            status: localStatus,
            items: items,
            source: 'shopify',
            payment_method: payload.gateway || 'Online',
            delivery_address: address,
            platform_order_id: String(payload.id),
            platform_order_number: payload.name || `#${payload.order_number}`,
            platform_synced_at: new Date().toISOString(),
          },
          { onConflict: 'platform_order_id' }
        );

      if (error) {
        console.error('[Shopify Webhook] ❌ Supabase upsert failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[Shopify Webhook] ✅ Successfully synced Shopify order ${payload.name} to db`);
    } else if (topic === 'orders/delete') {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('platform_order_id', String(payload.id))
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('[Shopify Webhook] ❌ Supabase delete failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      console.log(`[Shopify Webhook] ✅ Successfully deleted Shopify order ${payload.id} from db`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Shopify Webhook] Unhandled error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
