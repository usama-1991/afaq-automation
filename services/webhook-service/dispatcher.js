import { decrypt } from './crypto.js';

function parseMediaContent(content) {
  if (!content) return null;

  // 1. Format: [Media: Images] fileName|url
  const mediaRegex = /^\[Media:\s*(Images|Documents|Videos|Audio)\]\s*([^|]+)\|(.+)$/i;
  const match = content.match(mediaRegex);
  if (match) {
    return {
      category: match[1].toLowerCase(),
      fileName: match[2].trim(),
      fileUrl: match[3].trim(),
      isBase64: false,
      base64Data: '',
      mimeType: '',
      caption: ''
    };
  }

  // 2. Format: ![Caption](URL)
  const mdRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/i;
  const mdMatch = content.match(mdRegex);
  if (mdMatch) {
    return {
      category: 'images',
      fileName: mdMatch[1] || 'image.jpg',
      fileUrl: mdMatch[2],
      isBase64: false,
      base64Data: '',
      mimeType: 'image/jpeg',
      caption: content.replace(mdMatch[0], '').trim()
    };
  }

  return null;
}

// In-memory set to prevent concurrent dispatches of the same message within this process
const _dispatchingMsgIds = new Set();

export async function dispatchOutboundMessage(supabase, message, log = console) {
  if (!message || message.sender_type === 'customer') return;

  // 1. Deduplication check: If already dispatched to Meta, skip immediately
  if (message.external_message_id && !message.external_message_id.startsWith('dispatching_')) {
    log.info?.(`[dispatcher] Message ${message.id} already has external_message_id ${message.external_message_id}. Skipping.`);
    return message.external_message_id;
  }

  // 2. In-memory concurrency guard: Skip if another call is currently executing for this message
  if (_dispatchingMsgIds.has(message.id)) {
    log.info?.(`[dispatcher] Message ${message.id} is already actively being dispatched. Skipping parallel call.`);
    return;
  }
  _dispatchingMsgIds.add(message.id);

  let claimed = false;

  try {
    // 3. Distributed atomic DB claim:
    // If message was pre-claimed upon insert by ai-agent.js, honor that lock.
    // Otherwise, atomically transition external_message_id from NULL to 'dispatching_...'.
    const isPreClaimed = message.external_message_id && message.external_message_id.startsWith('dispatching_');
    if (isPreClaimed) {
      claimed = true;
      log.info?.(`[dispatcher] Message ${message.id} pre-claimed with lock ${message.external_message_id}. Preparing dispatch.`);
    } else {
      const lockId = `dispatching_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const { data: claimedRows, error: claimError } = await supabase
        .from('messages')
        .update({ external_message_id: lockId })
        .eq('id', message.id)
        .is('external_message_id', null)
        .select('id');

      if (claimError || !claimedRows || claimedRows.length === 0) {
        log.info?.(`[dispatcher] Message ${message.id} already claimed by another process or dispatched. Aborting duplicate send.`);
        return;
      }
      claimed = true;
      log.info?.(`[dispatcher] Atomic claim acquired for message ${message.id}. Preparing dispatch.`);
    }

    // 4. Get Conversation details
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', message.conversation_id)
      .maybeSingle();

    if (convError || !conv) {
      log.warn?.(`[dispatcher] Conversation ${message.conversation_id} not found.`);
      await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
      return;
    }

    if (conv.platform === 'web_widget') {
      // In-browser widget messages are handled directly in real-time
      return null;
    }

    // 5. Get Integration details for this tenant & platform
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', conv.tenant_id)
      .eq('platform', conv.platform)
      .maybeSingle();

    if (intError || !integration) {
      log.warn?.(`[dispatcher] Integration not found for tenant ${conv.tenant_id} on ${conv.platform}`);
      await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
      return;
    }

    const externalPhoneId = (
      integration.external_account_id ||
      integration.credentials?.phone_number_id ||
      integration.credentials?.page_id ||
      process.env.META_PHONE_NUMBER_ID ||
      ''
    ).trim();

    const customerPhone = conv.external_conversation_id?.trim();
    let rawToken = (
      integration.credentials?.access_token ||
      integration.access_token ||
      process.env.META_ACCESS_TOKEN ||
      ''
    ).trim();

    if (conv.platform === 'messenger') {
      rawToken = (
        integration.credentials?.access_token ||
        integration.access_token ||
        process.env.MESSENGER_ACCESS_TOKEN ||
        process.env.META_ACCESS_TOKEN ||
        ''
      ).trim();
    }

    if (conv.platform === 'instagram') {
      rawToken = (
        integration.credentials?.access_token ||
        integration.access_token ||
        process.env.INSTAGRAM_ACCESS_TOKEN ||
        process.env.MESSENGER_ACCESS_TOKEN ||
        ''
      ).trim();
    }

    let accessToken = (decrypt(rawToken) || rawToken)?.trim();

    if (!accessToken) {
      log.error?.(`[dispatcher] No Meta access token found for ${conv.platform}`);
      await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
      return;
    }
    if (!customerPhone) {
      log.error?.(`[dispatcher] No recipient phone/PSID for conv ${conv.id}`);
      await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
      return;
    }

    // 6. Send via Meta Graph API
    const mediaInfo = parseMediaContent(message.content);

    if (conv.platform === 'whatsapp') {
      let payload = {};

      if (mediaInfo) {
        payload = {
          messaging_product: 'whatsapp',
          to: customerPhone,
          type: 'image',
          image: { link: mediaInfo.fileUrl }
        };
        if (mediaInfo.caption) payload.image.caption = mediaInfo.caption;
      } else {
        const btnRegex = /\[Buttons:\s*([^\]]+)\]/i;
        const btnMatch = message.content.match(btnRegex);

        if (btnMatch) {
          const buttonsRaw = btnMatch[1].split('|').map(b => b.trim()).filter(b => b.length > 0).slice(0, 3);
          const bodyText = message.content.replace(btnRegex, '').trim();

          payload = {
            messaging_product: 'whatsapp',
            to: customerPhone,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: bodyText.substring(0, 1024) || 'Please select an option:' },
              action: {
                buttons: buttonsRaw.map((btn, idx) => ({
                  type: 'reply',
                  reply: { id: `btn_${idx}`, title: btn.substring(0, 20) }
                }))
              }
            }
          };
        } else {
          payload = {
            messaging_product: 'whatsapp',
            to: customerPhone,
            type: 'text',
            text: { body: message.content }
          };
        }
      }

      const waPhoneId = externalPhoneId || process.env.META_PHONE_NUMBER_ID;
      const url = `https://graph.facebook.com/v21.0/${waPhoneId}/messages`;
      log.info?.(`[whatsapp] Dispatching to ${customerPhone} via ${url}`);

      const metaRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });

      const result = await metaRes.json();
      if (!metaRes.ok) {
        log.error?.(`[whatsapp] Meta Send Error: ${JSON.stringify(result)}`);
        await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
        return;
      }

      const waMessageId = result.messages?.[0]?.id;
      if (waMessageId) {
        log.info?.(`[whatsapp] Successfully sent! ID: ${waMessageId}`);
        await supabase.from('messages').update({ external_message_id: waMessageId }).eq('id', message.id);
        return waMessageId;
      }
    } else if (conv.platform === 'messenger' || conv.platform === 'instagram') {
      const sendUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${accessToken}`;
      log.info?.(`[${conv.platform}] Sending to ${customerPhone} via /me/messages`);

      // Clean up any button syntax for Messenger text
      const cleanText = (message.content || '').replace(/\[Buttons:\s*([^\]]+)\]/i, '').trim();

      const payload = {
        recipient: { id: customerPhone },
        message: { text: cleanText }
      };

      const metaRes = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });

      const result = await metaRes.json();
      if (!metaRes.ok) {
        log.error?.(`[${conv.platform}] Meta Send Error: ${JSON.stringify(result)}`);
        await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
        return;
      }

      const msgId = result.message_id || result.messages?.[0]?.id;
      if (msgId) {
        log.info?.(`[${conv.platform}] Successfully sent! ID: ${msgId}`);
        await supabase.from('messages').update({ external_message_id: msgId }).eq('id', message.id);
        return msgId;
      }
    }
  } catch (err) {
    log.error?.(`[dispatcher] Unexpected error dispatching message ${message.id}: ${err.message}`);
    if (claimed) {
      await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id).catch(() => {});
    }
  } finally {
    setTimeout(() => _dispatchingMsgIds.delete(message.id), 15000);
  }
}

// Deprecated no-op: Kept for backwards compatibility if referenced
export function startRealtimeDispatcher(supabase, log = console) {
  log.info?.('[dispatcher] Realtime dispatcher is disabled to prevent duplicate sends.');
}
