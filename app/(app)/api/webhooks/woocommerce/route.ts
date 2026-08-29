import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { decrypt } from '@/lib/crypto';
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    // Determine the event type from WooCommerce headers
    const event = req.headers.get('x-wc-webhook-event');
    if (!event) {
      return NextResponse.json({ error: 'Missing WooCommerce event header' }, { status: 400 });
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
      console.error('[WooCommerce Webhook] ❌ tenant_id is missing from webhook URL query parameters.');
      return NextResponse.json({ error: 'tenant_id required in query params' }, { status: 400 });
    }

    // ── Rate Limiting: 120 requests per minute per tenant + client IP ──────────
    const clientIp = getClientIp(req);
    const limit = await checkRateLimit('/api/webhooks/woocommerce', `${tenantId}:${clientIp}`, 120, 60);
    if (!limit.success) {
      return rateLimitResponse(limit);
    }

    // ── HMAC-SHA256 Signature Verification ──────────────────────────────────
    const hmacHeader = req.headers.get('x-wc-webhook-signature');
    if (!hmacHeader) {
      console.warn(`[ECOMMERCE_WEBHOOK_AUTH_MISSING_HEADER] 🚨 Missing x-wc-webhook-signature header for tenant ${tenantId}`);
      return NextResponse.json({ error: 'Unauthorized: Missing x-wc-webhook-signature header' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: credRow } = await supabase
      .from('integration_credentials')
      .select('id, credentials')
      .eq('tenant_id', tenantId)
      .eq('platform', 'woocommerce')
      .maybeSingle();

    const rawSecret = (credRow?.credentials as any)?.webhook_secret;
    const webhookSecret = decrypt(rawSecret);

    if (!webhookSecret) {
      console.error(`[ECOMMERCE_WEBHOOK_AUTH_MISSING_SECRET] 🚨 Platform: woocommerce | Tenant: ${tenantId} | Order sync blocked: webhook_secret is not configured.`);
      
      // Tier 2: Write persistent alert to audit_logs
      try {
        await supabase.from('audit_logs').insert({
          tenant_id: tenantId,
          action: 'webhook_auth_missing_secret',
          details: {
            platform: 'woocommerce',
            severity: 'CRITICAL',
            message: 'WooCommerce order sync rejected: Webhook secret has not been configured in Settings > eCommerce.',
            timestamp: new Date().toISOString(),
            event: event,
          }
        });
      } catch (err: any) {
        console.error('[WooCommerce Webhook] Failed to write audit log:', err.message);
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
    console.log(`[WooCommerce Webhook] Received ${event} for order ID: ${payload.id}`);

    // Map WooCommerce status to our app's status
    const statusMap: Record<string, string> = {
      pending: 'pending',
      processing: 'confirmed',
      'on-hold': 'pending',
      completed: 'delivered',
      cancelled: 'cancelled',
      refunded: 'cancelled',
      failed: 'cancelled',
      trash: 'cancelled'
    };

    const localStatus = statusMap[payload.status] || 'pending';

    // Format the items
    const items = (payload.line_items || []).map((item: any) => ({
      name: item.name,
      qty: item.quantity,
      price: item.price,
    }));

    if (event === 'created' || event === 'updated') {
      // Upsert the order into the database
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .upsert(
          {
            tenant_id: tenantId,
            niche: 'ecommerce',
            customer_name: `${payload.billing?.first_name || ''} ${payload.billing?.last_name || ''}`.trim(),
            customer_phone: payload.billing?.phone || payload.shipping?.phone || 'Unknown',
            customer_email: payload.billing?.email || null,
            order_amount: payload.total,
            currency: payload.currency || 'USD',
            status: localStatus,
            items: items,
            source: 'woocommerce',
            payment_method: payload.payment_method_title || payload.payment_method || 'Online',
            delivery_address: payload.shipping?.address_1 || payload.billing?.address_1 || '',
            platform_order_id: String(payload.id),
            platform_order_number: payload.number,
            platform_synced_at: new Date().toISOString(),
          },
          { onConflict: 'platform_order_id' }
        );

      if (error) {
        console.error('[WooCommerce Webhook] ❌ Supabase upsert failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[WooCommerce Webhook] ✅ Successfully synced WooCommerce order #${payload.number} to db`);
    } else if (event === 'deleted') {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('platform_order_id', String(payload.id))
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('[WooCommerce Webhook] ❌ Supabase delete failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      console.log(`[WooCommerce Webhook] ✅ Successfully deleted WooCommerce order #${payload.number} from db`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[WooCommerce Webhook] Unhandled error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
