import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { subscribeCalendlyWebhook } from '@/lib/calendar/calendly';
import { encrypt } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const stateStr = req.nextUrl.searchParams.get('state');

  const redirectUri = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/integrations/calendly/callback`;

  if (!code || !stateStr) {
    return NextResponse.redirect(new URL('/settings?error=calendly_auth_failed', req.url));
  }

  const { tenant_id } = JSON.parse(stateStr);

  try {
    const tokenRes = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CALENDLY_CLIENT_ID!,
        client_secret: process.env.CALENDLY_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Calendly token exchange failed');

    // Get Calendly User Details
    const meRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const meData = await meRes.json();
    const userUri = meData.resource.uri;
    const organizationUri = meData.resource.current_organization;

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    const supabase = createServiceClient();
    const { data: integration, error } = await supabase
      .from('calendar_integrations')
      .upsert(
        {
          tenant_id,
          provider: 'calendly',
          access_token: encrypt(tokenData.access_token),
          refresh_token: encrypt(tokenData.refresh_token),
          token_expires_at: expiresAt,
          external_user_id: userUri,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,provider' }
      )
      .select()
      .single();

    if (error) throw error;

    // Register Calendly Webhook Subscription
    await subscribeCalendlyWebhook(integration.id, tokenData.access_token, userUri, organizationUri);

    return NextResponse.redirect(new URL('/settings?success=calendly_connected', req.url));
  } catch (err: any) {
    console.error('Calendly Auth Error:', err);
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
