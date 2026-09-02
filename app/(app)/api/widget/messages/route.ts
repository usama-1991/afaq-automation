import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import crypto from 'crypto';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ── GET: Fetch conversation messages for the visitor ────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const tenantId = searchParams.get('tenantId');

    if (!conversationId || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters: conversationId, tenantId' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createServiceClient();

    // Verify conversation belongs to tenant
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id, status, customer_name')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (convErr || !conv) {
      return NextResponse.json(
        { error: 'Conversation not found or unauthorized' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Fetch messages (limit to last 50)
    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('id, sender_type, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (msgErr) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        conversationId,
        status: conv.status,
        messages: messages || [],
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[Widget Messages GET Error]:', err);
    return NextResponse.json(
      { error: 'Internal server error fetching messages' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// ── POST: Ingest visitor message from the widget ────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tenantId, conversationId, content, visitorId } = body;

    if (!tenantId || !conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, conversationId, content' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const text = content.trim();
    const supabase = createServiceClient();

    // 1. Verify conversation
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id, tenant_id, status, unread_count, customer_name, external_conversation_id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (convErr || !conv) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // 2. Insert visitor message
    const externalMsgId = `web_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const { data: insertedMsg, error: insertErr } = await supabase
      .from('messages')
      .insert({
        tenant_id: tenantId,
        conversation_id: conversationId,
        sender_type: 'customer',
        content: text,
        external_message_id: externalMsgId,
        created_at: new Date().toISOString()
      })
      .select('id, created_at')
      .single();

    if (insertErr) {
      console.error('[Widget Message Insert Error]:', insertErr);
      return NextResponse.json(
        { error: 'Failed to record message' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // 3. Update conversation last message preview & unread count
    const currentUnread = conv.unread_count || 0;
    await supabase
      .from('conversations')
      .update({
        last_message_preview: text.slice(0, 100),
        unread_count: currentUnread + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // 4. Trigger AI Bot if conversation is open (not in human handoff)
    if (conv.status === 'open') {
      triggerAIBotResponse(supabase, tenantId, conversationId, conv, text, externalMsgId).catch(err => {
        console.warn('[Widget AI Trigger Warning]:', err.message);
      });
    }

    return NextResponse.json(
      {
        success: true,
        messageId: insertedMsg.id,
        createdAt: insertedMsg.created_at,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[Widget Message POST Error]:', err);
    return NextResponse.json(
      { error: 'Internal server error sending message' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// ── Background helper: Dispatch message to webhook-service or n8n AI ─
async function triggerAIBotResponse(
  supabase: any,
  tenantId: string,
  conversationId: string,
  conv: any,
  messageText: string,
  messageId: string
) {
  try {
    // 1. Fetch tenant niche and agent details
    const { data: tenant } = await supabase
      .from('tenants')
      .select('niche, business_name, default_currency')
      .eq('id', tenantId)
      .maybeSingle();

    const [kbRes, agentRes] = await Promise.all([
      supabase.from('knowledge_base').select('kb_type, title, content').eq('tenant_id', tenantId).eq('is_active', true).limit(10),
      supabase.from('agents').select('name, prompt, tone, language').eq('tenant_id', tenantId).eq('is_active', true).maybeSingle()
    ]);

    const payload = {
      tenant_id: tenantId,
      conversation_id: conversationId,
      customer_phone: conv.external_conversation_id || 'web_visitor',
      customer_name: conv.customer_name || 'Website Visitor',
      platform: 'web_widget',
      message_type: 'text',
      message: messageText,
      normalized_message: messageText,
      external_message_id: messageId,
      niche: tenant?.niche || 'general',
      business_name: tenant?.business_name || '',
      currency: tenant?.default_currency || 'PKR',
      knowledge_base: kbRes.data || [],
      agent_name: agentRes.data?.name || null,
      agent_prompt: agentRes.data?.prompt || null,
      timestamp: new Date().toISOString()
    };

    // 2. Direct OpenAI LLM Generation if OPENAI_API_KEY is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const systemPrompt = agentRes.data?.prompt || 
          `You are the official AI assistant for ${tenant?.business_name || 'our business'} (${tenant?.niche || 'service'}). Respond helpfully, politely, and concisely to customer inquiries.`;
        
        const kbText = (kbRes.data || [])
          .map((k: any) => `[${k.title}]: ${k.content}`)
          .join('\n\n');

        const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY.trim()}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: `${systemPrompt}${kbText ? `\n\nVerified Business Knowledge:\n${kbText}` : ''}\n\nInstructions: Provide helpful, direct answers. If you do not know something, offer to connect them with our human team.` 
              },
              { role: 'user', content: messageText }
            ],
            temperature: 0.6,
            max_tokens: 350
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (aiResp.ok) {
          const aiJson = await aiResp.json();
          const replyText = aiJson.choices?.[0]?.message?.content?.trim();
          if (replyText) {
            await supabase.from('messages').insert({
              tenant_id: tenantId,
              conversation_id: conversationId,
              sender_type: 'bot',
              content: replyText,
              created_at: new Date().toISOString()
            });

            await supabase.from('conversations').update({
              last_message_preview: replyText.slice(0, 100),
              updated_at: new Date().toISOString()
            }).eq('id', conversationId);

            return; // Successfully responded via AI
          }
        }
      } catch (openAiErr: any) {
        console.warn('[Direct OpenAI Generation Error]:', openAiErr.message);
      }
    }

    // 3. Fallback: Dispatch to internal AI microservice (Railway airy-reprieve or webhook-service)
    const webhookUrls = [
      process.env.WEBHOOK_SERVICE_URL,
      // Railway private networking for user's service: airy-reprieve
      'http://airy-reprieve.railway.internal:8080/api/ai/process',
      'http://airy-reprieve.railway.internal:3000/api/ai/process',
      'http://airy-reprieve.railway.internal:3002/api/ai/process',
      'http://airy-reprieve.railway.internal:3003/api/ai/process',
      'http://airy-reprieve:8080/api/ai/process',
      'http://airy-reprieve:3000/api/ai/process',
      'http://webhook-service.private.railway.internal:8080/api/ai/process',
      'http://webhook-service.private.railway.internal:3000/api/ai/process',
      'http://localhost:3002/api/ai/process',
    ].filter(Boolean) as string[];

    for (const url of webhookUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': process.env.INTERNAL_SERVICE_KEY || '',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) return;
      } catch (_) {}
    }

    // Fallback: If n8n webhook URL configured
    if (process.env.N8N_WEBHOOK_URL) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });
    }
  } catch (err: any) {
    console.warn('[triggerAIBotResponse Error]:', err.message);
  }
}
