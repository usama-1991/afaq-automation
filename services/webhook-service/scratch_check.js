import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:\\my_automation\\afaq-automation\\.env' });
dotenv.config({ path: 'd:\\my_automation\\afaq-automation\\services\\webhook-service\\.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, tenant_id')
    .eq('customer_phone', '15551488113')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!convs || convs.length === 0) {
    console.log('No conversation found for 15551488113');
    return;
  }

  const convId = convs[0].id;
  console.log(`Found conversation: ${convId}`);

  const { data: msgs, error } = await supabase
    .from('messages')
    .select('created_at, sender_type, content, external_message_id')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Last 10 messages:');
  for (let m of msgs.reverse()) {
    console.log(`[${m.created_at}] ${m.sender_type.toUpperCase()} (ID: ${m.external_message_id}): ${m.content.substring(0, 80).replace(/\n/g, ' ')}...`);
  }
}

check();
