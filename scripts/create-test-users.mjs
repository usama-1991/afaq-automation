// scripts/create-test-users.mjs
// Creates login credentials in Supabase Auth for all 6 Niche Staging Tenants

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { TEST_NICHES } from './seed-test-tenants.mjs';

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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEFAULT_PASSWORD = 'TestPassword123!';

async function createTestUsers() {
  console.log('🔑 Creating/Updating Auth Login Credentials for 6 Niche Staging Tenants...\n');

  const credentialsList = [];

  for (const t of TEST_NICHES) {
    const email = `${t.niche}@test.com`;

    // 1. Create or fetch Auth User
    let userId = null;

    const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers();
    const existingUser = usersList?.users?.find(u => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
      // Update password
      await supabase.auth.admin.updateUserById(userId, { password: DEFAULT_PASSWORD });
      console.log(`🔄 Updated password for existing user: ${email}`);
    } else {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: `${t.name} Admin` }
      });

      if (createErr) {
        console.error(`❌ Failed to create auth user for ${email}: ${createErr.message}`);
        continue;
      }
      userId = newUser.user.id;
      console.log(`✅ Created new auth user: ${email}`);
    }

    // 2. Link User Profile in public.users to the Tenant ID
    const { error: profileErr } = await supabase
      .from('users')
      .upsert({
        id: userId,
        tenant_id: t.id,
        full_name: `${t.name} Admin`,
        role: 'admin'
      });

    if (profileErr) {
      console.error(`❌ Failed to link profile for ${email}: ${profileErr.message}`);
    } else {
      credentialsList.push({
        Niche: t.niche.toUpperCase(),
        TenantName: t.name,
        Email: email,
        Password: DEFAULT_PASSWORD
      });
    }
  }

  console.log('\n================================================================');
  console.log('    LOGIN CREDENTIALS FOR ALL 6 BUSINESS NICHE DASHBOARDS       ');
  console.log('================================================================');
  console.table(credentialsList);
  console.log('\n💡 You can now log into http://localhost:3000/login using any of the above credentials to inspect conversations, orders, and knowledge base for that niche!\n');
}

createTestUsers().catch(err => {
  console.error('Fatal User Creation Error:', err);
  process.exit(1);
});
