import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { decrypt } from '@/lib/crypto';

interface ParsedMedia {
  category: string;
  fileName: string;
  fileUrl: string;
  isBase64: boolean;
  base64Data: string;
  mimeType: string;
  caption: string;
}

function parseMediaContent(content: string): ParsedMedia | null {
  if (!content) return null;

  let category = '';
  let fileName = '';
  let fileUrl = '';
  let caption = '';

  // 1. Format: [Media: Images] fileName|url
  const mediaRegex = /^\[Media:\s*(Images|Documents|Videos|Audio)\]\s*([^|]+)\|(.+)$/i;
  const match = content.match(mediaRegex);

  if (match) {
    category = match[1].toLowerCase();
    fileName = match[2].trim();
    fileUrl = match[3].trim();
  } else {
    // 2. Standard Markdown Image: ![Caption](URL)
    const mdRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/i;
    const mdMatch = content.match(mdRegex);
    if (mdMatch) {
      category = 'images';
      fileName = mdMatch[1] || 'image.jpg';
      fileUrl = mdMatch[2];
      caption = content.replace(mdMatch[0], '').trim();
    } else {
      return null;
    }
  }

  let isBase64 = false;
  let base64Data = '';
  let mimeType = '';

  if (fileUrl.startsWith('data:')) {
    isBase64 = true;
    const parts = fileUrl.split(';base64,');
    mimeType = parts[0].replace('data:', '');
    base64Data = parts[1];
  } else {
    if (category === 'images') mimeType = 'image/jpeg';
    else if (category === 'videos') mimeType = 'video/mp4';
    else if (category === 'audio') mimeType = 'audio/mpeg';
    else mimeType = 'application/octet-stream';
  }

  return {
    category,
    fileName,
    fileUrl,
    isBase64,
    base64Data,
    mimeType,
    caption
  };
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate caller session server-side
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 });
    }

    // 2. Fetch caller's tenant membership
    const { data: callerProfile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !callerProfile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant profile not found' }, { status: 404 });
    }

    // Rate limiting: 60 requests per minute per tenant
    const limit = await checkRateLimit('/api/chat/send', callerProfile.tenant_id, 60, 60);
    if (!limit.success) {
      return rateLimitResponse(limit);
    }

    const { message_id } = await request.json();
    if (!message_id) {
      return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });
    }

    // 3. Verify message ownership: Ensure message belongs to caller's tenant
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id, content, sender_type, tenant_id, external_message_id, conversations!inner(id, tenant_id, platform, external_conversation_id, customer_phone)')
      .eq('id', message_id)
      .eq('conversations.tenant_id', callerProfile.tenant_id)
      .maybeSingle();

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Deduplication check: if message already dispatched to Meta, skip duplicate dispatch
    if (message.external_message_id) {
      return NextResponse.json({
        success: true,
        already_dispatched: true,
        external_message_id: message.external_message_id
      });
    }

    const conv = (message as any).conversations;
    const convPlatform = conv?.platform;

    // Web Widget messages are delivered directly in real-time to visitor's browser (no Meta API needed)
    if (convPlatform === 'web_widget') {
      return NextResponse.json({
        success: true,
        channel: 'web_widget',
        message: 'Message synced with live web visitor'
      });
    }

    // 4. Try external chat-service if configured and reachable
    if (process.env.CHAT_SERVICE_URL) {
      let serviceUrl = process.env.CHAT_SERVICE_URL.trim();
      if (serviceUrl) {
        if (!serviceUrl.startsWith('http://') && !serviceUrl.startsWith('https://')) {
          serviceUrl = `https://${serviceUrl}`;
        }
        if (!serviceUrl.endsWith('/send')) {
          serviceUrl = serviceUrl.endsWith('/') ? `${serviceUrl}send` : `${serviceUrl}/send`;
        }
        try {
          console.log(`[Next.js API] Attempting dispatch via chat-service: ${serviceUrl}`);
          const res = await fetch(serviceUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-api-key': process.env.INTERNAL_SERVICE_KEY || '',
            },
            body: JSON.stringify({ message_id }),
            signal: AbortSignal.timeout(3500)
          });
          if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
          }
          console.warn(`[Next.js API] chat-service returned status ${res.status}. Falling back to direct Meta dispatch.`);
        } catch (err: any) {
          console.warn(`[Next.js API] chat-service failed: ${err.message}. Falling back to direct Meta dispatch.`);
        }
      }
    }

    // 5. DIRECT META CLOUD API DISPATCH FALLBACK
    // Fetch tenant integration for this platform
    const serviceSupabase = createServiceClient();
    const { data: integration } = await serviceSupabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', callerProfile.tenant_id)
      .eq('platform', convPlatform)
      .maybeSingle();

    const recipientId = (conv.external_conversation_id || conv.customer_phone || '').trim();
    if (!recipientId) {
      return NextResponse.json({ error: 'Missing customer phone number or PSID for conversation' }, { status: 400 });
    }

    // Determine credentials: DB integration credentials > direct integration columns > environment fallback
    const externalPhoneId = (
      integration?.external_account_id ||
      integration?.credentials?.phone_number_id ||
      (convPlatform === 'whatsapp' ? process.env.META_PHONE_NUMBER_ID : '') ||
      '1081880905011541'
    ).trim();

    const rawToken = 
      integration?.credentials?.access_token ||
      integration?.access_token ||
      (convPlatform === 'messenger' ? (process.env.MESSENGER_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN) :
       convPlatform === 'instagram' ? (process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN) :
       process.env.META_ACCESS_TOKEN) || '';

    const accessToken = (decrypt(rawToken) || rawToken)?.trim();

    if (!accessToken) {
      return NextResponse.json({ error: `No access token found for platform ${convPlatform}` }, { status: 400 });
    }

    const mediaInfo = parseMediaContent(message.content || '');
    let externalMsgId = '';

    if (convPlatform === 'whatsapp') {
      let payload: any = {};

      if (mediaInfo) {
        let mediaId = '';
        if (mediaInfo.isBase64) {
          const uploadUrl = `https://graph.facebook.com/v21.0/${externalPhoneId}/media`;
          const buffer = Buffer.from(mediaInfo.base64Data, 'base64');
          const blob = new Blob([buffer], { type: mediaInfo.mimeType });
          const formData = new FormData();
          formData.append('messaging_product', 'whatsapp');
          formData.append('type', mediaInfo.mimeType);
          formData.append('file', blob, mediaInfo.fileName);

          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: formData
          });
          const uploadResult = await uploadRes.json();
          if (!uploadRes.ok) {
            console.error('[Next.js API] WhatsApp Media Upload Failed:', uploadResult);
            return NextResponse.json({ error: 'WhatsApp media upload failed', details: uploadResult }, { status: 502 });
          }
          mediaId = uploadResult.id;
        } else {
          mediaId = mediaInfo.fileUrl;
        }

        const typeMap: Record<string, string> = {
          images: 'image',
          videos: 'video',
          audio: 'audio',
          documents: 'document'
        };
        const waType = typeMap[mediaInfo.category] || 'document';

        payload = {
          messaging_product: 'whatsapp',
          to: recipientId,
          type: waType,
          [waType]: mediaInfo.isBase64 ? { id: mediaId } : { link: mediaId }
        };

        if (waType === 'document') {
          payload.document.filename = mediaInfo.fileName;
        } else if (mediaInfo.caption) {
          payload[waType].caption = mediaInfo.caption.length > 1024
            ? mediaInfo.caption.substring(0, 1020) + '...'
            : mediaInfo.caption;
        }
      } else {
        const btnRegex = /\[Buttons:\s*([^\]]+)\]/i;
        const btnMatch = (message.content || '').match(btnRegex);

        if (btnMatch) {
          const buttonsRaw = btnMatch[1].split('|').map((b: string) => b.trim()).filter((b: string) => b.length > 0).slice(0, 3);
          const bodyText = (message.content || '').replace(btnRegex, '').trim();

          payload = {
            messaging_product: 'whatsapp',
            to: recipientId,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: bodyText.substring(0, 1024) || 'Please select an option:' },
              action: {
                buttons: buttonsRaw.map((btn: string, idx: number) => ({
                  type: 'reply',
                  reply: { id: `btn_${idx}`, title: btn.substring(0, 20) }
                }))
              }
            }
          };
        } else {
          payload = {
            messaging_product: 'whatsapp',
            to: recipientId,
            type: 'text',
            text: { body: message.content }
          };
        }
      }

      const waUrl = `https://graph.facebook.com/v21.0/${externalPhoneId}/messages`;
      console.log(`[Next.js API] Direct WhatsApp dispatch to ${recipientId} via ${waUrl}`);

      const metaRes = await fetch(waUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        console.error('[Next.js API] Meta Graph API Error:', metaData);
        return NextResponse.json({ error: metaData.error?.message || 'Meta API returned an error', details: metaData }, { status: 502 });
      }

      externalMsgId = metaData.messages?.[0]?.id || '';
    } else if (convPlatform === 'messenger' || convPlatform === 'instagram') {
      const sendUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${accessToken}`;
      let metaRes: Response;

      if (mediaInfo) {
        const typeMap: Record<string, string> = {
          images: 'image',
          videos: 'video',
          audio: 'audio',
          documents: 'file'
        };
        const attachmentType = typeMap[mediaInfo.category] || 'file';

        if (mediaInfo.isBase64) {
          const uploadUrl = `https://graph.facebook.com/v21.0/${externalPhoneId}/message_attachments?access_token=${accessToken}`;
          const buffer = Buffer.from(mediaInfo.base64Data, 'base64');
          const blob = new Blob([buffer], { type: mediaInfo.mimeType });
          const uploadForm = new FormData();
          uploadForm.append('message', JSON.stringify({ attachment: { type: attachmentType, payload: { is_reusable: true } } }));
          uploadForm.append('filedata', blob, mediaInfo.fileName);

          const uploadRes = await fetch(uploadUrl, { method: 'POST', body: uploadForm });
          const uploadResult = await uploadRes.json();
          if (!uploadRes.ok) {
            return NextResponse.json({ error: 'Attachment upload failed', details: uploadResult }, { status: 502 });
          }

          metaRes = await fetch(sendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: recipientId },
              message: { attachment: { type: attachmentType, payload: { attachment_id: uploadResult.attachment_id } } }
            })
          });
        } else {
          metaRes = await fetch(sendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: recipientId },
              message: { attachment: { type: attachmentType, payload: { url: mediaInfo.fileUrl, is_reusable: true } } }
            })
          });
        }
      } else {
        metaRes = await fetch(sendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: message.content }
          })
        });
      }

      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        console.error(`[Next.js API] Meta ${convPlatform} Send API Error:`, metaData);
        return NextResponse.json({ error: metaData.error?.message || 'Meta API returned error', details: metaData }, { status: 502 });
      }

      externalMsgId = metaData.message_id || '';
    }

    // 6. Update message with external_message_id and conversation timestamps
    if (externalMsgId) {
      await serviceSupabase
        .from('messages')
        .update({ external_message_id: externalMsgId })
        .eq('id', message.id);
    }

    await serviceSupabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: (message.content || '').slice(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', message.conversation_id);

    return NextResponse.json({
      success: true,
      external_message_id: externalMsgId,
      dispatched_via: 'direct_meta_api'
    });

  } catch (err: any) {
    console.error(`[Next.js API] Exception in /api/chat/send:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
