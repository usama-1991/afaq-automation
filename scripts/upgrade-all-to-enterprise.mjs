// scripts/upgrade-all-to-enterprise.mjs
// Upgrades all test tenants in Supabase to the Enterprise plan

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

async function upgradeAllTenants() {
  console.log('⚡ Upgrading all staging tenants to Enterprise plan...\n');

  const { data: tenants, error: fetchErr } = await supabase.from('tenants').select('id, name, niche, plan');

  if (fetchErr) {
    console.error('❌ Failed to fetch tenants:', fetchErr.message);
    process.exit(1);
  }

  for (const tenant of tenants) {
    const { error: updateErr } = await supabase
      .from('tenants')
      .update({
        plan: 'enterprise',
        plan_status: 'active'
      })
      .eq('id', tenant.id);

    if (updateErr) {
      console.error(`❌ Failed to upgrade tenant ${tenant.name}: ${updateErr.message}`);
    } else {
      console.log(`✅ Upgraded [${tenant.niche || 'general'}]: ${tenant.name} -> ENTERPRISE (Active)`);
    }
  }

  console.log('\n🎉 All tenants are now on the Enterprise Plan with full features unlocked!\n');
}

upgradeAllTenants().catch(err => {
  console.error('Fatal Upgrade Error:', err);
  process.exit(1);
});
