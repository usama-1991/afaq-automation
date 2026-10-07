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

  // 3. Format: Direct Image URL anywhere in content (.jpg, .jpeg, .png, .webp, .gif)
  const imgUrlRegex = /(https?:\/\/[^\s<>"')]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s<>"')]*)?)/i;
  const imgMatch = content.match(imgUrlRegex);
  if (imgMatch) {
    const fileUrl = imgMatch[1];
    let caption = content
      .replace(imgMatch[0], '')
      .replace(/\*[^*]+\*:\s*$/gm, '')
      .replace(/🔗\s*(?:Link|URL)?:?/gi, '')
      .replace(/🖼️\s*(?:Image|Photo)?:?/gi, '')
      .replace(/📎/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      category: 'images',
      fileName: 'image.jpg',
      fileUrl: fileUrl,
      isBase64: false,
      base64Data: '',
      mimeType: 'image/jpeg',
      caption: caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption
    };
  }

  // 4. Format: Direct Document URL (.pdf)
  const pdfUrlRegex = /(https?:\/\/[^\s<>"')]+\.pdf(?:\?[^\s<>"')]*)?)/i;
  const pdfMatch = content.match(pdfUrlRegex);
  if (pdfMatch) {
    const fileUrl = pdfMatch[1];
    let caption = content
      .replace(pdfMatch[0], '')
      .replace(/🔗\s*(?:Link|URL)?:?/gi, '')
      .replace(/📄\s*(?:Document|PDF)?:?/gi, '')
      .trim();

    return {
      category: 'documents',
      fileName: 'document.pdf',
      fileUrl: fileUrl,
      isBase64: false,
      base64Data: '',
      mimeType: 'application/pdf',
      caption: caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption
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
      const waPhoneId = externalPhoneId || process.env.META_PHONE_NUMBER_ID;
      const url = `https://graph.facebook.com/v21.0/${waPhoneId}/messages`;
      let payload = {};

      if (mediaInfo) {
        // Send accompanying text first if present so explanation is never dropped
        if (mediaInfo.caption) {
          log.info?.(`[whatsapp] Dispatching accompanying text to ${customerPhone}`);
          try {
            await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: 'text',
                text: { body: mediaInfo.caption }
              }),
              signal: AbortSignal.timeout(15000)
            });
          } catch (textErr) {
            log.warn?.(`[whatsapp] Error sending accompanying text: ${textErr.message}`);
          }
        }

        if (mediaInfo.category === 'documents') {
          payload = {
            messaging_product: 'whatsapp',
            to: customerPhone,
            type: 'document',
            document: { link: mediaInfo.fileUrl, filename: mediaInfo.fileName || 'document.pdf' }
          };
        } else {
          payload = {
            messaging_product: 'whatsapp',
            to: customerPhone,
            type: 'image',
            image: { link: mediaInfo.fileUrl }
          };
        }
      } else {
        const flowRegex = /\[Flow:\s*([^|\]]+)(?:\|([^|\]]+))?(?:\|([^|\]]+))?(?:\|([^|\]]+))?\]/i;
        const flowMatch = message.content.match(flowRegex);
        const btnRegex = /\[Buttons?:\s*([^\]]+)\]/i;
        const btnMatch = message.content.match(btnRegex);
        const slotRegex = /\[Slots:\s*([^\]]+)\]/i;
        const slotMatch = message.content.match(slotRegex);

        if (flowMatch) {
          const flowId = flowMatch[1].trim();
          const ctaText = (flowMatch[2] || 'Open Form').trim().slice(0, 20);
          const screenName = (flowMatch[3] || 'BOOKING_FORM').trim();
          const headerText = (flowMatch[4] || 'Interactive Form').trim().slice(0, 60);
          const bodyText = message.content
            .replace(flowRegex, '')
            .replace(btnRegex, '')
            .replace(slotRegex, '')
            .trim() || 'Please tap below to complete the native form:';

          // Query flow status to determine draft vs published mode
          let flowMode = 'published';
          try {
            const { data: flowRecord } = await supabase
              .from('whatsapp_flows')
              .select('status')
              .eq('flow_id', flowId)
              .maybeSingle();
            if (flowRecord?.status === 'DRAFT') {
              flowMode = 'draft';
            }
          } catch (e) {
            // default to published
          }

          payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: customerPhone,
            type: 'interactive',
            interactive: {
              type: 'flow',
              header: { type: 'text', text: headerText },
              body: { text: bodyText },
              footer: { text: 'Powered by Ittisalo' },
              action: {
                name: 'flow',
                parameters: {
                  mode: flowMode,
                  flow_message_version: '3',
                  flow_token: `conv_${conv.id}_${Date.now()}`,
                  flow_id: flowId,
                  flow_cta: ctaText,
                  flow_action: 'navigate',
                  flow_action_payload: {
                    screen: screenName,
                    data: {}
                  }
                }
              }
            }
          };
        } else if (btnMatch) {
          const buttonsRaw = btnMatch[1].split('|').map(b => b.trim()).filter(b => b.length > 0).slice(0, 3);
          const bodyText = message.content
            .replace(btnRegex, '')
            .replace(slotRegex, '')
            .replace(flowRegex, '')
            .trim();

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
        } else if (slotMatch) {
          const bodyText = message.content
            .replace(slotRegex, '')
            .replace(btnRegex, '')
            .replace(flowRegex, '')
            .trim();
          const rawGroups = slotMatch[1].split(';');
          const groups = [];
          const allSlots = [];

          for (const groupStr of rawGroups) {
            if (!groupStr.trim()) continue;
            const parts = groupStr.split('|');
            let date = '';
            let times = [];
            if (parts.length >= 2) {
              date = parts[0].trim();
              times = parts[1].split(',').map(t => t.trim()).filter(Boolean);
            } else {
              times = parts[0].split(',').map(t => t.trim()).filter(Boolean);
            }
            if (times.length > 0) {
              groups.push({ date, times });
              times.forEach(t => allSlots.push({ date, time: t }));
            }
          }

          if (allSlots.length > 0 && allSlots.length <= 3) {
            payload = {
              messaging_product: 'whatsapp',
              to: customerPhone,
              type: 'interactive',
              interactive: {
                type: 'button',
                body: { text: bodyText.substring(0, 1024) || 'Please select an available slot:' },
                action: {
                  buttons: allSlots.map((s, idx) => {
                    let title = s.time;
                    if (groups.length > 1 && s.date) {
                      const shortDate = s.date.split(',')[0].trim();
                      const combined = `${shortDate} ${s.time}`;
                      if (combined.length <= 20) title = combined;
                    }
                    return {
                      type: 'reply',
                      reply: {
                        id: `slot_${idx}`,
                        title: title.substring(0, 20)
                      }
                    };
                  })
                }
              }
            };
          } else if (allSlots.length > 3) {
            let totalRows = 0;
            const sections = [];
            for (const g of groups) {
              if (totalRows >= 10) break;
              const rows = [];
              for (const t of g.times) {
                if (totalRows >= 10) break;
                rows.push({
                  id: `slot_${totalRows}`,
                  title: t.substring(0, 24),
                  description: g.date ? `Book for ${g.date}`.substring(0, 72) : undefined
                });
                totalRows++;
              }
              if (rows.length > 0) {
                sections.push({
                  title: (g.date || 'Available Slots').substring(0, 24),
                  rows
                });
              }
            }

            payload = {
              messaging_product: 'whatsapp',
              to: customerPhone,
              type: 'interactive',
              interactive: {
                type: 'list',
                header: { type: 'text', text: 'Available Appointments' },
                body: { text: bodyText.substring(0, 1024) || 'Please choose a slot that works best for you:' },
                action: {
                  button: 'Select Slot',
                  sections
                }
              }
            };
          } else {
            payload = {
              messaging_product: 'whatsapp',
              to: customerPhone,
              type: 'text',
              text: { body: bodyText || message.content }
            };
          }
        } else {
          const cleanBody = (message.content || '')
            .replace(flowRegex, '')
            .replace(btnRegex, '')
            .replace(slotRegex, '')
            .trim();

          payload = {
            messaging_product: 'whatsapp',
            to: customerPhone,
            type: 'text',
            text: { body: cleanBody || message.content }
          };
        }
      }

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
        try {
          await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
        } catch (_) {}
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

      let payload = {};
      if (mediaInfo) {
        // Send accompanying text first if present
        if (mediaInfo.caption) {
          log.info?.(`[${conv.platform}] Dispatching accompanying text to ${customerPhone}`);
          try {
            await fetch(sendUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: customerPhone },
                message: { text: mediaInfo.caption }
              }),
              signal: AbortSignal.timeout(15000)
            });
          } catch (textErr) {
            log.warn?.(`[${conv.platform}] Error sending accompanying text: ${textErr.message}`);
          }
        }

        payload = {
          recipient: { id: customerPhone },
          message: {
            attachment: {
              type: mediaInfo.category === 'documents' ? 'file' : 'image',
              payload: {
                url: mediaInfo.fileUrl,
                is_reusable: true
              }
            }
          }
        };
      } else {
        // Clean up any button or slot syntax for Messenger/Instagram text
        const cleanText = (message.content || '')
          .replace(/\[Flow:\s*[^\]]+\]/gi, '')
          .replace(/\[Buttons?:\s*[^\]]+\]/gi, '')
          .replace(/\[Slots:\s*[^\]]+\]/gi, '')
          .trim();

        payload = {
          recipient: { id: customerPhone },
          message: { text: cleanText || message.content }
        };
      }

      const metaRes = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });

      const result = await metaRes.json();
      if (!metaRes.ok) {
        log.error?.(`[${conv.platform}] Send Error: ${JSON.stringify(result)}`);
        try {
          await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
        } catch (_) {}
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
      try {
        await supabase.from('messages').update({ external_message_id: null }).eq('id', message.id);
      } catch (_) {}
    }
  } finally {
    setTimeout(() => _dispatchingMsgIds.delete(message.id), 15000);
  }
}

// Deprecated no-op: Kept for backwards compatibility if referenced
export function startRealtimeDispatcher(supabase, log = console) {
  log.info?.('[dispatcher] Realtime dispatcher is disabled to prevent duplicate sends.');
}
