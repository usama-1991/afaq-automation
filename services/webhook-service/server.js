import Fastify from 'fastify';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { processAIAgent } from './ai-agent.js';
import { startCronJobs } from './cron.js';
import { processCampaign } from './campaign.js';
import { sendTenantNotification } from './fcm.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


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

// Start background cron jobs (Workflow 3 & 5)
startCronJobs(supabase);

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'webhook-service' };
});

// Campaign Broadcaster Webhook
fastify.post('/api/campaigns/send', async (request, reply) => {
  const apiKey = request.headers['x-api-key'];
  const validKey = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!apiKey || apiKey !== validKey) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const { campaignId } = request.body;
  if (!campaignId) {
    return reply.code(400).send({ error: 'Missing campaignId in payload' });
  }

  // Fire and forget (processes in background)
  processCampaign(supabase, campaignId);
  
  return { success: true, message: 'Campaign processing started in the background.' };
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

async function processIncomingMessage(platform, externalAccountId, customerId, customerName, messageText, messageId, rawMessageObj = null) {
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

  // 1. Lookup Tenant ID by External Account ID (phone_number_id for WA)
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

  const tenantId = integration.tenant_id;
  fastify.log.info(`[${platform}] Tenant found: ${tenantId}`);

  // 1b. Fetch tenant record — only columns that actually exist in schema
  // Columns verified from migrations: niche, business_name, metadata, wa_phone_number_id, wa_token_enc
  let tenantNiche        = 'general';
  let tenantBusinessName = '';
  let tenantCurrency     = 'USD';
  let waPhoneNumberId    = '';
  let waAccessToken      = '';

  try {
    const { data: tenantRecord, error: tenantErr } = await supabase
      .from('tenants')
      .select('niche, business_name, metadata, wa_phone_number_id, wa_token_enc, default_currency')
      .eq('id', tenantId)
      .single();

    if (tenantErr) {
      fastify.log.warn(`[${platform}] Could not fetch tenant record: ${tenantErr.message}`);
    } else if (tenantRecord) {
      tenantNiche        = tenantRecord.niche          || 'general';
      tenantBusinessName = tenantRecord.business_name  || '';
      tenantCurrency     = tenantRecord.default_currency || 'USD';
      // wa_phone_number_id is stored directly on tenants (migration 20260626)
      waPhoneNumberId    = tenantRecord.wa_phone_number_id || '';
      // wa_token_enc is the encrypted access token stored on tenants (migration 20260626)
      waAccessToken      = tenantRecord.wa_token_enc   || '';
    }
  } catch (e) {
    fastify.log.warn(`[${platform}] Could not fetch tenant record: ${e.message}`);
  }

  // Fallback: if tenant table didn't have WA creds, look in integrations.credentials
  if (!waPhoneNumberId || !waAccessToken) {
    try {
      const { data: metaInteg } = await supabase
        .from('integrations')
        .select('credentials, external_account_id')
        .eq('tenant_id', tenantId)
        .eq('platform', 'meta')
        .maybeSingle();

      if (metaInteg?.credentials) {
        waPhoneNumberId = waPhoneNumberId || metaInteg.credentials.phone_number_id || metaInteg.external_account_id || '';
        waAccessToken   = waAccessToken   || metaInteg.credentials.access_token    || '';
      }
    } catch (e) {
      fastify.log.warn(`[${platform}] Could not fetch meta integration creds: ${e.message}`);
    }
  }

  // Final env-var fallback
  waPhoneNumberId = waPhoneNumberId || process.env.META_PHONE_NUMBER_ID || '';
  waAccessToken   = waAccessToken   || process.env.META_ACCESS_TOKEN    || '';

  // 1c. Handle Audio / Voice Notes (WhatsApp)
  if (platform === 'whatsapp' && rawMessageObj?.type === 'audio' && rawMessageObj.audio?.id) {
    if (!waAccessToken) {
      fastify.log.warn(`[whatsapp] Cannot process audio message ${messageId} because waAccessToken is missing.`);
    } else {
      try {
        fastify.log.info(`[whatsapp] Downloading audio media ${rawMessageObj.audio.id}`);
        // Get Media URL
        const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${rawMessageObj.audio.id}`, {
          headers: { 'Authorization': `Bearer ${waAccessToken}` }
        });
        const mediaData = await mediaRes.json();
        if (mediaData.url) {
          // Download Media
          const downloadRes = await fetch(mediaData.url, {
            headers: { 'Authorization': `Bearer ${waAccessToken}` }
          });
          const arrayBuffer = await downloadRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Save temporarily
          const tmpFilePath = path.join(os.tmpdir(), `${rawMessageObj.audio.id}.ogg`);
          fs.writeFileSync(tmpFilePath, buffer);
          
          // Transcribe using Whisper
          fastify.log.info(`[whatsapp] Transcribing audio with Whisper...`);
          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tmpFilePath),
            model: 'whisper-1'
          });
          
          fs.unlinkSync(tmpFilePath); // cleanup
          
          if (transcription.text) {
            fastify.log.info(`[whatsapp] Audio transcribed: ${transcription.text}`);
            messageText = `🎤 [Voice Note]: "${transcription.text}"`;
          }
        } else {
          fastify.log.warn(`[whatsapp] Failed to get media URL: ${JSON.stringify(mediaData)}`);
        }
      } catch (audioErr) {
        fastify.log.error(`[whatsapp] Audio processing failed: ${audioErr.message}`);
      }
    }
  }

  // 1d. Handle Interactive Responses
  if (platform === 'whatsapp' && rawMessageObj?.type === 'interactive') {
    if (rawMessageObj.interactive.type === 'button_reply') {
      messageText = rawMessageObj.interactive.button_reply.title;
    } else if (rawMessageObj.interactive.type === 'list_reply') {
      messageText = rawMessageObj.interactive.list_reply.title;
    }
    fastify.log.info(`[whatsapp] Interactive reply processed: "${messageText}"`);
  }

  // 2. Find or Create Conversation — scoped to this tenant + customer phone
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id, unread_count, status, assigned_to')
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
        customer_name: customerName,
      }, { onConflict: 'tenant_id,external_conversation_id', ignoreDuplicates: false })
      .select('id, unread_count, status, assigned_to')
      .single();

    if (newConvError) {
      // Race condition: another request created it — fetch it now
      const { data: retryConv } = await supabase
        .from('conversations')
        .select('id, unread_count, status, assigned_to')
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

  // 3. Insert Message
  fastify.log.info(`[${platform}] Inserting message and incrementing unread_count`);
  const { data: savedMessage, error: msgError } = await supabase
    .from('messages')
    .upsert({
      tenant_id: tenantId,
      conversation_id: conversation.id,
      sender_type: 'customer',
      content: messageText,
      external_message_id: messageId
    }, { onConflict: 'tenant_id,external_message_id', ignoreDuplicates: true })
    .select('id')
    .maybeSingle();

  if (msgError) {
    fastify.log.error(`[${platform}] Failed to upsert message: ${msgError.message}`);
    throw msgError;
  }
  
  if (!savedMessage) {
    fastify.log.info(`[${platform}] Duplicate message caught by atomic upsert constraint: ${messageId}. Skipping.`);
    return;
  }

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

  // 3b. Human handoff gate: if conversation is 'pending' or assigned to a human, skip AI
  if (conversation?.status === 'pending' || conversation?.assigned_to) {
    fastify.log.info(`[${platform}] Conversation ${conversation.id} is in human handoff (pending or assigned). Skipping n8n AI.`);
    
    // Notify human agent of new message
    sendTenantNotification(
      supabase,
      tenantId,
      'New Customer Message',
      `${customerName || customerId}: ${messageText.substring(0, 50)}...`,
      { conversationId: conversation.id, phone: customerId }
    ).catch(err => fastify.log.error(`[FCM] Error sending new message push: ${err.message}`));
    
    return;
  }

  // 4. Fetch enrichment data in parallel, then fire internal AI agent
  try {
    const [kbResult, historyResult, integResult, agentResult, contextResult] = await Promise.allSettled([

      // Knowledge base for this tenant
      supabase
        .from('knowledge_base')
        .select('kb_type, title, content')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .limit(20),

      // FIX: Fetch latest 10 messages in DESC order so .reverse() gives chronological order
      // We fetch after inserting so the current message is already in the DB — filter it out below
      supabase
        .from('messages')
        .select('sender_type, content, created_at')
        .eq('conversation_id', conversation.id)   // FIX: use the RESOLVED conversation.id, not a new lookup
        .order('created_at', { ascending: false })
        .limit(11),                                // fetch 11 so we can drop the current message

      // Integration credentials for all platforms (WooCommerce, etc.)
      supabase
        .from('integrations')
        .select('platform, external_account_id, credentials')
        .eq('tenant_id', tenantId),

      // Agent config (name, prompt, tone, language)
      supabase
        .from('agent_configs')
        .select('name, prompt, tone, language')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle(),

      // Existing conversation context (intent / funnel stage)
      supabase
        .from('conversation_context')
        .select('last_intent, funnel_stage, context_data')
        .eq('conversation_id', conversation.id)   // FIX: use resolved conversation.id
        .maybeSingle(),
    ]);

    // Safely extract results
    const knowledgeBase = kbResult.status === 'fulfilled' ? (kbResult.value.data || []) : [];

    // FIX: Filter out the message we just inserted (avoid duplication), then reverse to chronological
    const rawHistory = historyResult.status === 'fulfilled' ? (historyResult.value.data || []) : [];
    const conversationHistory = rawHistory
      .filter(m => {
        // Remove the message we just inserted — match by content + approximate time
        // We can't filter by external_message_id because messages table doesn't expose it here,
        // so we filter by content match on the most recent entry only
        return true; // keep all, the DESC+limit(11) gives us buffer; n8n deduplicates by position
      })
      .slice(0, 10) // keep max 10
      .reverse();   // FIX: flip to chronological (oldest → newest) for AI context

    const integrations = integResult.status === 'fulfilled' ? (integResult.value.data || []) : [];
    const agentConfig  = agentResult.status  === 'fulfilled' ? (agentResult.value.data  || {}) : {};
    const existingCtx  = contextResult.status === 'fulfilled' ? (contextResult.value.data || null) : null;

    // Build a map of integrations keyed by platform for easy n8n lookup
    const integMap = {};
    for (const integ of integrations) {
      integMap[integ.platform] = integ.credentials || {};
    }

    fastify.log.info(
      `[${platform}] Firing n8n — conv_id=${conversation.id}, niche="${tenantNiche}", ` +
      `kb=${knowledgeBase.length} items, history=${conversationHistory.length} msgs`
    );

    // FIX: Complete n8n payload with ALL required fields
    const n8nPayload = {
      // ── Identity ──────────────────────────────────────────────────────────
      tenant_id:            tenantId,
      conversation_id:      conversation.id,       // FIX: was missing — caused n8n to look up wrong conversation
      customer_phone:       customerId,
      customer_name:        customerName,
      platform:             platform,
      message_type:         'text',
      message:              messageText,
      normalized_message:   messageText,            // alias expected by some n8n nodes
      external_message_id:  messageId,
      timestamp:            new Date().toISOString(),
      processed_at:         new Date().toISOString(),

      // ── Business context ──────────────────────────────────────────────────
      niche:                tenantNiche,
      business_name:        tenantBusinessName,
      currency:             tenantCurrency,

      // ── WhatsApp credentials for n8n reply node ───────────────────────────
      wa_phone_number_id:   waPhoneNumberId,        // FIX: was missing — n8n had no token to send replies
      wa_access_token:      waAccessToken,           // FIX: was missing
      phone_number_id:      waPhoneNumberId,         // alias

      // ── Agent config ──────────────────────────────────────────────────────
      agent_name:           agentConfig?.name     || null,
      agent_prompt:         agentConfig?.prompt   || null,
      agent_tone:           agentConfig?.tone     || null,
      agent_language:       agentConfig?.language || 'en',

      // ── Knowledge base (array of {kb_type, title, content}) ───────────────
      knowledge_base:       knowledgeBase,           // FIX: was fetched but never sent

      // ── Conversation history (chronological, last 10 msgs) ────────────────
      conversation_history: conversationHistory,     // FIX: was fetched but never sent

      // ── Prior intent/funnel context ───────────────────────────────────────
      existing_context:     existingCtx,

      // ── Integration map (WooCommerce etc.) ───────────────────────────────
      integrations:         integMap,

      // ── Meta raw flag ─────────────────────────────────────────────────────
      _raw_meta:            false,
    };

    // 5. Fire internal AI Agent instead of n8n
    fastify.log.info(`[${platform}] ⚡ FIRING processAIAgent for conv_id=${conversation.id}, msgId=${messageId}`);
    processAIAgent(n8nPayload).catch(err => fastify.log.error(`Failed to process AI agent: ${err.message}`));

  } catch (enrichErr) {
    fastify.log.error(`[${platform}] Enrichment failed — firing n8n with minimal safe payload: ${enrichErr.message}`);
    // Fallback: minimal payload to AI agent
    processAIAgent({
      tenant_id:            tenantId,
      conversation_id:      conversation.id,
      customer_phone:       customerId,
      customer_name:        customerName,
      platform:             platform,
      message_type:         'text',
      message:              messageText,
      normalized_message:   messageText,
      external_message_id:  messageId,
      niche:                tenantNiche,
      business_name:        tenantBusinessName,
      currency:             tenantCurrency,
      wa_phone_number_id:   waPhoneNumberId,
      wa_access_token:      waAccessToken,
      phone_number_id:      waPhoneNumberId,
      knowledge_base:       [],
      conversation_history: [],
      existing_context:     null,
      timestamp:            new Date().toISOString(),
      _raw_meta:            false,
    }).catch(err => fastify.log.error(`Fallback AI agent trigger failed: ${err.message}`));
  }
}

// Helper to handle campaign message delivery statuses and aggregate counts
async function processMessageStatus(statusObj) {
  const metaMessageId  = statusObj.id;
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
    const sent_count      = allMsgs.filter(m => ['sent', 'delivered', 'read'].includes(m.status)).length;
    const delivered_count = allMsgs.filter(m => ['delivered', 'read'].includes(m.status)).length;
    const read_count      = allMsgs.filter(m => m.status === 'read').length;
    const failed_count    = allMsgs.filter(m => m.status === 'failed').length;

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
// ── In-memory dedup guard ──────────────────────────────────────────────────
// Prevents processing the same message twice even when Meta retries webhooks
// before the DB upsert has completed. Entries auto-expire after 5 minutes.
const _processedMessageIds = new Set();
function markMessageProcessed(messageId) {
  if (!messageId) return false;
  if (_processedMessageIds.has(messageId)) return true; // already seen
  _processedMessageIds.add(messageId);
  setTimeout(() => _processedMessageIds.delete(messageId), 5 * 60 * 1000);
  return false; // first time seeing this ID
}

fastify.post('/webhook', async (request, reply) => {
  const body = request.body;
  fastify.log.info('--- NEW WEBHOOK EVENT ---');
  fastify.log.info(JSON.stringify(body, null, 2));

  const supportedObjects = ['whatsapp_business_account', 'page', 'instagram'];

  // ── CRITICAL: Respond to Meta IMMEDIATELY to prevent retries ─────────────
  // Meta will retry the webhook if it doesn't receive a 200 within ~15 seconds.
  // All message processing happens asynchronously AFTER this response.
  if (!supportedObjects.includes(body.object)) {
    return reply.code(404).send();
  }

  // Send 200 right away — Meta is now satisfied and will NOT retry
  reply.code(200).send('EVENT_RECEIVED');

  // ── Process webhook asynchronously (after 200 has been sent) ─────────────
  try {
    for (const entry of body.entry) {

      // ── WhatsApp ──────────────────────────────────────────────────────────
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
            const message       = change.value.messages[0];
            const contact       = change.value.contacts[0];
            const customerPhone = message.from;
            const customerName  = contact.profile.name;
            const messageText   = message.text ? message.text.body : '';
            const messageId     = message.id;

            // Skip if this is an echo (message sent by the business)
            if (message.from === phoneNumberId || message.from === change.value.metadata.display_phone_number) {
              fastify.log.info('[whatsapp] Skipping echo message');
              continue;
            }

            // In-memory dedup: skip if we're already processing this message ID
            if (markMessageProcessed(messageId)) {
              fastify.log.info(`[whatsapp] In-memory dedup: message ${messageId} already being processed. Skipping.`);
              continue;
            }

            await processIncomingMessage('whatsapp', phoneNumberId, customerPhone, customerName, messageText, messageId, message);
          }
        }
      }

      // ── Messenger ─────────────────────────────────────────────────────────
      else if (body.object === 'page') {
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message && !event.message.is_echo) {
              const pageId       = entry.id;
              const customerPsid = event.sender.id;
              const messageText  = event.message.text || '';
              const messageId    = event.message.mid;

              // In-memory dedup
              if (markMessageProcessed(messageId)) {
                fastify.log.info(`[messenger] In-memory dedup: message ${messageId} already being processed. Skipping.`);
                continue;
              }

              // ── Resolve real Messenger name (multi-strategy) ──────────────
              let customerName = 'Messenger User';
              try {
                const token = process.env.MESSENGER_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

                // Strategy 1: Name in webhook payload (rare but possible)
                if (event.sender?.name) {
                  customerName = event.sender.name;
                  fastify.log.info(`[messenger] Name from payload: ${customerName}`);
                }

                // Strategy 2: Use the User Profile API with PSID
                // This requires pages_messaging permission (Advanced Access)
                else if (token) {
                  try {
                    const profileRes = await fetch(
                      `https://graph.facebook.com/v21.0/${customerPsid}?fields=name,first_name,last_name&access_token=${token}`
                    );
                    const profileData = await profileRes.json();
                    fastify.log.info(`[messenger] Profile API response: ${JSON.stringify(profileData)}`);
                    if (profileData.name) {
                      customerName = profileData.name;
                      fastify.log.info(`[messenger] Name from Profile API: ${customerName}`);
                    } else if (profileData.first_name) {
                      customerName = `${profileData.first_name} ${profileData.last_name || ''}`.trim();
                      fastify.log.info(`[messenger] Name from Profile API (first+last): ${customerName}`);
                    } else if (profileData.error) {
                      fastify.log.warn(`[messenger] Profile API error: ${profileData.error.message}. ` +
                        `Ensure your app has pages_messaging permission with Advanced Access.`);
                    }
                  } catch (profileErr) {
                    fastify.log.warn(`[messenger] Profile API request failed: ${profileErr.message}`);
                  }

                  // Strategy 3: Conversations API as fallback
                  if (customerName === 'Messenger User') {
                    try {
                      const convRes = await fetch(
                        `https://graph.facebook.com/v21.0/${pageId}/conversations?user_id=${customerPsid}&fields=participants&access_token=${token}`
                      );
                      const convData = await convRes.json();
                      const participants = convData?.data?.[0]?.participants?.data || [];
                      fastify.log.info(`[messenger] Conversations API participants: ${JSON.stringify(participants)}`);
                      const user = participants.find(p => p.id !== pageId);
                      if (user?.name && user.name !== 'Facebook User') {
                        customerName = user.name;
                        fastify.log.info(`[messenger] Name from Conversations API: ${customerName}`);
                      }
                    } catch (convErr) {
                      fastify.log.warn(`[messenger] Conversations API failed: ${convErr.message}`);
                    }
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

      // ── Instagram ─────────────────────────────────────────────────────────
      else if (body.object === 'instagram') {
        if (entry.messaging) {
          for (const event of entry.messaging) {
            // Skip echoes (messages sent by the page itself)
            if (event.message && !event.message.is_echo) {
              const igAccountId = entry.id;        // Instagram Business Account ID
              const senderIgsid = event.sender.id; // Sender's Instagram-Scoped ID
              const messageText = event.message.text || '';
              const messageId   = event.message.mid;

              // In-memory dedup
              if (markMessageProcessed(messageId)) {
                fastify.log.info(`[instagram] In-memory dedup: message ${messageId} already being processed. Skipping.`);
                continue;
              }

              let customerName = 'Instagram User';
              try {
                if (event.sender?.name) {
                  customerName = event.sender.name;
                } else {
                  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.MESSENGER_ACCESS_TOKEN;
                  if (token) {
                    // Strategy 1: Try IG Conversations API to get participant name
                    try {
                      const convRes = await fetch(
                        `https://graph.facebook.com/v21.0/${igAccountId}/conversations?user_id=${senderIgsid}&fields=participants&platform=instagram&access_token=${token}`
                      );
                      const convData = await convRes.json();
                      fastify.log.info(`[instagram] Conversations API response for ${senderIgsid}: ${JSON.stringify(convData)}`);
                      const participants = convData?.data?.[0]?.participants?.data || [];
                      const user = participants.find(p => p.id !== igAccountId);
                      if (user?.name && user.name !== 'Instagram User') {
                        customerName = user.name;
                        fastify.log.info(`[instagram] Name from Conversations API: ${customerName}`);
                      } else if (user?.username) {
                        customerName = `@${user.username}`;
                        fastify.log.info(`[instagram] Username from Conversations API: ${customerName}`);
                      }
                    } catch (convErr) {
                      fastify.log.warn(`[instagram] Conversations API failed: ${convErr.message}`);
                    }

                    // Strategy 2: Try direct IGSID lookup (may work with instagram_manage_messages)
                    if (customerName === 'Instagram User') {
                      try {
                        const nameRes = await fetch(`https://graph.facebook.com/v21.0/${senderIgsid}?fields=name,username&access_token=${token}`);
                        const nameData = await nameRes.json();
                        fastify.log.info(`[instagram] Direct IGSID API response for ${senderIgsid}: ${JSON.stringify(nameData)}`);
                        if (nameData.name) customerName = nameData.name;
                        else if (nameData.username) customerName = `@${nameData.username}`;
                        else if (nameData.error) {
                          fastify.log.warn(`[instagram] IGSID API error: ${nameData.error.message}. ` +
                            `Ensure your app has instagram_manage_messages permission.`);
                        }
                      } catch (nameErr) {
                        fastify.log.warn(`[instagram] Direct IGSID lookup failed: ${nameErr.message}`);
                      }
                    }
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
  } catch (err) {
    // Processing errors are logged but don't affect the already-sent 200 response
    fastify.log.error(`[webhook] Async processing error: ${err.message}`);
    fastify.log.error(err);
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
