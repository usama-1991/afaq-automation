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
  return { status: 'ok', service: 'chat-service' };
});

const startRealtimeSubscription = () => {
  const channel = supabase.channel('chat-service-outbound');
  
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      async (payload) => {
        const message = payload.new;
        
        // Only process outbound messages (from agent or bot)
        if (message.sender_type === 'customer') return;

        fastify.log.info(`New outbound message detected: ${message.id}`);

        try {
          // 1. Get Conversation details
          const { data: conv, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', message.conversation_id)
            .single();

          if (convError || !conv) throw new Error("Conversation not found");

          // 2. Get Integration details for this tenant
          const { data: integration, error: intError } = await supabase
            .from('integrations')
            .select('*')
            .eq('tenant_id', conv.tenant_id)
            .eq('platform', conv.platform)
            .single();

          if (intError || !integration) throw new Error("Integration not found for tenant");

          const externalPhoneId = integration.external_account_id?.trim();
          const customerPhone = conv.external_conversation_id?.trim();
          let accessToken = (integration.access_token || process.env.META_ACCESS_TOKEN)?.trim();

          if (conv.platform === 'messenger') {
            accessToken = (integration.access_token || process.env.MESSENGER_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN)?.trim();
          }
          if (conv.platform === 'instagram') {
            accessToken = (integration.access_token || process.env.INSTAGRAM_ACCESS_TOKEN || process.env.MESSENGER_ACCESS_TOKEN)?.trim();
          }

          if (!accessToken) throw new Error("No Meta access token found");
          if (!externalPhoneId) throw new Error("No External Account ID found for platform " + conv.platform);

          // 3. Send via Meta Graph API
          if (conv.platform === 'whatsapp') {
            const url = `https://graph.facebook.com/v19.0/${externalPhoneId}/messages`;
            fastify.log.info(`Sending WhatsApp message to ${customerPhone} via ${url}`);

            const metaResponse = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: 'text',
                text: { body: message.content }
              })
            });

            const result = await metaResponse.json();
            
            if (!metaResponse.ok) {
              fastify.log.error(`Meta API Error: ${JSON.stringify(result)}`);
            } else {
              fastify.log.info(`Message successfully sent to Meta: ${result.messages[0].id}`);
              // Update the message record with the external_message_id
              await supabase.from('messages').update({ external_message_id: result.messages[0].id }).eq('id', message.id);
            }
          } else if (conv.platform === 'messenger') {
            const metaResponse = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: customerPhone },
                message: { text: message.content }
              })
            });
            const result = await metaResponse.json();
            if (!metaResponse.ok) {
              fastify.log.error(`Meta API Error: ${JSON.stringify(result)}`);
            } else {
              fastify.log.info(`Message successfully sent to Messenger: ${result.message_id}`);
              await supabase.from('messages').update({ external_message_id: result.message_id }).eq('id', message.id);
            }

          } else if (conv.platform === 'instagram') {
            // Instagram DM via Messaging API
            const metaResponse = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: customerPhone },
                message: { text: message.content }
              })
            });
            const result = await metaResponse.json();
            if (!metaResponse.ok) {
              fastify.log.error(`Instagram API Error: ${JSON.stringify(result)}`);
            } else {
              fastify.log.info(`Message successfully sent to Instagram: ${result.message_id}`);
              await supabase.from('messages').update({ external_message_id: result.message_id }).eq('id', message.id);
            }

          } else {
            fastify.log.warn(`Platform ${conv.platform} is not fully supported for outbound yet.`);
          }

        } catch (err) {
          fastify.log.error(`Failed to process outbound message: ${err.message}`);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fastify.log.info('Successfully subscribed to Supabase Realtime for outbound messages');
      }
    });
};

const start = async () => {
  try {
    const port = process.env.PORT || 3004;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${port}`);
    
    // Start listening to DB changes
    startRealtimeSubscription();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
