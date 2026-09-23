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
  const tenantId = '00000000-0000-0000-0000-111111111111';
  const convId = '0172b2bc-c4e6-4887-bc2a-84d3b1665f97';
  
  const apptDate = '2026-08-20';
  const apptTime = '15:00:00';
  const treatment = 'Scaling & Polishing';
  const patientName = 'Usama';
  const patientPhone = '923242059198';

  const startDt = new Date(`${apptDate}T${apptTime}+05:00`);
  const endDt = new Date(startDt.getTime() + 60 * 60000);

  // 1. Get Google integration & refresh token
  const { data: gcalInt } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single();

  let googleEventId = null;

  if (gcalInt) {
    let gToken = gcalInt.access_token;
    const isExpired = new Date(gcalInt.token_expires_at).getTime() < Date.now() + 60000;
    if (isExpired && gcalInt.refresh_token) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: gcalInt.refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      if (tokenRes.ok) {
        const tData = await tokenRes.json();
        gToken = tData.access_token;
        await supabase.from('calendar_integrations').update({
          access_token: gToken,
          token_expires_at: new Date(Date.now() + tData.expires_in * 1000).toISOString()
        }).eq('id', gcalInt.id);
      }
    }

    const eventBody = {
      summary: `${treatment} - ${patientName}`,
      description: `Phone: ${patientPhone}\nConversation ID: ${convId}`,
      start: { 
        dateTime: `${apptDate}T${apptTime}`,
        timeZone: 'Asia/Karachi'
      },
      end: { 
        dateTime: `${apptDate}T16:00:00`,
        timeZone: 'Asia/Karachi'
      },
    };

    const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gcalInt.primary_calendar_id}/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody),
    });

    if (gRes.ok) {
      const gData = await gRes.json();
      googleEventId = gData.id;
      console.log("✅ Successfully created Google Calendar event:", googleEventId);
    } else {
      console.error("Google Calendar Error:", await gRes.text());
    }
  }

  // 2. Upsert appointment into Supabase
  const { data: upsertRes, error: upsertErr } = await supabase.from('appointments').upsert({
    tenant_id: tenantId,
    conversation_id: convId,
    patient_name: patientName,
    patient_phone: patientPhone,
    niche: 'dental',
    treatment_type: treatment,
    appointment_date: apptDate,
    appointment_time: apptTime,
    start_time: startDt.toISOString(),
    end_time: endDt.toISOString(),
    timezone: 'Asia/Karachi',
    status: 'scheduled',
    is_new_patient: false,
    google_event_id: googleEventId,
    created_at: new Date().toISOString()
  }, { onConflict: 'conversation_id' });

  if (upsertErr) {
    console.error("Supabase Error:", upsertErr);
  } else {
    console.log("✅ Supabase appointment updated successfully!");
  }
}

run();
