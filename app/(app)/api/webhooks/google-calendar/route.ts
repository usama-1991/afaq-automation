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
      `https://www.googleapis.com/calendar/v3/calendars/${integration.primary_calendar_id}/events?updatedMin=${encodeURIComponent(fifteenMinsAgo)}&singleEvents=true`,
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
          const startDate = new Date(start);
          const endDate = new Date(end);
          const timeZone = event.start?.timeZone || 'Asia/Karachi';

          // Extract date and time in calendar timezone
          let apptDate = null;
          let apptTime = null;
          try {
            apptDate = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(startDate);
            apptTime = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(startDate);
          } catch (_) {
            apptDate = startDate.toISOString().split('T')[0];
            apptTime = startDate.toISOString().split('T')[1].slice(0, 8);
          }

          // Extract doctor name if in summary e.g. "Root Canal - Usama (Dr. Fatima Zahra)"
          let doctorName = null;
          let treatmentType = null;
          const summary = event.summary || '';
          const docMatch = summary.match(/\((Dr\.[^)]+)\)/i);
          if (docMatch) doctorName = docMatch[1];

          // Parse treatment type if summary is "Treatment - Patient"
          if (summary.includes(' - ')) {
            treatmentType = summary.split(' - ')[0].trim();
          }

          // Upsert appointment
          await supabase
            .from('appointments')
            .upsert({
              tenant_id: integration.tenant_id,
              google_event_id: event.id,
              source: 'google',
              patient_name: summary || 'Google Calendar Event',
              doctor_name: doctorName,
              treatment_type: treatmentType || 'General Consultation',
              appointment_date: apptDate,
              appointment_time: apptTime,
              timezone: timeZone,
              start_time: startDate.toISOString(),
              end_time: endDate.toISOString(),
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
