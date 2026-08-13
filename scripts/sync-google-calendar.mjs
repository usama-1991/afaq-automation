import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valParts] = trimmed.split('=');
          const val = valParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('tenant_id', '00000000-0000-0000-0000-111111111111')
    .single();

  if (!integration) return console.log("No integration found");

  // Refresh token if needed
  let accessToken = integration.access_token;
  const isExpired = new Date(integration.token_expires_at).getTime() < Date.now();
  if (isExpired) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    accessToken = data.access_token;
    await supabase.from('calendar_integrations').update({ access_token: accessToken, token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString() }).eq('id', integration.id);
  }

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${integration.primary_calendar_id}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  
  const eventsData = await eventsRes.json();
  
  if (eventsData.items) {
    for (const event of eventsData.items) {
      if (event.status === 'cancelled') continue;
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      
      if (start && end) {
        await supabase
          .from('appointments')
          .upsert({
            tenant_id: integration.tenant_id,
            google_event_id: event.id,
            source: 'google',
            patient_name: event.summary || 'Busy',
            start_time: new Date(start).toISOString(),
            end_time: new Date(end).toISOString(),
            status: 'scheduled',
            notes: event.description,
          }, { onConflict: 'google_event_id' });
        console.log(`Synced event: ${event.summary} at ${start}`);
      }
    }
    console.log(`Synced ${eventsData.items.length} events!`);
  }
}

run();
