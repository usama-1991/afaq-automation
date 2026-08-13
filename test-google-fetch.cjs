const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key] = val.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('provider', 'google')
    .single();
    
  if (!integration) return console.log('No integration found');

  const accessToken = integration.access_token;
  const fifteenMinsAgo = new Date(Date.now() - 360 * 60 * 1000).toISOString(); // last 6 hours
  
  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${integration.primary_calendar_id}/events?updatedMin=${encodeURIComponent(fifteenMinsAgo)}&singleEvents=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  const eventsData = await eventsRes.json();
  if (eventsData.items) {
    console.log('Found events:', eventsData.items.map(e => e.summary));
    const event = eventsData.items[0];
    const { error } = await supabase.from('appointments').upsert({
        tenant_id: integration.tenant_id,
        google_event_id: event.id,
        source: 'google',
        patient_name: event.summary,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
    }, { onConflict: 'google_event_id' });
    console.log('Upsert Error:', error);
  } else {
    console.log('Error/No Items:', eventsData);
  }
}

testFetch();
