import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, tone, customer_name } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text to refine' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Graceful fallback if no OpenAI key configured in dev
      return NextResponse.json({ refinedText: text });
    }

    const systemPrompt = `You are a professional customer support communication co-pilot. Refine the provided draft message for a customer named "${customer_name || 'Customer'}". Make it ${tone || 'professional'}, clear, engaging, and grammatically perfect. Return ONLY the refined message without extra commentary or quotes.`;

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
          { role: 'user', content: text },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (aiResp.ok) {
      const data = await aiResp.json();
      const refined = data.choices?.[0]?.message?.content?.trim();
      return NextResponse.json({ refinedText: refined || text });
    }

    return NextResponse.json({ refinedText: text });
  } catch (err: any) {
    console.error('[AI Refine Error]:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
