import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import {
  pushOrderToShopify,
  pushOrderToWooCommerce,
  sendOrderConfirmationEmail,
  type OrderData,
  type ShopifyCredentials,
  type WooCommerceCredentials,
} from '@/lib/ecommerce/platform-sync';

/**
 * POST /api/orders/sync
 *
 * Called by n8n (or internally) after an order is confirmed in chat.
 * Performs three actions:
 *   1. Pushes the order to Shopify or WooCommerce (if tenant has credentials)
 *   2. Stores the platform order number back in the Ittisalo DB
 *   3. Sends a confirmation email to the customer (if email is available)
 *
 * Body: { order_id: string }
 * Auth: x-api-key header must match ORDERS_SYNC_API_KEY env var
 */
export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.ORDERS_SYNC_API_KEY;
    if (!expectedKey || !apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key' }, { status: 401 });
    }

    // ── Rate Limiting: 30 requests per minute per sync caller ──────────────────
    const limit = await checkRateLimit('/api/orders/sync', apiKey || getClientIp(request), 30, 60);
    if (!limit.success) {
      return rateLimitResponse(limit);
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    const { order_id } = await request.json();
    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // ── 1. Fetch the order ───────────────────────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: `Order not found: ${orderErr?.message || 'No data'}` },
        { status: 404 }
      );
    }

    // Skip if already synced to a platform
    if (order.platform_order_id) {
      return NextResponse.json({
        message: 'Order already synced to platform',
        platform_order_number: order.platform_order_number,
        platform_source: order.platform_source,
      });
    }

    // ── 2. Fetch tenant info (business name for email) ───────────────────────
    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_name')
      .eq('id', order.tenant_id)
      .single();

    const businessName = tenant?.business_name || 'Ittisalo';

    // ── 3. Check for e-commerce platform credentials ─────────────────────────
    // First check `integrations` table, then fall back to `integration_credentials`
    let platformCreds: { platform: string; credentials: any } | null = null;

    const { data: integrations } = await supabase
      .from('integrations')
      .select('platform, credentials')
      .eq('tenant_id', order.tenant_id)
      .in('platform', ['shopify', 'woocommerce'])
      .eq('is_active', true)
      .limit(1);

    if (integrations && integrations.length > 0) {
      platformCreds = integrations[0];
    } else {
      // Fallback: check integration_credentials table
      const { data: icreds } = await supabase
        .from('integration_credentials')
        .select('platform, credentials')
        .eq('tenant_id', order.tenant_id)
        .in('platform', ['shopify', 'woocommerce'])
        .eq('is_active', true)
        .limit(1);

      if (icreds && icreds.length > 0) {
        platformCreds = icreds[0];
      }
    }

    const results: {
      platform_sync: any;
      email: any;
    } = {
      platform_sync: null,
      email: null,
    };

    const orderData: OrderData = {
      id: order.id,
      tenant_id: order.tenant_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      items: order.items || [],
      order_amount: order.order_amount || 0,
      currency: order.currency || 'USD',
      delivery_address: order.delivery_address,
      payment_method: order.payment_method,
      notes: order.notes,
      source: order.source || 'whatsapp',
    };

    // ── 4. Push to platform (if credentials exist) ───────────────────────────
    if (platformCreds) {
      const platform = platformCreds.platform;
      const creds = platformCreds.credentials;

      console.log(`[orders/sync] Pushing order ${order.id} to ${platform}...`);

      let syncResult;
      if (platform === 'shopify') {
        syncResult = await pushOrderToShopify(orderData, creds as ShopifyCredentials);
      } else if (platform === 'woocommerce') {
        syncResult = await pushOrderToWooCommerce(orderData, creds as WooCommerceCredentials);
      }

      if (syncResult) {
        results.platform_sync = syncResult;

        if (syncResult.success) {
          // Save the platform order number back to Ittisalo DB
          await supabase
            .from('orders')
            .update({
              platform_source: platform,
              platform_order_id: syncResult.platform_order_id,
              platform_order_number: syncResult.platform_order_number,
              platform_synced_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          console.log(
            `[orders/sync] ✅ Order ${order.id} synced to ${platform} as ${syncResult.platform_order_number}`
          );
        } else {
          console.error(`[orders/sync] ❌ Platform sync failed: ${syncResult.error}`);
        }
      }
    } else {
      console.log(`[orders/sync] No e-commerce platform configured for tenant ${order.tenant_id}. Skipping platform push.`);
      results.platform_sync = { skipped: true, reason: 'No platform credentials configured' };
    }

    // ── 5. Send confirmation email (if customer email exists) ────────────────
    if (order.customer_email) {
      console.log(`[orders/sync] Sending confirmation email to ${order.customer_email}...`);

      const emailResult = await sendOrderConfirmationEmail(
        {
          ...orderData,
          platform_order_number: results.platform_sync?.platform_order_number || null,
        },
        businessName
      );

      results.email = emailResult;

      if (emailResult.success) {
        await supabase
          .from('orders')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', order.id);

        console.log(`[orders/sync] ✅ Confirmation email sent to ${order.customer_email}`);
      } else {
        console.error(`[orders/sync] ❌ Email failed: ${emailResult.error}`);
      }
    } else {
      console.log(`[orders/sync] No customer email on order. Skipping email.`);
      results.email = { skipped: true, reason: 'No customer email' };
    }

    // ── 6. Return summary ────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      order_id: order.id,
      platform_order_number: results.platform_sync?.platform_order_number || null,
      platform_source: platformCreds?.platform || null,
      email_sent: results.email?.success || false,
      details: results,
    });
  } catch (err: any) {
    console.error(`[orders/sync] Unhandled error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
