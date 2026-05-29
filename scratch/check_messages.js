import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ldtqnpenpobmqqvdrbmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdHFucGVucG9ibXFxdmRyYm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5ODQ4MywiZXhwIjoyMDkzNTc0NDgzfQ.59EUL68HU0SXW-LPxL4xEdYav_3PUg-zOgophNNmq4g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_type, content, external_message_id, created_at')
    .eq('conversation_id', '831331c4-364b-4e02-9c23-b53a30dee6cb')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error("❌ Error fetching messages:", error);
    return;
  }
  
  data.forEach((msg, idx) => {
    console.log(`[${idx}] Sender: ${msg.sender_type} | Created: ${msg.created_at}`);
    console.log(`    Content: "${msg.content}"`);
    console.log(`    External Message ID: ${msg.external_message_id}`);
    console.log("-----------------------------------------");
  });
}

checkMessages();
