const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ldtqnpenpobmqqvdrbmq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdHFucGVucG9ibXFxdmRyYm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5ODQ4MywiZXhwIjoyMDkzNTc0NDgzfQ.59EUL68HU0SXW-LPxL4xEdYav_3PUg-zOgophNNmq4g'
);

async function check() {
  const { data: msgs, error } = await supabase
    .from('messages')
    .select('created_at, sender_type, content, external_message_id, conversation_id')
    .eq('sender_type', 'bot')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Last Bot Message Content:');
  console.log(JSON.stringify(msgs[0].content));
}

check();
