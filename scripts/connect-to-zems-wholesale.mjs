// scripts/connect-to-zems-wholesale.mjs
// Unbinds phone number ID from demo restaurant and connects it exclusively to ZEMS Wholesale (usamahabib191)

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

async function connectToZemsWholesale() {
  console.log(`⚡ Unbinding Meta Phone ID ${REAL_PHONE_ID} from Gourmet Bites Bistro & all other tenants...\n`);

  // 1. Clear from all tenants
  const { error: clearErr } = await supabase
    .from('tenants')
    .update({ wa_phone_number_id: null, meta_connected: false })
    .eq('wa_phone_number_id', REAL_PHONE_ID);

  if (clearErr) {
    console.warn('Warning clearing wa_phone_number_id:', clearErr.message);
  } else {
    console.log('✅ Cleared phone number ID from previous tenants.');
  }

  // 2. Clear from integrations table
  await supabase
    .from('integrations')
    .delete()
    .eq('external_account_id', REAL_PHONE_ID);

  // 3. Find ZEMS Wholesale tenant
  const { data: zemsTenants, error: fetchErr } = await supabase
    .from('tenants')
    .select('id, name, business_name, niche')
    .or('name.ilike.%zems%,business_name.ilike.%zems%,name.ilike.%usamahabib191%,business_name.ilike.%usamahabib191%');

  if (fetchErr || !zemsTenants || zemsTenants.length === 0) {
    console.error('❌ Could not find ZEMS Wholesale tenant:', fetchErr?.message);

    // Fallback: search by user email usamahabib191@gmail.com
    const { data: userProfile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('email', 'usamahabib191@gmail.com')
      .maybeSingle();

    if (userProfile?.tenant_id) {
      zemsTenants = [{ id: userProfile.tenant_id, name: 'ZEMS Wholesale' }];
    } else {
      process.exit(1);
    }
  }

  const targetTenant = zemsTenants[0];
  console.log(`📌 Found Target eCommerce Store: [${targetTenant.name || targetTenant.business_name}] (ID: ${targetTenant.id})`);

  // 4. Update Tenants table
  const { error: assignErr } = await supabase
    .from('tenants')
    .update({
      wa_phone_number_id: REAL_PHONE_ID,
      wa_account_id: REAL_WABA_ID,
      meta_connected: true,
      plan: 'enterprise',
      plan_status: 'active'
    })
    .eq('id', targetTenant.id);

  if (assignErr) {
    console.error('❌ Tenant assignment failed:', assignErr.message);
    process.exit(1);
  }

  // 5. Update Integrations table
  await supabase.from('integrations').delete().eq('tenant_id', targetTenant.id).eq('platform', 'whatsapp');
  const { error: intErr } = await supabase
    .from('integrations')
    .insert({
      tenant_id: targetTenant.id,
      platform: 'whatsapp',
      external_account_id: REAL_PHONE_ID,
      credentials: { phone_number_id: REAL_PHONE_ID, waba_id: REAL_WABA_ID }
    });

  if (intErr) {
    console.error('❌ Integration insert failed:', intErr.message);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log(`🎉 SUCCESS! Connected Meta Phone Number ID ${REAL_PHONE_ID} exclusively to ZEMS Wholesale!`);
  console.log('================================================================');
  console.log(`Tenant ID:    ${targetTenant.id}`);
  console.log(`Tenant Name:  ${targetTenant.name || targetTenant.business_name}`);
  console.log(`Plan Status:  ENTERPRISE (Active)\n`);
}

connectToZemsWholesale().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
