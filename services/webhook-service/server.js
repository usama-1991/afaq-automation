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

  // 2. Find or Create Conversation
  let { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, unread_count')
    .eq('tenant_id', tenantId)
    .eq('external_conversation_id', customerId)
    .single();

  if (!conversation) {
    fastify.log.info(`[${platform}] Creating new conversation for ${customerId}`);
    const { data: newConv, error: newConvError } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        platform: platform,
        external_conversation_id: customerId,
        customer_name: customerName
      })
      .select('id')
      .single();
    
    if (newConvError) {
      fastify.log.error(`[${platform}] Failed to create conversation: ${newConvError.message}`);
      throw newConvError;
    }
    conversation = newConv;
    fastify.log.info(`[${platform}] New conversation created: ${conversation.id}`);
    
    // Log the new conversation creation to Audit Logs
    await logAudit(tenantId, 'conversation_started', { platform, external_conversation_id: customerId, customer_name: customerName });
  } else {
    fastify.log.info(`[${platform}] Existing conversation found: ${conversation.id}`);
    // Update customer name and updated_at
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

  // 4. Trigger n8n Webhook for AI Agent Processing (enriched with niche context)
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    const n8nPayload = {
      // Core identifiers
      tenant_id: tenantId,
      conversation_id: conversation.id,
      message_id: savedMessage?.id || null,
      // Customer context
      customer_phone: customerId,
      customer_name: customerName,
      message_text: messageText,
      platform: platform,
      // Niche routing context (consumed by n8n Switch node)
      niche: tenantNiche,
      business_name: tenantBusinessName,
      tenant_metadata: tenantMetadata,
      // Timestamp
      timestamp: new Date().toISOString(),
    };
    fastify.log.info(`[${platform}] Firing n8n webhook with niche="${tenantNiche}"`);
    fetch(n8nUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_API_KEY || ''
      },
      body: JSON.stringify(n8nPayload)
    }).catch(err => fastify.log.error(`Failed to trigger n8n: ${err.message}`));
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
