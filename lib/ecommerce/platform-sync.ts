/**
 * Ittisalo — E-Commerce Platform Sync Utilities
 * 
 * Handles pushing confirmed orders to Shopify/WooCommerce and
 * fetching the real platform order number back.
 */

import { decrypt } from '@/lib/crypto';

export interface OrderData {
  id: string;
  tenant_id: string;
  customer_name: string | null;
  customer_phone: string;
  customer_email: string | null;
  items: Array<{ name: string; qty: number; price: number; size?: string; variant?: string }>;
  order_amount: number;
  currency: string;
  delivery_address: string | null;
  payment_method: string | null;
  notes: string | null;
  source: string;
}

export interface ShopifyCredentials {
  store_domain: string;   // e.g. "mystore.myshopify.com"
  access_token: string;   // e.g. "shpat_xxxx"
}

export interface WooCommerceCredentials {
  store_url?: string;      // e.g. "https://mysite.com"
  site_url?: string;       // e.g. "https://mysite.com" (alternative key used in frontend)
  consumer_key: string;    // e.g. "ck_xxxx"
  consumer_secret: string; // e.g. "cs_xxxx"
}

export interface PlatformSyncResult {
  success: boolean;
  platform_order_id: string | null;
  platform_order_number: string | null;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shopify Order Push
// ─────────────────────────────────────────────────────────────────────────────

export async function pushOrderToShopify(
  order: OrderData,
  creds: ShopifyCredentials
): Promise<PlatformSyncResult> {
  try {
    const nameParts = (order.customer_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const response = await fetch(
      `https://${creds.store_domain}/admin/api/2024-10/orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': decrypt(creds.access_token) || '',
        },
        body: JSON.stringify({
          order: {
            line_items: (order.items || []).map(item => ({
              title: item.name || 'Product',
              quantity: item.qty || 1,
              price: String(item.price || 0),
            })),
            customer: {
              first_name: firstName,
              last_name: lastName,
              phone: order.customer_phone,
              ...(order.customer_email ? { email: order.customer_email } : {}),
            },
            shipping_address: {
              first_name: firstName,
              last_name: lastName,
              address1: order.delivery_address || 'To be confirmed',
              phone: order.customer_phone,
              country: 'US',
            },
            financial_status: 'pending',
            fulfillment_status: null,
            note: `Created by Ittisalo CRM. Chat order via ${order.source || 'whatsapp'}. Ittisalo ID: ${order.id}`,
            tags: 'ittisalo-synced',
            send_receipt: false,
            send_fulfillment_receipt: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        platform_order_id: null,
        platform_order_number: null,
        error: `Shopify API ${response.status}: ${JSON.stringify(errorData)}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      platform_order_id: String(data.order.id),
      platform_order_number: data.order.name, // e.g. "#1042"
    };
  } catch (err: any) {
    return {
      success: false,
      platform_order_id: null,
      platform_order_number: null,
      error: `Shopify push failed: ${err.message}`,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WooCommerce Order Push
// ─────────────────────────────────────────────────────────────────────────────

export async function pushOrderToWooCommerce(
  order: OrderData,
  creds: WooCommerceCredentials
): Promise<PlatformSyncResult> {
  try {
    const nameParts = (order.customer_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // WooCommerce uses Basic Auth with consumer key/secret
    const consumerKey = decrypt(creds.consumer_key) || '';
    const consumerSecret = decrypt(creds.consumer_secret) || '';
    const authHeader =
      'Basic ' +
      Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    // Normalize store URL — strip trailing slash
    const storeUrl = (creds.site_url || creds.store_url || '').replace(/\/+$/, '');
    if (!storeUrl) {
      return {
        success: false,
        platform_order_id: null,
        platform_order_number: null,
        error: `WooCommerce push failed: site_url/store_url is missing in credentials`,
      };
    }

    // Attempt to resolve WooCommerce product IDs by searching the catalog by name
    const resolvedLineItems = await Promise.all(
      (order.items || []).map(async item => {
        let productId = null;
        if (item.name) {
          try {
            const searchRes = await fetch(
              `${storeUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(item.name)}&per_page=1`,
              { headers: { Authorization: authHeader } }
            );
            if (searchRes.ok) {
              const products = await searchRes.json();
              if (products && products.length > 0) {
                productId = products[0].id;
              }
            }
          } catch (e) {
            console.error('WooCommerce product search failed', e);
          }
        }
        return {
          product_id: productId,
          name: item.name || 'Product',
          quantity: item.qty || 1,
          total: String((item.price || 0) * (item.qty || 1)),
        };
      })
    );

    // WooCommerce requires product_id for line_items. If it's null, we push it as a fee_line instead so the order still goes through.
    const validLineItems = resolvedLineItems.filter(i => i.product_id !== null).map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      total: i.total,
    }));
    
    const feeLines = resolvedLineItems.filter(i => i.product_id === null).map(i => ({
      name: `${i.quantity}x ${i.name}`,
      total: i.total,
    }));

    const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        status: 'processing',
        payment_method: 'cod',
        payment_method_title: 'Cash on Delivery',
        set_paid: false,
        currency: order.currency || 'USD',
        billing: {
          first_name: firstName,
          last_name: lastName,
          phone: order.customer_phone,
          email: order.customer_email || '',
          address_1: order.delivery_address || '',
        },
        shipping: {
          first_name: firstName,
          last_name: lastName,
          address_1: order.delivery_address || '',
          phone: order.customer_phone,
        },
        line_items: validLineItems,
        fee_lines: feeLines,
        meta_data: [
          { key: '_ittisalo_synced', value: 'true' },
          { key: '_ittisalo_order_id', value: order.id },
          { key: '_ittisalo_source', value: order.source || 'whatsapp' },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        platform_order_id: null,
        platform_order_number: null,
        error: `WooCommerce API ${response.status}: ${JSON.stringify(errorData)}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      platform_order_id: String(data.id),
      platform_order_number: `#${data.number}`, // e.g. "#456"
    };
  } catch (err: any) {
    return {
      success: false,
      platform_order_id: null,
      platform_order_number: null,
      error: `WooCommerce push failed: ${err.message}`,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation Email (Resend)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  order: OrderData & { platform_order_number?: string | null },
  businessName: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  if (!order.customer_email) {
    return { success: false, error: 'No customer email available' };
  }

  const orderNumber = order.platform_order_number || order.id.slice(0, 8).toUpperCase();
  const itemsHtml = (order.items || [])
    .map(
      i =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px">${i.qty || 1}x ${i.name || 'Product'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;text-align:right">${order.currency || 'USD'} ${i.price || 0}</td>
        </tr>`
    )
    .join('');

  const fromDomain = process.env.RESEND_FROM_DOMAIN || 'resend.dev';
  const fromEmail = process.env.RESEND_FROM_EMAIL || `onboarding@resend.dev`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${businessName || 'Ittisalo'} <${fromEmail}>`,
        to: order.customer_email,
        subject: `Order Confirmed — ${orderNumber}`,
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937">
            <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px;border-radius:16px 16px 0 0;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:24px">Order Confirmed ✅</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Thank you for your order, ${order.customer_name || 'Customer'}!</p>
            </div>
            
            <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none">
              <div style="background:#fef2f2;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center">
                <span style="font-size:13px;color:#991b1b;font-weight:600">Order Number</span>
                <div style="font-size:28px;font-weight:800;color:#dc2626;margin-top:4px">${orderNumber}</div>
              </div>

              <h3 style="font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px">Items Ordered</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                ${itemsHtml}
                <tr style="background:#f9fafb">
                  <td style="padding:12px;font-weight:700;font-size:15px">Total</td>
                  <td style="padding:12px;font-weight:800;font-size:18px;text-align:right;color:#dc2626">${order.currency || 'USD'} ${order.order_amount || 0}</td>
                </tr>
              </table>

              ${order.delivery_address ? `
              <div style="border-top:1px solid #f3f4f6;padding-top:16px;margin-top:8px">
                <h4 style="font-size:13px;color:#6b7280;margin:0 0 6px">📍 Delivery Address</h4>
                <p style="margin:0;font-size:14px;color:#374151">${order.delivery_address}</p>
              </div>` : ''}

              <div style="border-top:1px solid #f3f4f6;padding-top:16px;margin-top:16px">
                <h4 style="font-size:13px;color:#6b7280;margin:0 0 6px">💳 Payment Method</h4>
                <p style="margin:0;font-size:14px;color:#374151;font-weight:600">${order.payment_method || 'Cash on Delivery'}</p>
              </div>
            </div>

            <div style="background:#f9fafb;padding:20px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;text-align:center">
              <p style="font-size:13px;color:#6b7280;margin:0">You'll receive shipping updates on WhatsApp.</p>
              <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">Powered by ${businessName || 'Ittisalo'}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: `Resend API ${response.status}: ${JSON.stringify(errorData)}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Email send failed: ${err.message}` };
  }
}
