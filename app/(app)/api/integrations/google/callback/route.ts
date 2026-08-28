import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { setupGoogleCalendarWatch } from '@/lib/calendar/google';
import { encrypt } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');

  const redirectUri = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/integrations/google/callback`;

  if (!code || !stateStr) {
    return NextResponse.redirect(new URL('/settings?error=invalid_oauth', req.url));
  }

  const { tenant_id } = JSON.parse(stateStr);

  try {
    // Exchange Auth Code for Tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Failed token exchange');

    // Fetch User Email
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userRes.json();

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    const supabase = createServiceClient();
    const { data: integration, error } = await supabase
      .from('calendar_integrations')
      .upsert(
        {
          tenant_id,
          provider: 'google',
          access_token: encrypt(tokenData.access_token),
          refresh_token: encrypt(tokenData.refresh_token),
          token_expires_at: expiresAt,
          external_user_id: userInfo.email,
          primary_calendar_id: 'primary',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,provider' }
      )
      .select()
      .single();

    if (error) throw error;

    // Set up Google Watch Webhook Channel
    await setupGoogleCalendarWatch(integration.id, tenant_id, tokenData.access_token);

    return NextResponse.redirect(new URL('/settings?success=google_connected', req.url));
  } catch (err: any) {
    console.error('Google Callback Error:', err);
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
