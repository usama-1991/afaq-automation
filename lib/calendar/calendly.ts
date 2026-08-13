import { createServiceClient } from '@/lib/supabase/service';

export async function subscribeCalendlyWebhook(
  integrationId: string,
  accessToken: string,
  userUri: string,
  orgUri: string
) {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/calendly`;

  const res = await fetch('https://api.calendly.com/webhook_subscriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: webhookUrl,
      events: ['invitee.created', 'invitee.canceled'],
      organization: orgUri,
      user: userUri,
      scope: 'user',
    }),
  });

  const data = await res.json();
  if (res.ok) {
    const supabase = createServiceClient();
    await supabase
      .from('calendar_integrations')
      .update({ webhook_subscription_id: data.resource.uri })
      .eq('id', integrationId);
  } else {
    console.error('Failed to setup Calendly Webhook:', data);
  }
}
