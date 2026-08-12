export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client with Service Role Key
// Provide safe fallbacks to prevent build-time crashes on Railway if env vars are missing during build phase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for logging
const log = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string | any) => console.error(`[ERROR]`, msg),
};

// ── GET: Webhook Verification ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      log.info('Webhook verified successfully.');
      return new NextResponse(challenge, { status: 200 });
    } else {
      log.warn('Webhook verification failed: token mismatch.');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
}

// Audit Logging Helper
async function logAudit(tenantId: string, action: string, details: any) {
  try {
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      action: action,
      details: details
    });
  } catch (err: any) {
    log.error(`Failed to write audit log: ${err.message}`);
  }
}

async function processIncomingMessage(platform: string, externalAccountId: string, customerId: string, customerName: string, messageText: string, messageId: string) {
  log.info(`[${platform}] Processing message ${messageId} from ${customerId}`);

  // 0. Deduplication
  if (messageId) {
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('external_message_id', messageId)
      .maybeSingle();
    if (existing) {
      log.info(`[${platform}] Duplicate message ${messageId} — skipping.`);
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
    log.error(`[${platform}] No tenant found for account ID: ${externalAccountId}. Error: ${intError?.message}`);
    return;
  }
  log.info(`[${platform}] Tenant found: ${integration.tenant_id}`);

  const tenantId = integration.tenant_id;

  // 1b. Fetch full tenant record for niche context
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
  } catch (e: any) {
    log.warn(`[${platform}] Could not fetch tenant niche: ${e.message}`);
  }

  // 2. Find or Create Conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id, unread_count, status')
    .eq('tenant_id', tenantId)
    .eq('external_conversation_id', customerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!conversation) {
    log.info(`[${platform}] Creating new conversation for ${customerId}`);
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
      const { data: retryConv } = await supabase
        .from('conversations')
        .select('id, unread_count, status')
        .eq('tenant_id', tenantId)
        .eq('external_conversation_id', customerId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!retryConv) {
        log.error(`[${platform}] Failed to create conversation: ${newConvError.message}`);
        return;
      }
      conversation = retryConv;
    } else {
      conversation = newConv;
    }
    log.info(`[${platform}] Conversation ready: ${conversation?.id}`);
    if (conversation) await logAudit(tenantId, 'conversation_started', { platform, external_conversation_id: customerId, customer_name: customerName });
  } else {
    log.info(`[${platform}] Existing conversation found: ${conversation.id}`);
    await supabase
      .from('conversations')
      .update({ customer_name: customerName, updated_at: new Date().toISOString() })
      .eq('id', conversation.id);
  }

  if (!conversation) return;

  // 3. Insert Message & Update Counter
  log.info(`[${platform}] Inserting message and incrementing unread_count`);
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
      log.info(`[${platform}] Duplicate message caught by DB unique constraint: ${messageId}. Skipping.`);
      return;
    }
    log.error(`[${platform}] Failed to insert message: ${msgError.message}`);
    return;
  }

  await logAudit(tenantId, 'message_received', { platform, external_message_id: messageId, conversation_id: conversation.id });

  const currentCount = conversation?.unread_count || 0;
  await supabase
    .from('conversations')
    .update({ 
      updated_at: new Date().toISOString(),
      unread_count: currentCount + 1 
    })
    .eq('id', conversation.id);

  log.info(`[${platform}] Message inserted and counter updated to ${currentCount + 1}.`);

  if (conversation?.status === 'pending') {
    log.info(`[${platform}] Conversation ${conversation.id} is in human handoff (pending). Skipping n8n AI.`);
    return;
  }

  // 4. Fetch enrichment data and fire n8n
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    try {
      const [kbResult, historyResult, integResult, agentResult] = await Promise.allSettled([
        supabase.from('knowledge_base').select('kb_type, title, content').eq('tenant_id', tenantId).eq('is_active', true).limit(20),
        supabase.from('messages').select('sender_type, content, created_at').eq('conversation_id', conversation.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('integrations').select('platform, external_account_id, credentials').eq('tenant_id', tenantId),
        supabase.from('agents').select('name, prompt, tone, language').eq('tenant_id', tenantId).eq('is_active', true).maybeSingle(),
      ]);

      const knowledgeBase = kbResult.status === 'fulfilled' ? (kbResult.value.data || []) : [];
      const conversationHistory = historyResult.status === 'fulfilled' ? (historyResult.value.data || []).reverse() : [];
      const integrations = integResult.status === 'fulfilled' ? (integResult.value.data || []) : [];
      const agentConfig = (agentResult.status === 'fulfilled' ? (agentResult.value.data || {}) : {}) as any;

      const integMap: any = {};
      for (const integ of integrations) integMap[integ.platform] = integ.credentials || {};

      const metaCreds = integMap['meta'] || {};
      const { data: existingContext } = await supabase
        .from('conversation_context')
        .select('last_intent, funnel_stage, context_data')
        .eq('conversation_id', conversation.id)
        .maybeSingle();

      const n8nPayload = {
        tenant_id: tenantId,
        customer_phone: customerId,
        customer_name: customerName,
        platform: platform,
        message_type: 'text',
        message: messageText,
        external_message_id: messageId,
        conversation_id: conversation.id,
        phone_number_id: metaCreds.phone_number_id || process.env.META_PHONE_NUMBER_ID || '',
        timestamp: new Date().toISOString()
      };

      log.info(`[${platform}] Firing n8n with niche="${tenantNiche}", kb=${knowledgeBase.length} items`);

      fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify(n8nPayload),
      }).catch(err => log.error(`Failed to trigger n8n: ${err.message}`));

    } catch (enrichErr: any) {
      log.error(`[${platform}] Enrichment failed, firing n8n with minimal payload: ${enrichErr.message}`);
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
          conversation_id: conversation.id,
          phone_number_id: process.env.META_PHONE_NUMBER_ID || '',
          timestamp: new Date().toISOString()
        }),
      }).catch(err => log.error(`Fallback n8n trigger failed: ${err.message}`));
    }
  }
}

async function processMessageStatus(statusObj: any) {
  const metaMessageId = statusObj.id;
  const deliveryStatus = statusObj.status; 
  log.info(`[whatsapp] Message status update: ${metaMessageId} -> ${deliveryStatus}`);
  
  const { data: campMsg } = await supabase
    .from('campaign_messages')
    .select('campaign_id')
    .eq('meta_message_id', metaMessageId)
    .single();

  if (!campMsg) return;

  await supabase
    .from('campaign_messages')
    .update({ status: deliveryStatus, updated_at: new Date().toISOString() })
    .eq('meta_message_id', metaMessageId);

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
        sent_count, delivered_count, read_count, failed_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', campMsg.campaign_id);
  }
}

// ── POST: Webhook Event Receiver ──────────────────────────────────────────────
// ⚠️ DISABLED: Message processing is handled exclusively by the Fastify
// webhook-service (services/webhook-service/server.js).
// Having BOTH this route AND the Fastify service active caused every incoming
// message to be processed twice → double n8n triggers → double AI replies
// sent to WhatsApp users. See: docs/double_response_diagnosis.md
//
// This route now only acknowledges the event with 200 so Meta doesn't retry.
// If you ever decommission the Fastify webhook-service, re-enable the logic here.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    log.info('[webhook/route.ts] Received webhook event — passing through (processing disabled, handled by Fastify webhook-service)');

    const supportedObjects = ['whatsapp_business_account', 'page', 'instagram'];

    if (supportedObjects.includes(body.object)) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (err: any) {
    log.error(`Webhook Error: ${err.message}`);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
