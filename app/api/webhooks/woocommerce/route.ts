import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Determine the event type from WooCommerce headers
    const event = req.headers.get('x-wc-webhook-event');
    if (!event) {
      return NextResponse.json({ error: 'Missing WooCommerce event header' }, { status: 400 });
    }

    const payload = await req.json();
    console.log(`[WooCommerce Webhook] Received ${event} for order ID: ${payload.id}`);

    // Since a webhook can come from any tenant, we need to map the store to a tenant_id.
    // However, the webhook doesn't pass the tenant_id explicitly. 
    // We can lookup the tenant_id by matching the `site_url` or simply passing `?tenant_id=XXX` in the webhook URL.
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id');

    if (!tenantId) {
      console.error('[WooCommerce Webhook] ❌ tenant_id is missing from webhook URL query parameters.');
      return NextResponse.json({ error: 'tenant_id required in query params' }, { status: 400 });
    }

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
