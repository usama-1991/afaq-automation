import cron from 'node-cron';

// Helper to get Meta credentials
async function getMetaCredentials(supabase, tenantId) {
  let waPhoneNumberId = '';
  let waAccessToken = '';

  const { data: tenant } = await supabase
    .from('tenants')
    .select('wa_phone_number_id, wa_token_enc')
    .eq('id', tenantId)
    .single();

  if (tenant?.wa_phone_number_id && tenant?.wa_token_enc) {
    return { waPhoneNumberId: tenant.wa_phone_number_id, waAccessToken: tenant.wa_token_enc };
  }

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials, external_account_id')
    .eq('tenant_id', tenantId)
    .eq('platform', 'meta')
    .maybeSingle();

  if (integration?.credentials) {
    waPhoneNumberId = integration.credentials.phone_number_id || integration.external_account_id || '';
    waAccessToken = integration.credentials.access_token || '';
  }

  // Fallbacks
  waPhoneNumberId = waPhoneNumberId || process.env.META_PHONE_NUMBER_ID || '';
  waAccessToken = waAccessToken || process.env.META_ACCESS_TOKEN || '';

  return { waPhoneNumberId, waAccessToken };
}

// Send WhatsApp Message helper
async function sendWhatsAppMessage(phone, messageText, waPhoneNumberId, waAccessToken) {
  const toPhone = phone.replace(/\D/g, '');
  const url = `https://graph.facebook.com/v21.0/${waPhoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${waAccessToken}`,
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
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Meta API failed');
  }
  return data;
}

export function startCronJobs(supabase) {
  console.log('[cron] Automated Cron Jobs scheduled.');

  // =========================================================================
  // Workflow 3: Appointment Reminders (Runs every hour at minute 0)
  // =========================================================================
  cron.schedule('0 * * * *', async () => {
    console.log('[cron] Running Appointment Reminders Check...');
    
    // Calculate tomorrow's date (YYYY-MM-DD)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, tenant_id, patient_name, patient_phone, appointment_time')
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .eq('appointment_date', tomorrowStr);

    if (error) {
      console.error('[cron] Error fetching appointments:', error.message);
      return;
    }

    for (const appt of appointments) {
      try {
        const { waPhoneNumberId, waAccessToken } = await getMetaCredentials(supabase, appt.tenant_id);
        if (!waPhoneNumberId || !waAccessToken) continue;

        const time = appt.appointment_time ? ` at ${appt.appointment_time}` : '';
        const msg = `Hi ${appt.patient_name || 'Customer'}, this is a friendly reminder for your appointment tomorrow${time}. We look forward to seeing you. Reply if you need to reschedule!`;

        await sendWhatsAppMessage(appt.patient_phone, msg, waPhoneNumberId, waAccessToken);

        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', appt.id);
          
        console.log(`[cron] Reminder sent for appointment ${appt.id}`);
      } catch (err) {
        console.error(`[cron] Failed to send reminder for appointment ${appt.id}:`, err.message);
      }
    }
  });

  // =========================================================================
  // Workflow 5: Lead Follow-up (Runs daily at 10:00 AM server time)
  // =========================================================================
  cron.schedule('0 10 * * *', async () => {
    console.log('[cron] Running Daily Lead Follow-up Check...');
    
    // 48 hours ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    const cutoffDate = twoDaysAgo.toISOString();

    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, tenant_id, customer_name, customer_phone')
      .eq('temperature', 'warm')
      .neq('stage', 'closed_won')
      .neq('stage', 'closed_lost')
      .lt('last_activity_at', cutoffDate);

    if (error) {
      console.error('[cron] Error fetching leads:', error.message);
      return;
    }

    for (const lead of leads) {
      try {
        const { waPhoneNumberId, waAccessToken } = await getMetaCredentials(supabase, lead.tenant_id);
        if (!waPhoneNumberId || !waAccessToken) continue;

        const msg = `Hi ${lead.customer_name || 'there'}, are you still interested in finding a property? Let us know if you'd like to schedule a visit for any of the options we shared!`;

        await sendWhatsAppMessage(lead.customer_phone, msg, waPhoneNumberId, waAccessToken);

        // Downgrade to cold and bump activity time so it doesn't run again until warmed up
        await supabase
          .from('leads')
          .update({ temperature: 'cold', last_activity_at: new Date().toISOString() })
          .eq('id', lead.id);

        console.log(`[cron] Follow-up sent for lead ${lead.id}`);
      } catch (err) {
        console.error(`[cron] Failed to send follow-up for lead ${lead.id}:`, err.message);
      }
    }
  });

  // =========================================================================
  // Phase 5: Automated Cart Abandonment (Runs every 30 mins)
  // =========================================================================
  cron.schedule('*/30 * * * *', async () => {
    console.log('[cron] Running Cart Abandonment Check...');
    
    // Find pending orders older than 2 hours where abandonment msg hasn't been sent
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    const cutoffDate = twoHoursAgo.toISOString();

    const { data: abandonedOrders, error } = await supabase
      .from('orders')
      .select('id, tenant_id, customer_name, customer_phone')
      .eq('status', 'pending')
      .eq('cart_abandonment_sent', false)
      .lt('updated_at', cutoffDate);

    if (error) {
      console.error('[cron] Error fetching abandoned orders:', error.message);
      return;
    }

    for (const order of abandonedOrders) {
      try {
        const { waPhoneNumberId, waAccessToken } = await getMetaCredentials(supabase, order.tenant_id);
        if (!waPhoneNumberId || !waAccessToken) continue;

        const customerName = order.customer_name ? order.customer_name.split(' ')[0] : 'there';
        const msg = `Hi ${customerName}, we noticed you left some items in your cart! 🛒 Do you need any help completing your order? Reply to chat with our team.`;

        await sendWhatsAppMessage(order.customer_phone, msg, waPhoneNumberId, waAccessToken);

        // Mark as sent
        await supabase
          .from('orders')
          .update({ cart_abandonment_sent: true, updated_at: new Date().toISOString() })
          .eq('id', order.id);

        console.log(`[cron] Cart abandonment sent for order ${order.id}`);
      } catch (err) {
        console.error(`[cron] Failed to send cart abandonment for order ${order.id}:`, err.message);
      }
    }
  });
}
