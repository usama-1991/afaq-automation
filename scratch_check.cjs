const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ldtqnpenpobmqqvdrbmq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdHFucGVucG9ibXFxdmRyYm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5ODQ4MywiZXhwIjoyMDkzNTc0NDgzfQ.59EUL68HU0SXW-LPxL4xEdYav_3PUg-zOgophNNmq4g'
);

async function check() {
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, tenant_id, customer_phone')
    .order('updated_at', { ascending: false })
    .limit(3);

  for (let conv of convs) {
    console.log(`\nFound conversation: ${conv.id} for phone ${conv.customer_phone}`);
    const { data: msgs } = await supabase
      .from('messages')
      .select('created_at, sender_type, content, external_message_id')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(8);

    for (let m of msgs.reverse()) {
      console.log(`[${m.created_at}] ${m.sender_type.toUpperCase()}: ${m.content.substring(0, 80).replace(/\n/g, ' ')}...`);
    }
  }
}

check();
