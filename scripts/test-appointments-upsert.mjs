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
  // Test upsert directly on appointments table
  const testData = {
    tenant_id: '00000000-0000-0000-0000-111111111111',
    conversation_id: '0172b2bc-c4e6-4887-bc2a-84d3b1665f97',
    patient_name: 'Usama',
    patient_phone: '923242059198',
    niche: 'dental',
    treatment_type: 'Scaling & Polishing',
    appointment_date: '2026-08-20',
    appointment_time: '15:00:00',
    status: 'scheduled'
  };

  console.log("Testing upsert with onConflict conversation_id...");
  const res = await supabase.from('appointments').upsert(testData, { onConflict: 'conversation_id' });
  console.log("Result:", JSON.stringify(res, null, 2));

  // Check columns & constraints
  const { data: cols, error: colErr } = await supabase.rpc('get_table_columns', { table_name: 'appointments' });
  if (colErr) {
    console.log("Col err:", colErr);
  } else {
    console.log("Cols:", cols);
  }
}

run();
