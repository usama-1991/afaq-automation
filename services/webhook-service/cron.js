import cron from 'node-cron';
import OpenAI from 'openai';
import { decrypt } from './crypto.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

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
    return { waPhoneNumberId: tenant.wa_phone_number_id, waAccessToken: decrypt(tenant.wa_token_enc) };
  }

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials, external_account_id')
    .eq('tenant_id', tenantId)
    .eq('platform', 'meta')
    .maybeSingle();

  if (integration?.credentials) {
    waPhoneNumberId = integration.credentials.phone_number_id || integration.external_account_id || '';
    waAccessToken = decrypt(integration.credentials.access_token) || '';
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

  // =========================================================================
  // Phase 5: Google Calendar Watch Renewal (Runs daily at midnight)
  // =========================================================================
  cron.schedule('0 0 * * *', async () => {
    console.log('[cron] Running Google Calendar Watch Renewal Check...');
    
    // Look for active google integrations expiring in less than 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const cutoffDate = twoDaysFromNow.toISOString();

    const { data: integrations, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('provider', 'google')
      .eq('is_active', true)
      .lt('webhook_expires_at', cutoffDate);

    if (error) {
      console.error('[cron] Error fetching expiring Google integrations:', error.message);
      return;
    }

    for (const int of integrations) {
      try {
        console.log(`[cron] Renewing Google Calendar watch for tenant ${int.tenant_id}...`);
        
        let gToken = int.access_token;
        const isExpired = new Date(int.token_expires_at).getTime() < Date.now() + 60000;
        if (isExpired && int.refresh_token) {
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: int.refresh_token,
              grant_type: 'refresh_token',
            }),
          });
          if (tokenRes.ok) {
            const tData = await tokenRes.json();
            gToken = tData.access_token;
            await supabase.from('calendar_integrations').update({
              access_token: gToken,
              token_expires_at: new Date(Date.now() + tData.expires_in * 1000).toISOString()
            }).eq('id', int.id);
          }
        }

        const channelId = `ch-${int.tenant_id}-${Date.now()}`;
        const watchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${int.primary_calendar_id}/events/watch`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: channelId,
            type: 'web_hook',
            address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/google-calendar`
          })
        });

        if (watchRes.ok) {
          const watchData = await watchRes.json();
          // Stop old channel if we have resource ID
          if (int.webhook_resource_id) {
            await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${gToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                id: int.webhook_subscription_id,
                resourceId: int.webhook_resource_id
              })
            }).catch(() => console.log('Old channel stop failed, ignoring'));
          }

          await supabase.from('calendar_integrations').update({
            webhook_subscription_id: channelId,
            webhook_resource_id: watchData.resourceId,
            webhook_expires_at: new Date(parseInt(watchData.expiration)).toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', int.id);
          
          console.log(`[cron] Successfully renewed watch for tenant ${int.tenant_id}`);
        } else {
          console.error(`[cron] Failed to renew watch: ${await watchRes.text()}`);
        }
      } catch (err) {
        console.error(`[cron] Error renewing watch for tenant ${int.tenant_id}:`, err.message);
      }
    }
  });

  // =========================================================================
  // KB Embedding Backfill (Runs every 15 minutes)
  // Generates text-embedding-3-small vector embeddings for newly uploaded KB docs
  // =========================================================================
  let isBackfillRunning = false;

  cron.schedule('*/15 * * * *', async () => {
    if (isBackfillRunning) {
      console.log('[cron] KB embedding backfill already in progress, skipping overlapping tick.');
      return;
    }
    isBackfillRunning = true;

    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('[cron] Skipping KB embedding backfill: OPENAI_API_KEY not set.');
        return;
      }

      const { data: rows, error } = await supabase
        .from('knowledge_base')
        .select('id, title, content')
        .filter('embedding', 'is', null)
        .eq('is_active', true)
        .limit(25); // Batched in chunks of 25 to protect concurrency and rate limits

      if (error) {
        console.error('[cron] Error querying un-embedded KB rows:', error.message);
        return;
      }

      if (!rows || rows.length === 0) {
        return; // Nothing to backfill
      }

      console.log(`[cron] Found ${rows.length} KB document(s) missing embeddings. Backfilling batch...`);

      for (const row of rows) {
        try {
          const textToEmbed = `[${row.title || ''}]\n${row.content || ''}`.trim();
          if (!textToEmbed) continue;

          const embedResp = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: textToEmbed,
          });

          const embedding = embedResp.data?.[0]?.embedding;
          if (embedding) {
            await supabase
              .from('knowledge_base')
              .update({ embedding })
              .eq('id', row.id);
            console.log(`[cron] Successfully backfilled embedding for KB row ${row.id}`);
          }
        } catch (embedErr) {
          console.error(`[cron] Failed to embed KB row ${row.id}:`, embedErr.message);
        }
      }
    } catch (err) {
      console.error('[cron] Error in KB embedding backfill job:', err.message);
    } finally {
      isBackfillRunning = false;
    }
  });
}

