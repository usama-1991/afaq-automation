import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  const url = new URL(req.url);
  const redirectUri = `${url.protocol}//${url.host}/api/integrations/calendly/callback`;

  const authUrl = `https://auth.calendly.com/oauth/authorize?${new URLSearchParams({
    client_id: process.env.CALENDLY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: JSON.stringify({ tenant_id: userData?.tenant_id }),
  }).toString()}`;

  return NextResponse.redirect(authUrl);
}
