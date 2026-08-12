import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const payload = await req.json();
    console.log(`[Shopify Webhook] Received ${topic} for order ID: ${payload.id}`);

    // Since a webhook can come from any tenant, we need to map the store to a tenant_id.
    // However, the webhook doesn't pass the tenant_id explicitly. 
    // We can lookup the tenant_id by matching the store URL or passing `?tenant_id=XXX` in the webhook URL.
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id');

    if (!tenantId) {
      console.error('[Shopify Webhook] ❌ tenant_id is missing from webhook URL query parameters.');
      return NextResponse.json({ error: 'tenant_id required in query params' }, { status: 400 });
    }

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
