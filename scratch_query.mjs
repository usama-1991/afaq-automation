import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('tenants').select('niche, business_name, agent_config').limit(1);
  console.log("Tenant Config:", JSON.stringify(data, null, 2));
}
run();
