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

async function check() {
  const { data: convs } = await supabase.from('conversations')
    .select('id, platform, customer_name, status, last_message_preview, created_at')
    .eq('tenant_id', 'a7c6eb88-f161-494e-859a-b7352617db73')
    .order('created_at', { ascending: false });
  console.log('CONVERSATIONS:', JSON.stringify(convs, null, 2));

  if (convs && convs.length > 0) {
    const latestConv = convs[0];
    const { data: msgs } = await supabase.from('messages')
      .select('id, sender_type, content, created_at')
      .eq('conversation_id', latestConv.id)
      .order('created_at', { ascending: true });
    console.log('MESSAGES FOR LATEST CONV:', JSON.stringify(msgs, null, 2));
  }

  process.exit(0);
}

check();
