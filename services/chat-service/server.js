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

const parseMediaContent = (content) => {
  if (!content) return null;
  const mediaRegex = /^\[Media:\s*(Images|Documents|Videos|Audio)\]\s*([^|]+)\|(.+)$/i;
  const match = content.match(mediaRegex);
  if (!match) return null;

  const [_, category, fileName, fileUrl] = match;
  const catLower = category.toLowerCase();
  
  let isBase64 = false;
  let base64Data = '';
  let mimeType = '';

  if (fileUrl.startsWith('data:')) {
    isBase64 = true;
    const parts = fileUrl.split(';base64,');
    mimeType = parts[0].replace('data:', '');
    base64Data = parts[1];
  } else {
    if (catLower === 'images') mimeType = 'image/jpeg';
    else if (catLower === 'videos') mimeType = 'video/mp4';
    else if (catLower === 'audio') mimeType = 'audio/mpeg';
    else mimeType = 'application/octet-stream';
  }

  return {
    category: catLower,
    fileName,
    fileUrl,
    isBase64,
    base64Data,
    mimeType
  };
};

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
          const mediaInfo = parseMediaContent(message.content);

          if (conv.platform === 'whatsapp') {
            let payload = {};

            if (mediaInfo) {
              fastify.log.info(`Processing WhatsApp outbound media message: ${mediaInfo.fileName}`);
              let mediaId = '';

              if (mediaInfo.isBase64) {
                // Upload base64 media directly to Meta
                const uploadUrl = `https://graph.facebook.com/v19.0/${externalPhoneId}/media`;
                const buffer = Buffer.from(mediaInfo.base64Data, 'base64');
                const blob = new Blob([buffer], { type: mediaInfo.mimeType });
                const formData = new FormData();
                formData.append('messaging_product', 'whatsapp');
                formData.append('type', mediaInfo.mimeType);
                formData.append('file', blob, mediaInfo.fileName);

                fastify.log.info(`Uploading binary to Meta WhatsApp Media API: ${mediaInfo.fileName} (${mediaInfo.mimeType})`);
                const uploadResponse = await fetch(uploadUrl, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: formData
                });

                const uploadResult = await uploadResponse.json();
                if (!uploadResponse.ok) {
                  throw new Error(`WhatsApp Media Upload Failed: ${JSON.stringify(uploadResult)}`);
                }
                mediaId = uploadResult.id;
                fastify.log.info(`Successfully uploaded WhatsApp media. ID: ${mediaId}`);
              } else {
                mediaId = mediaInfo.fileUrl;
              }

              const typeMap = {
                images: 'image',
                videos: 'video',
                audio: 'audio',
                documents: 'document'
              };
              const waType = typeMap[mediaInfo.category] || 'document';
              
              payload = {
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: waType,
                [waType]: mediaInfo.isBase64 ? { id: mediaId } : { link: mediaId }
              };

              if (waType === 'document') {
                payload.document.filename = mediaInfo.fileName;
              }
            } else {
              payload = {
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: 'text',
                text: { body: message.content }
              };
            }

            const url = `https://graph.facebook.com/v19.0/${externalPhoneId}/messages`;
            fastify.log.info(`Sending WhatsApp message to ${customerPhone} via ${url}`);

            const metaResponse = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            const result = await metaResponse.json();
            
            if (!metaResponse.ok) {
              fastify.log.error(`Meta API Error: ${JSON.stringify(result)}`);
            } else {
              fastify.log.info(`Message successfully sent to Meta: ${result.messages[0].id}`);
              await supabase.from('messages').update({ external_message_id: result.messages[0].id }).eq('id', message.id);
            }
          } else if (conv.platform === 'messenger' || conv.platform === 'instagram') {
            let metaResponse;

            if (mediaInfo) {
              fastify.log.info(`Processing ${conv.platform} outbound media message: ${mediaInfo.fileName}`);
              const typeMap = {
                images: 'image',
                videos: 'video',
                audio: 'audio',
                documents: 'file'
              };
              const attachmentType = typeMap[mediaInfo.category] || 'file';

              if (mediaInfo.isBase64) {
                // Upload media to Meta Attachments API first
                const uploadUrl = `https://graph.facebook.com/v19.0/me/message_attachments?access_token=${accessToken}`;
                const buffer = Buffer.from(mediaInfo.base64Data, 'base64');
                const blob = new Blob([buffer], { type: mediaInfo.mimeType });
                
                const uploadForm = new FormData();
                uploadForm.append('message', JSON.stringify({ 
                  attachment: { 
                    type: attachmentType, 
                    payload: { is_reusable: true } 
                  } 
                }));
                uploadForm.append('filedata', blob, mediaInfo.fileName);

                fastify.log.info(`Uploading media to Meta Message Attachments API for ${conv.platform}: ${mediaInfo.fileName}`);
                const uploadResponse = await fetch(uploadUrl, {
                  method: 'POST',
                  body: uploadForm
                });

                const uploadResult = await uploadResponse.json();
                if (!uploadResponse.ok) {
                  throw new Error(`Meta Message Attachment Upload Failed: ${JSON.stringify(uploadResult)}`);
                }
                const attachmentId = uploadResult.attachment_id;
                fastify.log.info(`Successfully uploaded attachment. ID: ${attachmentId}`);

                // Send the message using attachment_id
                metaResponse = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: customerPhone },
                    message: {
                      attachment: {
                        type: attachmentType,
                        payload: { attachment_id: attachmentId }
                      }
                    }
                  })
                });
              } else {
                // Hosted URL payload
                metaResponse = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: customerPhone },
                    message: {
                      attachment: {
                        type: attachmentType,
                        payload: { url: mediaInfo.fileUrl, is_reusable: true }
                      }
                    }
                  })
                });
              }
            } else {
              // Regular text
              metaResponse = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: customerPhone },
                  message: { text: message.content }
                })
              });
            }

            const result = await metaResponse.json();
            if (!metaResponse.ok) {
              fastify.log.error(`Meta API Error: ${JSON.stringify(result)}`);
            } else {
              const msgId = result.message_id || result.messages?.[0]?.id;
              fastify.log.info(`Message successfully sent to ${conv.platform}: ${msgId}`);
              await supabase.from('messages').update({ external_message_id: msgId }).eq('id', message.id);
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
