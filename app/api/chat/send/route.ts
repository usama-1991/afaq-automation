import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message_id } = await request.json();
    if (!message_id) {
      return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });
    }

    // Direct private DNS on Railway is 'http://chat-service:3004/send'
    // Fallback to process.env or local port 3004
    const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3004/send';
    
    console.log(`[Next.js API] Proxying send request for message_id: ${message_id} to: ${chatServiceUrl}`);
    
    const response = await fetch(chatServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message_id })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[Next.js API] chat-service returned error:`, data);
      return NextResponse.json({ error: data.error || 'Failed to dispatch message via chat-service' }, { status: response.status });
    }
    
    console.log(`[Next.js API] Successfully dispatched! Response:`, data);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(`[Next.js API] Exception in proxy:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
