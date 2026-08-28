// lib/notify-status.ts
// Client & Server helper to send immediate WhatsApp status updates when dashboard buttons are clicked

import { supabase } from '@/lib/supabase/client';
import { decrypt } from '@/lib/crypto';

export async function notifyOrderStatusUpdate(orderId: string, newStatus: string) {
  try {
    // 1. Fetch order details
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (!order || !order.customer_phone) return;

    // 2. Fetch tenant WhatsApp credentials
    const { data: tenant } = await supabase
      .from('tenants')
      .select('wa_phone_number_id, wa_token_enc, business_name')
      .eq('id', order.tenant_id)
      .single();

    if (!tenant || !tenant.wa_phone_number_id || !tenant.wa_token_enc) {
      console.warn('[notifyStatus] Missing WhatsApp credentials on tenant');
      return;
    }

    const waToken = decrypt(tenant.wa_token_enc);
    const businessName = tenant.business_name || 'Gourmet Bites Bistro';
    const customerName = order.customer_name || 'Customer';
    let messageText = '';

    if (newStatus === 'confirmed') {
      messageText = `Hi ${customerName}, your order has been confirmed by ${businessName} ✅! We are getting it ready for you!`;
    } else if (newStatus === 'preparing') {
      messageText = `Hi ${customerName}, your order is currently being prepared in the kitchen 🍳! It will be ready shortly!`;
    } else if (newStatus === 'dispatched') {
      messageText = `Great news ${customerName}! 🎉 Your order is on the way 🚚💨! Get ready to receive it soon!`;
    } else if (newStatus === 'delivered') {
      messageText = `Hi ${customerName}, your order has been delivered 📦! We hope you enjoy your meal 🍔🎉!\n\nPlease reply with a rating (1 to 5 stars) and a short review of your experience. Your feedback means the world to ${businessName}!`;
    } else if (newStatus === 'cancelled') {
      messageText = `Hi ${customerName}, your order has been cancelled ❌. Please reach out if you have any questions.`;
    }

    if (!messageText) return;

    const toPhone = order.customer_phone.replace(/\D/g, '');
    const metaUrl = `https://graph.facebook.com/v21.0/${tenant.wa_phone_number_id}/messages`;

    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waToken}`,
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

    const resData = await response.json();
    console.log('[notifyStatus] WhatsApp status update sent:', resData);

    // Save outbound message to conversation history so it shows in CRM Live Chat UI
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('tenant_id', order.tenant_id)
      .eq('external_conversation_id', toPhone)
      .maybeSingle();

    if (conv) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_type: 'bot',
        content: messageText,
        external_message_id: resData.messages?.[0]?.id || `sys_${Date.now()}`
      });
    }
  } catch (err: any) {
    console.error('[notifyStatus] Error sending WhatsApp status update:', err.message);
  }
}
