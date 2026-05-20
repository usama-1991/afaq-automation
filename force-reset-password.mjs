/**
 * Force-reset a user's password using the Supabase Admin API.
 * No email required — uses service role key directly.
 * 
 * Usage:
 *   $env:SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node force-reset-password.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = 'usamahabib191@gmail.com';
const NEW_PASSWORD = 'Usama123!'; // Change this to whatever you want

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function resetPassword() {
  console.log(`🔍 Looking up user: ${TARGET_EMAIL}`);

  // List ALL users and filter client-side
  // (Supabase Admin API ignores the ?email= param — it returns paginated results)
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    }
  });

  const listData = await listRes.json();
  const users = listData?.users || [];
  
  console.log(`📋 Total users found: ${users.length}`);
  users.forEach(u => console.log(`   - ${u.email} (${u.id})`));

  const user = users.find(u => u.email === TARGET_EMAIL);

  if (!user) {
    console.error(`❌ User "${TARGET_EMAIL}" not found in the list above.`);
    process.exit(1);
  }

  console.log(`\n✅ Matched user: ${user.email} (ID: ${user.id})`);
  console.log(`📝 Setting new password...`);

  // Update the password directly
  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: NEW_PASSWORD })
  });

  const updateData = await updateRes.json();

  if (updateData.email) {
    console.log(`\n✅ Password successfully updated for: ${updateData.email}`);
    console.log(`\n🔑 New credentials:`);
    console.log(`   Email:    ${TARGET_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log(`\n🌐 Login at: https://afaq-automation-production.up.railway.app/login`);
  } else {
    console.error('❌ Update failed:', JSON.stringify(updateData));
  }
}

resetPassword().catch(console.error);
