import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valParts] = trimmed.split('=');
          const val = valParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const REAL_PHONE_ID = '1081880905011541';

async function run() {
  console.log("Unbinding from all tenants...");
  const { error } = await supabase
    .from('tenants')
    .update({ wa_phone_number_id: null, meta_connected: false })
    .eq('wa_phone_number_id', REAL_PHONE_ID);
    
  if (error) console.error(error);
  else console.log("Unbound from tenants successfully.");

  const { error: error2 } = await supabase.from('integrations').delete().eq('external_account_id', REAL_PHONE_ID);
  
  if (error2) console.error(error2);
  else console.log("Removed from integrations table successfully.");
}

run();
