import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getValidGoogleToken } from '@/lib/calendar/google';

export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id');
  const resourceState = req.headers.get('x-goog-resource-state');
  
  if (!channelId || resourceState === 'sync') {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();
  
  // Find the tenant associated with this webhook channel
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('id, tenant_id, primary_calendar_id')
    .eq('webhook_subscription_id', channelId)
    .single();

  if (!integration) {
    return NextResponse.json({ error: 'Unknown channel' }, { status: 404 });
  }

  try {
    const accessToken = await getValidGoogleToken(integration.id);
    
    // We fetch events updated in the last 15 minutes to catch what triggered this webhook
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${integration.primary_calendar_id}/events?updatedMin=${fifteenMinsAgo}&singleEvents=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    const eventsData = await eventsRes.json();
    
    if (eventsData.items) {
      for (const event of eventsData.items) {
        if (event.status === 'cancelled') {
          await supabase
            .from('appointments')
            .update({ status: 'canceled' })
            .eq('google_event_id', event.id);
          continue;
        }

        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        
        if (start && end) {
          // Upsert appointment
          await supabase
            .from('appointments')
            .upsert({
              tenant_id: integration.tenant_id,
              google_event_id: event.id,
              source: 'google',
              customer_name: event.summary || 'Busy',
              customer_email: event.creator?.email,
              start_time: new Date(start).toISOString(),
              end_time: new Date(end).toISOString(),
              status: 'scheduled',
              notes: event.description,
            }, { onConflict: 'google_event_id' });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
