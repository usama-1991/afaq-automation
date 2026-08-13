import { createServiceClient } from '@/lib/supabase/service';

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Gets a valid Google Access Token, refreshing it if expired.
 */
export async function getValidGoogleToken(integrationId: string): Promise<string> {
  const supabase = createServiceClient();
  const { data: integration, error } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('id', integrationId)
    .single();

  if (error || !integration) throw new Error('Integration not found');

  const isExpired = new Date(integration.token_expires_at).getTime() < Date.now() + 60000; // 1 min buffer

  if (!isExpired) return integration.access_token;

  if (!integration.refresh_token) {
    throw new Error('Refresh token missing. User must re-authenticate.');
  }

  // Refresh Token Request
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${data.error}`);

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await supabase
    .from('calendar_integrations')
    .update({
      access_token: data.access_token,
      token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);

  return data.access_token;
}

/**
 * Setup Push Notification Watch Channel
 */
export async function setupGoogleCalendarWatch(
  integrationId: string,
  tenantId: string,
  accessToken: string
) {
  const channelId = `ch-${tenantId}-${Date.now()}`;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/google-calendar`;

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events/watch',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        // Channels expire in max 7 days (604800000 ms)
      }),
    }
  );

  const data = await res.json();
  if (res.ok) {
    const supabase = createServiceClient();
    await supabase
      .from('calendar_integrations')
      .update({
        webhook_subscription_id: data.id,
        webhook_resource_id: data.resourceId,
        webhook_expires_at: new Date(Number(data.expiration)).toISOString(),
      })
      .eq('id', integrationId);
  } else {
    console.error('Failed to setup Google Watch:', data);
  }
}
