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

const REAL_PHONE_ID = '1081880905011541';
const REAL_WABA_ID  = '26907295168876999';

async function run() {
  // 1. Clear from all tenants
  await supabase
    .from('tenants')
    .update({ wa_phone_number_id: null, meta_connected: false })
    .eq('wa_phone_number_id', REAL_PHONE_ID);
    
  await supabase.from('integrations').delete().eq('external_account_id', REAL_PHONE_ID);

  // 2. Find Ittisalo Studio
  const { data: myTenant, error } = await supabase
    .from('tenants')
    .select('id, name')
    .ilike('name', '%Ittisalo Studio%')
    .single();

  if (error || !myTenant) {
    console.log("Could not find Ittisalo Studio", error);
    return;
  }

  // 3. Assign
  await supabase
    .from('tenants')
    .update({
      wa_phone_number_id: REAL_PHONE_ID,
      wa_account_id: REAL_WABA_ID,
      meta_connected: true
    })
    .eq('id', myTenant.id);

  await supabase
    .from('integrations')
    .insert({
      tenant_id: myTenant.id,
      platform: 'whatsapp',
      external_account_id: REAL_PHONE_ID,
      credentials: { phone_number_id: REAL_PHONE_ID, waba_id: REAL_WABA_ID }
    });

  console.log(`Assigned successfully to ${myTenant.name} (${myTenant.id})`);
}

run();
