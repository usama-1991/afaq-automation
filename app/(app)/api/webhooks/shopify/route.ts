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
    const topic = req.headers.get('x-shopify-topic') || '';
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

    // ── Rate Limiting: 120 requests per minute per tenant + client IP ──────────
    const clientIp = getClientIp(req);
    const limit = await checkRateLimit('/api/webhooks/shopify', `${tenantId}:${clientIp}`, 120, 60);
    if (!limit.success) {
      return rateLimitResponse(limit);
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
    // 1. SHOPIFY PRODUCT & INVENTORY SYNC
    // ─────────────────────────────────────────────────────────────────────────────
    if (topic.startsWith('products/')) {
      console.log(`[Shopify Webhook] 📦 Processing Product Event "${topic}" for Product ID: ${payload.id} (${payload.title})`);

      if (topic === 'products/delete') {
        await supabase
          .from('products')
          .update({ is_active: false, in_stock: false, stock_quantity: 0 })
          .eq('tenant_id', tenantId)
          .eq('external_product_id', String(payload.id));

        return NextResponse.json({ success: true, action: 'product_disabled' });
      }

      const defaultVariant = payload.variants && payload.variants.length > 0 ? payload.variants[0] : null;
      const stockQty = defaultVariant?.inventory_quantity !== undefined ? defaultVariant.inventory_quantity : 10;
      const isInstock = stockQty > 0;
      const sku = defaultVariant?.sku || String(payload.id);

      // Clean HTML from description
      const cleanDesc = (payload.body_html || '')
        .replace(/<[^>]*>?/gm, '')
        .trim();

      await supabase
        .from('products')
        .upsert(
          {
            tenant_id: tenantId,
            external_product_id: String(payload.id),
            retailer_id: sku,
            sku: sku,
            name: payload.title || 'Product',
            category: payload.product_type || 'General',
            description: cleanDesc,
            price: parseFloat(defaultVariant?.price || 0),
            currency: 'PKR',
            image_url: (payload.image && payload.image.src) || (payload.images && payload.images.length > 0 ? payload.images[0].src : null),
            product_url: payload.handle ? `https://${payload.domain || 'myshopify.com'}/products/${payload.handle}` : null,
            stock_status: isInstock ? 'instock' : 'outofstock',
            stock_quantity: stockQty,
            in_stock: isInstock,
            is_active: payload.status === 'active',
            shopify_variant_id: defaultVariant?.id ? String(defaultVariant.id) : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,external_product_id' }
        );

      console.log(`[Shopify Webhook] ✅ Product synced to Ittisalo DB: "${payload.title}" (Stock: ${stockQty})`);

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
            price: parseFloat(defaultVariant?.price || 0),
            currency: 'PKR',
          }
        ]);
      }

      return NextResponse.json({ success: true, action: 'product_synced' });
    }

    if (topic === 'inventory_levels/update') {
      console.log(`[Shopify Webhook] 📊 Processing Inventory Level Update for item: ${payload.inventory_item_id}, available: ${payload.available}`);

      const availableQty = payload.available || 0;
      const isInstock = availableQty > 0;

      // Update product where external id or variant matches
      const { data: updatedRows } = await supabase
        .from('products')
        .update({
          stock_quantity: availableQty,
          in_stock: isInstock,
          stock_status: isInstock ? 'instock' : 'outofstock',
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .eq('sku', String(payload.inventory_item_id))
        .select('retailer_id, sku, price');

      return NextResponse.json({ success: true, action: 'inventory_level_updated' });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. SHOPIFY ORDER SYNC
    // ─────────────────────────────────────────────────────────────────────────────
    console.log(`[Shopify Webhook] 🛒 Processing Order Event "${topic}" for Order ID: ${payload.id} (${payload.name})`);

    const statusMap: Record<string, string> = {
      open: 'pending',
      closed: 'delivered',
      cancelled: 'cancelled',
    };

    let localStatus = 'pending';
    if (payload.cancelled_at) {
      localStatus = 'cancelled';
    } else if (payload.fulfillment_status === 'fulfilled') {
      localStatus = 'delivered';
    } else if (payload.financial_status === 'paid' || payload.financial_status === 'authorized' || payload.financial_status === 'pending') {
      localStatus = 'confirmed';
    } else {
      localStatus = statusMap[payload.status] || 'pending';
    }

    const items = (payload.line_items || []).map((item: any) => ({
      name: item.name || item.title,
      qty: item.quantity,
      price: parseFloat(item.price || 0),
      external_product_id: String(item.product_id || ''),
    }));

    const isCod = (payload.payment_gateway_names || []).some((g: string) => g.toLowerCase().includes('cash') || g.toLowerCase().includes('cod')) ||
                  (payload.tags || '').toLowerCase().includes('cod');

    if (topic === 'orders/create' || topic === 'orders/updated' || topic === 'orders/fulfilled') {
      const { error } = await supabase
        .from('orders')
        .upsert(
          {
            tenant_id: tenantId,
            niche: 'ecommerce',
            customer_name: `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim() || payload.shipping_address?.name || 'Customer',
            customer_phone: payload.customer?.phone || payload.shipping_address?.phone || payload.billing_address?.phone || 'Unknown',
            customer_email: payload.customer?.email || payload.email || null,
            order_amount: parseFloat(payload.total_price || 0),
            currency: payload.currency || 'PKR',
            status: localStatus,
            items: items,
            order_items: items,
            source: 'shopify',
            payment_method: isCod ? 'cod' : (payload.payment_gateway_names?.[0] || 'Online'),
            delivery_address: `${payload.shipping_address?.address1 || ''} ${payload.shipping_address?.city || ''}`.trim(),
            delivery_city: payload.shipping_address?.city || '',
            platform_source: 'shopify',
            platform_order_id: String(payload.id),
            platform_order_number: payload.name || `#${payload.order_number}`,
            platform_synced_at: new Date().toISOString(),
          },
          { onConflict: 'platform_order_id' }
        );

      if (error) {
        console.error('[Shopify Webhook] ❌ Supabase order upsert failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[Shopify Webhook] ✅ Successfully synced Shopify order ${payload.name} to db`);
    } else if (topic === 'orders/delete') {
      await supabase
        .from('orders')
        .delete()
        .eq('platform_order_id', String(payload.id))
        .eq('tenant_id', tenantId);

      console.log(`[Shopify Webhook] ✅ Successfully deleted Shopify order ${payload.name} from db`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Shopify Webhook] Unhandled error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
