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
  console.log("=== LATEST APPOINTMENTS ===");
  const { data: appts, error: apptErr } = await supabase
    .from('appointments')
    .select('*')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(10);
  console.log(JSON.stringify(appts, null, 2));

  console.log("=== APPOINTMENTS ORDERED BY CREATED_AT ===");
  const { data: apptsCreated } = await supabase
    .from('appointments')
    .select('id, patient_name, appointment_date, appointment_time, status, created_at, conversation_id, google_event_id')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(JSON.stringify(apptsCreated, null, 2));

  console.log("=== LATEST CONVERSATIONS ===");
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, customer_name, customer_phone, last_message_at, unread_count')
    .order('last_message_at', { ascending: false })
    .limit(5);
  console.log(JSON.stringify(convs, null, 2));

  console.log("=== LATEST CONVERSATION CONTEXT ===");
  const { data: contexts } = await supabase
    .from('conversation_context')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5);
  console.log(JSON.stringify(contexts, null, 2));

  console.log("=== CALENDAR INTEGRATION ===");
  const { data: calInts } = await supabase
    .from('calendar_integrations')
    .select('*');
  console.log(JSON.stringify(calInts, null, 2));
}

run();
