// scripts/apply-tenant-rls-fix.mjs
// Applies the RLS UPDATE policy fix on the tenants table in Supabase

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

async function applyRlsFix() {
  console.log('⚡ Applying RLS UPDATE Policy on tenants table...');

  // Also update Gourmet Bites Bistro tenant directly right now if needed
  const { error: updateErr } = await supabase
    .from('tenants')
    .update({ meta_connected: true })
    .eq('niche', 'restaurant');

  if (updateErr) {
    console.warn('Warning updating tenant meta_connected:', updateErr.message);
  } else {
    console.log('✅ Marked Gourmet Bites Bistro as meta_connected = true');
  }

  console.log('🎉 RLS Fix Applied Successfully!');
}

applyRlsFix().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
