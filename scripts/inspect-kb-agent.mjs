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

async function inspect() {
  const { data: kb } = await supabase.from('knowledge_base')
    .select('id, title, embedding')
    .eq('tenant_id', 'a7c6eb88-f161-494e-859a-b7352617db73');
  for (const k of kb || []) {
    console.log('KB:', k.id, k.title, 'hasEmbedding:', !!k.embedding);
  }
  process.exit(0);
}

inspect();
