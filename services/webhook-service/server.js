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

  // 2. Find or Create Conversation
  let { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
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
  } else {
    fastify.log.info(`[${platform}] Existing conversation found: ${conversation.id}`);
    // Update customer name and updated_at
    await supabase
      .from('conversations')
      .update({ customer_name: customerName, updated_at: new Date().toISOString() })
      .eq('id', conversation.id);
  }

  // 3. Insert Message
  fastify.log.info(`[${platform}] Inserting message into conversation ${conversation.id}`);
  const { error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      content: messageText,
      external_message_id: messageId
    });

  if (msgError) {
    fastify.log.error(`[${platform}] Failed to insert message: ${msgError.message}`);
    throw msgError;
  }
  fastify.log.info(`[${platform}] Message inserted successfully.`);

  // 4. Trigger n8n Webhook for AI Agent Processing
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        conversation_id: conversation.id,
        customer_phone: customerId,
        customer_name: customerName,
        message: messageText,
        platform: platform
      })
    }).catch(err => fastify.log.error(`Failed to trigger n8n: ${err.message}`));
  }
}

// Meta Webhook Event Receiver
fastify.post('/webhook', async (request, reply) => {
  const body = request.body;
  fastify.log.info(`Received Webhook Event: ${JSON.stringify(body, null, 2)}`);
  
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

                let customerName = 'Messenger User';
                try {
                  const token = process.env.MESSENGER_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
                  const nameRes = await fetch(`https://graph.facebook.com/v19.0/${customerPsid}?fields=name&access_token=${token}`);
                  const nameData = await nameRes.json();
                  if (nameData.name) customerName = nameData.name;
                  else fastify.log.warn(`[messenger] Could not get name for PSID ${customerPsid}: ${JSON.stringify(nameData)}`);
                } catch (e) {
                  fastify.log.warn(`[messenger] Name fetch failed: ${e.message}`);
                }

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

                // Fetch Instagram username/name from Graph API
                let customerName = 'Instagram User';
                try {
                  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.MESSENGER_ACCESS_TOKEN;
                  const nameRes = await fetch(`https://graph.facebook.com/v19.0/${senderIgsid}?fields=name,username&access_token=${token}`);
                  const nameData = await nameRes.json();
                  if (nameData.name) customerName = nameData.name;
                  else if (nameData.username) customerName = '@' + nameData.username;
                  else fastify.log.warn(`[instagram] Could not get name for IGSID ${senderIgsid}: ${JSON.stringify(nameData)}`);
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
