import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { decrypt } from '@/lib/crypto';
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { syncInventoryToMetaCatalog } from '@/lib/ecommerce/meta-catalog-sync';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    // Determine the event & resource from WooCommerce headers
    const topic = req.headers.get('x-wc-webhook-topic') || '';
    const event = req.headers.get('x-wc-webhook-event') || '';
    const resource = req.headers.get('x-wc-webhook-resource') || (topic.includes('product') ? 'product' : 'order');

    if (!topic && !event) {
      return NextResponse.json({ error: 'Missing WooCommerce topic/event header' }, { status: 400 });
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
      
      try {
        await supabase.from('audit_logs').insert({
          tenant_id: tenantId,
          action: 'webhook_auth_missing_secret',
          details: {
            platform: 'woocommerce',
            severity: 'CRITICAL',
            message: 'WooCommerce order sync rejected: Webhook secret has not been configured in Settings > eCommerce.',
            timestamp: new Date().toISOString(),
            event: event || topic,
          }
        });
      } catch (err: any) {
        console.error('[WooCommerce Webhook] Failed to write audit log:', err.message);
      }

      if (credRow?.id) {
        const updatedCreds = {
          ...((credRow.credentials as any) || {}),
          webhook_status: 'secret_missing',
          last_webhook_error: `Sync blocked at ${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()}): Webhook secret is not configured.`
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

    if (credRow?.id && (credRow.credentials as any)?.webhook_status === 'secret_missing') {
      const clearedCreds = { ...((credRow.credentials as any) || {}), webhook_status: 'active', last_webhook_error: null };
      await supabase.from('integration_credentials').update({ credentials: clearedCreds }).eq('id', credRow.id);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. PRODUCT INVENTORY & CATALOG SYNC
    // ─────────────────────────────────────────────────────────────────────────────
    if (resource === 'product' || topic.startsWith('product.')) {
      console.log(`[WooCommerce Webhook] 📦 Processing Product Event "${topic || event}" for Product ID: ${payload.id} (${payload.name})`);

      if (event === 'deleted' || topic === 'product.deleted') {
        await supabase
          .from('products')
          .update({ is_active: false, in_stock: false, stock_quantity: 0 })
          .eq('tenant_id', tenantId)
          .eq('external_product_id', String(payload.id));

        return NextResponse.json({ success: true, action: 'product_disabled' });
      }

      const rawStockQty = payload.stock_quantity;
      const stockQty = typeof rawStockQty === 'number' ? rawStockQty : (payload.stock_status === 'instock' ? 10 : 0);
      const isInstock = payload.stock_status === 'instock' && stockQty > 0;
      const sku = payload.sku || String(payload.id);

      // Clean HTML from description
      const cleanDesc = (payload.description || payload.short_description || '')
        .replace(/<[^>]*>?/gm, '')
        .trim();

      const { data: updatedProd, error: prodErr } = await supabase
        .from('products')
        .upsert(
          {
            tenant_id: tenantId,
            external_product_id: String(payload.id),
            retailer_id: sku,
            sku: sku,
            name: payload.name || 'Product',
            category: (payload.categories && payload.categories.length > 0) ? payload.categories[0].name : 'General',
            description: cleanDesc,
            price: parseFloat(payload.price || payload.regular_price || 0),
            currency: 'PKR',
            image_url: (payload.images && payload.images.length > 0) ? payload.images[0].src : null,
            product_url: payload.permalink || null,
            stock_status: payload.stock_status || (isInstock ? 'instock' : 'outofstock'),
            stock_quantity: stockQty,
            in_stock: isInstock,
            is_active: payload.status === 'publish',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,external_product_id' }
        )
        .select('id')
        .maybeSingle();

      if (prodErr) {
        console.error('[WooCommerce Webhook] ❌ Error upserting product to database:', prodErr);
      } else {
        console.log(`[WooCommerce Webhook] ✅ Product synced to Ittisalo DB: "${payload.name}" (Stock: ${stockQty}, Status: ${payload.stock_status})`);
      }

      // Propagate inventory update to Meta WABA Catalog if connected
      const { data: integrationRow } = await supabase
        .from('integrations')
        .select('meta_catalog_id, credentials, access_token')
        .eq('tenant_id', tenantId)
        .eq('platform', 'whatsapp')
        .maybeSingle();

      const metaCatalogId = integrationRow?.meta_catalog_id || (integrationRow?.credentials as any)?.catalog_id;
      const metaToken = integrationRow?.access_token || (integrationRow?.credentials as any)?.access_token;

      if (metaCatalogId && metaToken) {
        await syncInventoryToMetaCatalog(metaCatalogId, metaToken, [
          {
            retailer_id: sku,
            availability: isInstock ? 'in stock' : 'out of stock',
            inventory: stockQty,
            price: parseFloat(payload.price || 0),
            currency: 'PKR',
          }
        ]);
      }

      return NextResponse.json({ success: true, action: 'product_stock_synced' });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. ORDER SYNC
    // ─────────────────────────────────────────────────────────────────────────────
    console.log(`[WooCommerce Webhook] 🛒 Processing Order Event "${topic || event}" for Order ID: ${payload.id}`);

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

    const items = (payload.line_items || []).map((item: any) => ({
      name: item.name,
      qty: item.quantity,
      price: parseFloat(item.price || 0),
      external_product_id: String(item.product_id || ''),
    }));

    if (event === 'created' || event === 'updated' || topic.startsWith('order.')) {
      const { error } = await supabase
        .from('orders')
        .upsert(
          {
            tenant_id: tenantId,
            niche: 'ecommerce',
            customer_name: `${payload.billing?.first_name || ''} ${payload.billing?.last_name || ''}`.trim(),
            customer_phone: payload.billing?.phone || payload.shipping?.phone || 'Unknown',
            customer_email: payload.billing?.email || null,
            order_amount: parseFloat(payload.total || 0),
            currency: payload.currency || 'PKR',
            status: localStatus,
            items: items,
            order_items: items,
            source: 'woocommerce',
            payment_method: (payload.payment_method || '').toLowerCase().includes('cod') ? 'cod' : (payload.payment_method_title || payload.payment_method || 'Online'),
            delivery_address: `${payload.shipping?.address_1 || payload.billing?.address_1 || ''} ${payload.shipping?.city || payload.billing?.city || ''}`.trim(),
            delivery_city: payload.shipping?.city || payload.billing?.city || '',
            platform_source: 'woocommerce',
            platform_order_id: String(payload.id),
            platform_order_number: payload.number ? `#${payload.number}` : `#${payload.id}`,
            platform_synced_at: new Date().toISOString(),
          },
          { onConflict: 'platform_order_id' }
        );

      if (error) {
        console.error('[WooCommerce Webhook] ❌ Supabase order upsert failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[WooCommerce Webhook] ✅ Successfully synced WooCommerce order #${payload.number} to db`);
    } else if (event === 'deleted') {
      await supabase
        .from('orders')
        .delete()
        .eq('platform_order_id', String(payload.id))
        .eq('tenant_id', tenantId);

      console.log(`[WooCommerce Webhook] ✅ Successfully deleted WooCommerce order #${payload.number} from db`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[WooCommerce Webhook] Unhandled error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
