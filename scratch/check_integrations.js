import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ldtqnpenpobmqqvdrbmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdHFucGVucG9ibXFxdmRyYm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5ODQ4MywiZXhwIjoyMDkzNTc0NDgzfQ.59EUL68HU0SXW-LPxL4xEdYav_3PUg-zOgophNNmq4g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIntegrations() {
  console.log("Fetching integrations table...");
  const { data, error } = await supabase.from('integrations').select('*');
  if (error) {
    console.error("❌ Error fetching integrations:", error);
    return;
  }
  console.log("✅ Integrations in database:", JSON.stringify(data, null, 2));
}

checkIntegrations();
