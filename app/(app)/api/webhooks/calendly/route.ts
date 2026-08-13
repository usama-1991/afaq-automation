import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import crypto from 'crypto';

function verifyCalendlySignature(req: NextRequest, bodyText: string): boolean {
  const signature = req.headers.get('calendly-webhook-signature');
  if (!signature) return false;

  const { t, v1 } = signature.split(',').reduce(
    (acc, pair) => {
      const [key, value] = pair.split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const secret = process.env.CALENDLY_WEBHOOK_SIGNING_KEY!;
  const data = t + '.' + bodyText;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  // Verify the signature and check for replay attacks (tolerance: 3 minutes)
  const threeMinutes = 180000;
  const isTimeValid = Date.now() - parseInt(t, 10) < threeMinutes;

  return expectedSignature === v1 && isTimeValid;
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  
  if (!verifyCalendlySignature(req, bodyText)) {
    return NextResponse.json({ error: 'Invalid Signature' }, { status: 403 });
  }

  const payload = JSON.parse(bodyText);
  const event = payload.event; // 'invitee.created' or 'invitee.canceled'
  const invitee = payload.payload;

  const supabase = createServiceClient();

  // Find the tenant associated with this Calendly webhook
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('tenant_id')
    .eq('external_user_id', invitee.event_creator)
    .maybeSingle();

  if (!integration) {
    return NextResponse.json({ error: 'Tenant not mapped' }, { status: 404 });
  }

  try {
    if (event === 'invitee.created') {
      await supabase
        .from('appointments')
        .upsert({
          tenant_id: integration.tenant_id,
          calendly_invitee_uri: invitee.uri,
          source: 'calendly',
          patient_name: invitee.name,
          patient_email: invitee.email,
          start_time: new Date(invitee.scheduled_event.start_time).toISOString(),
          end_time: new Date(invitee.scheduled_event.end_time).toISOString(),
          status: 'scheduled',
          timezone: invitee.timezone,
        }, { onConflict: 'calendly_invitee_uri' });
    } else if (event === 'invitee.canceled') {
      await supabase
        .from('appointments')
        .update({ status: 'canceled' })
        .eq('calendly_invitee_uri', invitee.uri);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendly Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
