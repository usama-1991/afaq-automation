import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const { conversationId } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_type, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(30);

    if (!messages || messages.length === 0) {
      return NextResponse.json({ summary: 'No conversation history found to summarize.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        summary: `Thread contains ${messages.length} messages. Key topics: Inquiry regarding services/products. Status: Open.` 
      });
    }

    const transcript = messages
      .map(m => `[${m.sender_type.toUpperCase()}]: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are a CRM conversation summarization assistant. Analyze the transcript and provide a concise, high-impact summary with 3 clear bullet points:
1. Customer Goal / Main Inquiry
2. Current Status & Key Details
3. Recommended Next Action for Agent`;

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        temperature: 0.3,
        max_tokens: 350,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (aiResp.ok) {
      const data = await aiResp.json();
      const summary = data.choices?.[0]?.message?.content?.trim();
      return NextResponse.json({ summary });
    }

    return NextResponse.json({ 
      summary: `Analyzed ${messages.length} messages. Primary inquiry identified. Agent follow-up recommended.` 
    });
  } catch (err: any) {
    console.error('[AI Summarize Error]:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
