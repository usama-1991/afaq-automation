// scripts/unbind-and-assign-wa.mjs
// Unbinds phone number ID from all other tenants and sets it on Gourmet Bites Bistro

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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const REAL_PHONE_ID = '1081880905011541';
const REAL_WABA_ID  = '26907295168876999';

async function unbindAndAssign() {
  console.log(`⚡ Unbinding WhatsApp Phone ID ${REAL_PHONE_ID} from all old tenants...\n`);

  // 1. Clear from all other tenants
  const { data: clearedTenants, error: clearErr } = await supabase
    .from('tenants')
    .update({ wa_phone_number_id: null, meta_connected: false })
    .eq('wa_phone_number_id', REAL_PHONE_ID);

  if (clearErr) {
    console.warn('Warning clearing old tenant wa_phone_number_id:', clearErr.message);
  } else {
    console.log('✅ Cleared old tenant wa_phone_number_id bindings.');
  }

  // 2. Clear from integrations table for other tenants
  await supabase
    .from('integrations')
    .delete()
    .eq('external_account_id', REAL_PHONE_ID);

  // 3. Find Gourmet Bites Bistro (restaurant@test.com)
  const { data: restaurantTenant, error: fetchErr } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('niche', 'restaurant')
    .single();

  if (fetchErr || !restaurantTenant) {
    console.error('❌ Could not find Gourmet Bites Bistro tenant:', fetchErr?.message);
    process.exit(1);
  }

  // 4. Assign exclusively to Gourmet Bites Bistro
  const { error: assignErr } = await supabase
    .from('tenants')
    .update({
      wa_phone_number_id: REAL_PHONE_ID,
      wa_account_id: REAL_WABA_ID,
      meta_connected: true
    })
    .eq('id', restaurantTenant.id);

  if (assignErr) {
    console.error('❌ Assignment error:', assignErr.message);
    process.exit(1);
  }

  // 5. Create Integration row
  await supabase
    .from('integrations')
    .insert({
      tenant_id: restaurantTenant.id,
      platform: 'whatsapp',
      external_account_id: REAL_PHONE_ID,
      credentials: { phone_number_id: REAL_PHONE_ID, waba_id: REAL_WABA_ID }
    });

  console.log(`\n🎉 SUCCESS! Connected Meta Phone Number ID ${REAL_PHONE_ID} exclusively to Gourmet Bites Bistro (${restaurantTenant.id})!`);
}

unbindAndAssign().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
