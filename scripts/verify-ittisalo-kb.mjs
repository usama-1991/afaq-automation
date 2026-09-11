import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of env.split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
const TENANT_ID = 'a7c6eb88-f161-494e-859a-b7352617db73';

async function verify() {
  const { data: tenant } = await supabase.from('tenants')
    .select('id, business_name, ai_language, niche')
    .eq('id', TENANT_ID)
    .single();
  console.log('TENANT CONFIG:', tenant);

  const { data: agent } = await supabase.from('agents')
    .select('id, name, is_active, prompt')
    .eq('tenant_id', TENANT_ID)
    .single();
  console.log('AGENT CONFIG:', { id: agent.id, name: agent.name, is_active: agent.is_active });
  console.log('AGENT PROMPT HEAD:', agent.prompt.slice(0, 200));

  const { data: kb } = await supabase.from('knowledge_base')
    .select('id, title, is_active')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false });
  console.log('ACTIVE KB ITEMS:');
  kb.forEach((k, idx) => console.log(`${idx + 1}. [${k.is_active ? 'ACTIVE' : 'INACTIVE'}] ${k.title}`));

  process.exit(0);
}

verify();
