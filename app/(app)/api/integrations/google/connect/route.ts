import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch tenant_id for the current user
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData?.tenant_id) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  // Construct the absolute callback URL dynamically
  const url = new URL(req.url);
  const redirectUri = `${url.protocol}//${url.host}/api/integrations/google/callback`;

  const options = {
    redirect_uri: redirectUri,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    access_type: 'offline', // Required to get Refresh Token
    prompt: 'consent', // Force consent prompt to guarantee refresh token delivery
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    state: JSON.stringify({ tenant_id: userData.tenant_id }),
  };

  const qs = new URLSearchParams(options);
  return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
