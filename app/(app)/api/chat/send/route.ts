import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { message_id } = await request.json();
    if (!message_id) {
      return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });
    }

    // 3. Verify message ownership: Ensure message belongs to the caller's tenant
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id, conversations!inner(tenant_id)')
      .eq('id', message_id)
      .eq('conversations.tenant_id', callerProfile.tenant_id)
      .maybeSingle();

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    const urlsToTry: string[] = [];
    if (process.env.CHAT_SERVICE_URL) {
      let serviceUrl = process.env.CHAT_SERVICE_URL.trim();
      if (serviceUrl) {
        // Automatically prepend https:// if protocol is missing
        if (!serviceUrl.startsWith('http://') && !serviceUrl.startsWith('https://')) {
          serviceUrl = `https://${serviceUrl}`;
        }
        // Automatically append /send if missing
        if (!serviceUrl.endsWith('/send')) {
          serviceUrl = serviceUrl.endsWith('/') ? `${serviceUrl}send` : `${serviceUrl}/send`;
        }
        urlsToTry.push(serviceUrl);
      }
    }
    // Railway official private DNS formats
    urlsToTry.push('http://chat-service.private.railway.internal:8080/send');
    urlsToTry.push('http://chat-service.private.railway.internal:3004/send');
    urlsToTry.push('http://chat-service:8080/send');
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
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': process.env.INTERNAL_SERVICE_KEY || '',
          },
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
