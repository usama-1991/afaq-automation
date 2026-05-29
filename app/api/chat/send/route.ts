import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message_id } = await request.json();
    if (!message_id) {
      return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });
    }

    const urlsToTry: string[] = [];
    if (process.env.CHAT_SERVICE_URL) {
      urlsToTry.push(process.env.CHAT_SERVICE_URL);
    }
    // Railway private DNS
    urlsToTry.push('http://chat-service:3004/send');
    // Local developer fallback
    urlsToTry.push('http://localhost:3004/send');

    let lastError: any = null;
    let response: Response | null = null;
    let successUrl = '';

    for (const url of urlsToTry) {
      try {
        console.log(`[Next.js API] Trying to dispatch message ${message_id} to: ${url}`);
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id }),
          // Short timeout to fail-fast and try next URL if offline
          signal: AbortSignal.timeout(4000)
        });
        if (response) {
          successUrl = url;
          break;
        }
      } catch (err: any) {
        console.warn(`[Next.js API] Failed dispatch to ${url}: ${err.message}`);
        lastError = err;
      }
    }

    if (!response) {
      return NextResponse.json({ 
        error: `Could not reach outbound chat-service. Tried endpoints: ${urlsToTry.join(', ')}. Last error: ${lastError?.message}` 
      }, { status: 502 });
    }

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[Next.js API] chat-service at ${successUrl} returned error:`, data);
      return NextResponse.json({ error: data.error || 'Failed to dispatch message via chat-service' }, { status: response.status });
    }
    
    console.log(`[Next.js API] Successfully dispatched via ${successUrl}! Response:`, data);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(`[Next.js API] Exception in proxy:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
