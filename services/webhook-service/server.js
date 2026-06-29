import Fastify from 'fastify';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const fastify = Fastify({ logger: true });

// Initialize Supabase Client with Service Role Key
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  fastify.log.error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws,
  },
});

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'webhook-service' };
});

// Meta Webhook Verification
fastify.get('/webhook', async (request, reply) => {
  const mode = request.query['hub.mode'];
  const token = request.query['hub.verify_token'];
  const challenge = request.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      return challenge;
    } else {
      reply.code(403).send('Forbidden');
    }
  } else {
    reply.code(400).send('Bad Request');
  }
});

// Audit Logging Helper
async function logAudit(tenantId, action, details) {
  try {
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      action: action,
      details: details
    });
  } catch (err) {
    fastify.log.error(`Failed to write audit log: ${err.message}`);
  }
}

async function processIncomingMessage(platform, externalAccountId, customerId, customerName, messageText, messageId) {
  fastify.log.info(`[${platform}] Processing message ${messageId} from ${customerId}`);

  // 0. Deduplication: skip if we've already stored this exact message
  if (messageId) {
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('external_message_id', messageId)
      .maybeSingle();
    if (existing) {
      fastify.log.info(`[${platform}] Duplicate message ${messageId} — skipping.`);
      return;
    }
  }

  // 1. Lookup Tenant ID by External Account ID
  const { data: integration, error: intError } = await supabase
    .from('integrations')
    .select('tenant_id')
    .eq('platform', platform)
    .eq('external_account_id', externalAccountId)
    .single();

  if (intError || !integration) {
    fastify.log.error(`[${platform}] No tenant found for account ID: ${externalAccountId}. Error: ${intError?.message}`);
    return;
  }
  fastify.log.info(`[${platform}] Tenant found: ${integration.tenant_id}`);

  const tenantId = integration.tenant_id;

  // 1b. Fetch full tenant record for niche context (used by n8n routing)
  let tenantNiche = 'general';
  let tenantBusinessName = '';
  let tenantMetadata = {};
  try {
    const { data: tenantRecord } = await supabase
      .from('tenants')
      .select('niche, business_name, metadata')
      .eq('id', tenantId)
      .single();
    if (tenantRecord) {
      tenantNiche = tenantRecord.niche || 'general';
      tenantBusinessName = tenantRecord.business_name || '';
      tenantMetadata = tenantRecord.metadata || {};
    }
  } catch (e) {
    fastify.log.warn(`[${platform}] Could not fetch tenant niche: ${e.message}`);
  }

  // 2. Find or Create Conversation (safe: handles duplicates + race conditions)
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id, unread_count, status')
    .eq('tenant_id', tenantId)
    .eq('external_conversation_id', customerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!conversation) {
    fastify.log.info(`[${platform}] Creating new conversation for ${customerId}`);
    const { data: newConv, error: newConvError } = await supabase
      .from('conversations')
      .upsert({
        tenant_id: tenantId,
        platform: platform,
        external_conversation_id: customerId,
        customer_name: customerName
      }, { onConflict: 'tenant_id,external_conversation_id', ignoreDuplicates: false })
      .select('id, unread_count, status')
      .single();

    if (newConvError) {
      // Race condition: another request created it — fetch it now
      const { data: retryConv, error: retryErr } = await supabase
        .from('conversations')
        .select('id, unread_count, status')
        .eq('tenant_id', tenantId)
        .eq('external_conversation_id', customerId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!retryConv) {
        fastify.log.error(`[${platform}] Failed to create conversation: ${newConvError.message}`);
        throw newConvError;
      }
      conversation = retryConv;
    } else {
      conversation = newConv;
    }
    fastify.log.info(`[${platform}] Conversation ready: ${conversation.id}`);
    await logAudit(tenantId, 'conversation_started', { platform, external_conversation_id: customerId, customer_name: customerName });
  } else {
    fastify.log.info(`[${platform}] Existing conversation found: ${conversation.id}`);
    await supabase
      .from('conversations')
      .update({ customer_name: customerName, updated_at: new Date().toISOString() })
      .eq('id', conversation.id);
  }

  // 3. Insert Message & Update Counter
  fastify.log.info(`[${platform}] Inserting message and incrementing unread_count`);
  const { data: savedMessage, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      content: messageText,
      external_message_id: messageId
    })
    .select('id')
    .single();

  if (msgError) {
    if (msgError.code === '23505') {
      fastify.log.info(`[${platform}] Duplicate message caught by DB unique constraint: ${messageId}. Skipping.`);
      return;
    }
    fastify.log.error(`[${platform}] Failed to insert message: ${msgError.message}`);
    throw msgError;
  }

  // Log incoming message to Audit Logs
  await logAudit(tenantId, 'message_received', { platform, external_message_id: messageId, conversation_id: conversation.id });

  // Increment unread_count
  const currentCount = conversation?.unread_count || 0;
  await supabase
    .from('conversations')
    .update({ 
      updated_at: new Date().toISOString(),
      unread_count: currentCount + 1 
    })
    .eq('id', conversation.id);

  fastify.log.info(`[${platform}] Message inserted and counter updated to ${currentCount + 1}.`);

  // 3b. Human handoff gate: if conversation is 'pending', skip AI — human is handling it
  if (conversation?.status === 'pending') {
    fastify.log.info(`[${platform}] Conversation ${conversation.id} is in human handoff (pending). Skipping n8n AI.`);
    return;
  }

  // 4. Fetch enrichment data in parallel before firing n8n
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    try {
      // Fetch knowledge base, conversation history, integrations, and agent config in parallel
      const [kbResult, historyResult, integResult, agentResult] = await Promise.allSettled([

        // Knowledge base for this tenant
        supabase
          .from('knowledge_base')
          .select('kb_type, title, content')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .limit(20),

        // Last 10 messages in this conversation for context
        supabase
          .from('messages')
          .select('sender_type, content, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(10),

        // Integration credentials (WooCommerce, Google Calendar, etc.)
        supabase
          .from('integrations')
          .select('platform, external_account_id, credentials')
          .eq('tenant_id', tenantId),

        // Agent config (name, prompt, tone)
        supabase
          .from('agent_configs')
          .select('name, prompt, tone, language')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .maybeSingle(),
      ]);

      // Safely extract results
      const knowledgeBase = kbResult.status === 'fulfilled' ? (kbResult.value.data || []) : [];
      const conversationHistory = historyResult.status === 'fulfilled'
        ? (historyResult.value.data || []).reverse() // chronological order
        : [];
      const integrations = integResult.status === 'fulfilled' ? (integResult.value.data || []) : [];
      const agentConfig = agentResult.status === 'fulfilled' ? (agentResult.value.data || {}) : {};

      // Build a map of integrations keyed by platform for easy lookup in n8n
      const integMap = {};
      for (const integ of integrations) {
        integMap[integ.platform] = integ.credentials || {};
      }

      // Find Meta credentials (fallback to env vars)
      const metaCreds = integMap['meta'] || {};

      // Fetch existing conversation context (previous intent/funnel stage)
      const { data: existingContext } = await supabase
        .from('conversation_context')
        .select('last_intent, funnel_stage, context_data')
        .eq('conversation_id', conversation.id)
        .maybeSingle();

      // Use simpler payload for v4 workflow
      const n8nPayload = {
        tenant_id: tenantId,
        customer_phone: customerId,
        customer_name: customerName,
        platform: platform,
        message_type: 'text',
        message: messageText,
        external_message_id: messageId,
        phone_number_id: metaCreds.phone_number_id || process.env.META_PHONE_NUMBER_ID || '',
        timestamp: new Date().toISOString()
      };

      fastify.log.info(`[${platform}] Firing n8n with niche="${tenantNiche}", kb=${knowledgeBase.length} items, history=${conversationHistory.length} msgs`);

      fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify(n8nPayload),
      }).catch(err => fastify.log.error(`Failed to trigger n8n: ${err.message}`));

    } catch (enrichErr) {
      fastify.log.error(`[${platform}] Enrichment failed, firing n8n with minimal payload: ${enrichErr.message}`);
      // Fallback: fire n8n with minimal payload so the customer still gets a reply
      fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.N8N_API_KEY || '' },
        body: JSON.stringify({
          tenant_id: tenantId,
          customer_phone: customerId,
          customer_name: customerName,
          platform: platform,
          message_type: 'text',
          message: messageText,
          external_message_id: messageId,
          phone_number_id: process.env.META_PHONE_NUMBER_ID || '',
          timestamp: new Date().toISOString()
        }),
      }).catch(err => fastify.log.error(`Fallback n8n trigger failed: ${err.message}`));
    }
  }
}

// Helper to handle campaign message delivery statuses and aggregate counts
async function processMessageStatus(statusObj) {
  const metaMessageId = statusObj.id;
  const deliveryStatus = statusObj.status; // sent, delivered, read, failed
  
  fastify.log.info(`[whatsapp] Message status update: ${metaMessageId} -> ${deliveryStatus}`);
  
  // 1. Find if this message belongs to a campaign
  const { data: campMsg } = await supabase
    .from('campaign_messages')
    .select('campaign_id')
    .eq('meta_message_id', metaMessageId)
    .single();

  if (!campMsg) return; // Not a campaign message

  // 2. Update the campaign_messages row
  await supabase
    .from('campaign_messages')
    .update({ 
      status: deliveryStatus,
      updated_at: new Date().toISOString()
    })
    .eq('meta_message_id', metaMessageId);

  // 3. Aggregate stats and update the campaigns table
  const { data: allMsgs } = await supabase
    .from('campaign_messages')
    .select('status')
    .eq('campaign_id', campMsg.campaign_id);
    
  if (allMsgs) {
    const sent_count = allMsgs.filter(m => ['sent', 'delivered', 'read'].includes(m.status)).length;
    const delivered_count = allMsgs.filter(m => ['delivered', 'read'].includes(m.status)).length;
    const read_count = allMsgs.filter(m => m.status === 'read').length;
    const failed_count = allMsgs.filter(m => m.status === 'failed').length;

    await supabase
      .from('campaigns')
      .update({
        sent_count,
        delivered_count,
        read_count,
        failed_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', campMsg.campaign_id);
  }
}

// Meta Webhook Event Receiver
fastify.post('/webhook', async (request, reply) => {
  const body = request.body;
  fastify.log.info('--- NEW WEBHOOK EVENT ---');
  fastify.log.info(JSON.stringify(body, null, 2));
  
  const supportedObjects = ['whatsapp_business_account', 'page', 'instagram'];

  if (supportedObjects.includes(body.object)) {
    try {
      for (const entry of body.entry) {

        // ── WhatsApp ──────────────────────────────────────────────────
        if (body.object === 'whatsapp_business_account') {
          for (const change of entry.changes) {
            
            // 1. Handle Template Status Updates
            if (change.field === 'message_template_status_update') {
              const { message_template_id, event } = change.value;
              fastify.log.info(`[whatsapp] Template status update: ${message_template_id} -> ${event}`);
              await supabase
                .from('templates')
                .update({ status: event })
                .eq('meta_template_id', message_template_id);
              continue;
            }

            // 2. Handle Message Delivery Statuses
            if (change.value && change.value.statuses) {
              for (const statusObj of change.value.statuses) {
                await processMessageStatus(statusObj);
              }
            }

            // 3. Handle Incoming Messages
            if (change.value && change.value.messages) {
              const phoneNumberId = change.value.metadata.phone_number_id;
              const message = change.value.messages[0];
              const contact = change.value.contacts[0];
              const customerPhone = message.from;
              const customerName = contact.profile.name;
              const messageText = message.text ? message.text.body : '';
              const messageId = message.id;
              // Skip if this is an echo (message sent by the business)
              if (message.from === phoneNumberId || message.from === change.value.metadata.display_phone_number) {
                fastify.log.info('[whatsapp] Skipping echo message');
                continue;
              }

              await processIncomingMessage('whatsapp', phoneNumberId, customerPhone, customerName, messageText, messageId);
            }
          }
        }

        // ── Messenger ─────────────────────────────────────────────────
        else if (body.object === 'page') {
          if (entry.messaging) {
            for (const event of entry.messaging) {
              if (event.message && !event.message.is_echo) {
                const pageId = entry.id;
                const customerPsid = event.sender.id;
                const messageText = event.message.text || '';
                const messageId = event.message.mid;

                // ── Resolve real Messenger name (multi-strategy) ─────────
                let customerName = 'Messenger User';
                try {
                  const token = process.env.MESSENGER_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

                  // Strategy 1: Name in webhook payload (rare but possible)
                  if (event.sender?.name) {
                    customerName = event.sender.name;
                    fastify.log.info(`[messenger] Name from payload: ${customerName}`);
                  }

                  // Strategy 2: Page Conversations API — lists thread participants by name
                  else if (token) {
                    const convRes = await fetch(
                      `https://graph.facebook.com/v19.0/${pageId}/conversations?user_id=${customerPsid}&fields=participants&access_token=${token}`
                    );
                    const convData = await convRes.json();
                    const participants = convData?.data?.[0]?.participants?.data || [];
                    fastify.log.info(`[messenger] Conversations API participants: ${JSON.stringify(participants)}`);
                    const user = participants.find(p => p.id !== pageId);
                    if (user?.name && user.name !== 'Facebook User') {
                      customerName = user.name;
                      fastify.log.info(`[messenger] Name from Conversations API: ${customerName}`);
                    }

                    // Strategy 3: Try fetching via messaging profile (works for some app permissions)
                    if (customerName === 'Messenger User') {
                      const profileRes = await fetch(
                        `https://graph.facebook.com/v19.0/${customerPsid}?fields=name,first_name,last_name&access_token=${token}`
                      );
                      const profileData = await profileRes.json();
                      fastify.log.info(`[messenger] Profile API response: ${JSON.stringify(profileData)}`);
                      if (profileData.name) customerName = profileData.name;
                      else if (profileData.first_name) customerName = `${profileData.first_name} ${profileData.last_name || ''}`.trim();
                    }
                  }
                } catch (e) {
                  fastify.log.warn(`[messenger] Name fetch failed: ${e.message}`);
                }

                fastify.log.info(`[messenger] Resolved customer name: "${customerName}" for PSID ${customerPsid}`);
                await processIncomingMessage('messenger', pageId, customerPsid, customerName, messageText, messageId);

              }
            }
          }
        }

        // ── Instagram ─────────────────────────────────────────────────
        else if (body.object === 'instagram') {
          if (entry.messaging) {
            for (const event of entry.messaging) {
              // Skip echoes (messages sent by the page itself)
              if (event.message && !event.message.is_echo) {
                const igAccountId = entry.id;       // Instagram Business Account ID
                const senderIgsid = event.sender.id; // Sender's Instagram-Scoped ID
                const messageText = event.message.text || '';
                const messageId = event.message.mid;

                // For Instagram, the sender IGSID name may come from the payload or Graph API
                let customerName = 'Instagram User';
                try {
                  // Check webhook payload for sender name first
                  if (event.sender?.name) {
                    customerName = event.sender.name;
                  } else {
                    const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.MESSENGER_ACCESS_TOKEN;
                    if (token) {
                      const nameRes = await fetch(`https://graph.facebook.com/v19.0/${senderIgsid}?fields=name,username&access_token=${token}`);
                      const nameData = await nameRes.json();
                      fastify.log.info(`[instagram] Name API response for ${senderIgsid}: ${JSON.stringify(nameData)}`);
                      if (nameData.name) customerName = nameData.name;
                      else if (nameData.username) customerName = `@${nameData.username}`;
                      else fastify.log.warn(`[instagram] Name unavailable for IGSID ${senderIgsid} — API returned: ${JSON.stringify(nameData)}`);
                    }
                  }
                } catch (e) {
                  fastify.log.warn(`[instagram] Name fetch failed: ${e.message}`);
                }

                await processIncomingMessage('instagram', igAccountId, senderIgsid, customerName, messageText, messageId);
              }
            }
          }
        }

      }
      return reply.code(200).send('EVENT_RECEIVED');
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send('Internal Server Error');
    }
  } else {
    reply.code(404).send();
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 3003;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
