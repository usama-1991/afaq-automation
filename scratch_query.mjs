import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('Fetching users by email...');
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }
  
  const myUsers = users.users.filter(u => u.email === 'usamahabib191@gmail.com');
  console.log('Found users:', myUsers.map(u => ({ id: u.id, email: u.email })));

  if (myUsers.length === 0) return;

  for (const user of myUsers) {
    console.log(`\n--- Checking records for user: ${user.id} ---`);
    
    // Check tenants
    const { data: tenants } = await supabase.from('tenants').select('*').eq('owner_id', user.id);
    console.log(`Tenants owned by user:`, tenants?.length || 0);
    if (tenants) console.dir(tenants, { depth: null });
    
    // Check users table (custom users table)
    const { data: customUsers } = await supabase.from('users').select('*').eq('id', user.id);
    console.log(`Users table records:`, customUsers?.length || 0);
    if (customUsers) console.dir(customUsers, { depth: null });

    if (customUsers && customUsers.length > 0) {
      const tenantId = customUsers[0].tenant_id;
      console.log(`Tenant ID from users table: ${tenantId}`);
      
      const { data: tenantInfo } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
      console.log('Tenant Info:', tenantInfo);
      
      const { data: convos } = await supabase.from('conversations').select('id').eq('tenant_id', tenantId);
      console.log(`Conversations for tenant ${tenantId}:`, convos?.length || 0);
      
      const { data: kb } = await supabase.from('knowledge_base').select('id').eq('tenant_id', tenantId);
      console.log(`Knowledge Base docs for tenant ${tenantId}:`, kb?.length || 0);

      const { data: creds } = await supabase.from('integration_credentials').select('*').eq('tenant_id', tenantId);
      console.log(`Integration Credentials for tenant:`, creds?.length || 0);
      if (creds) console.dir(creds, { depth: null });
    }
  }
}

checkData();
