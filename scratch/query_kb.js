const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

let env = {};
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
} catch(e) {}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

// I don't have OPENAI_API_KEY, so I will fetch the vectors directly from the database and check their lengths and first few values to ensure they are valid.
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: kb } = await supabase.from('knowledge_base')
    .select('id, title, tenant_id, embedding')
    .eq('tenant_id', 'd42b0d39-391b-4bb2-bf8c-dd13b5edc2b4');
    
  console.log(`Found ${kb.length} KB rows for tenant.`);
  kb.forEach(k => {
    let parsed;
    try {
      parsed = typeof k.embedding === 'string' ? JSON.parse(k.embedding) : k.embedding;
    } catch(e) { parsed = null; }
    
    console.log(`- ${k.title}: Has embedding? ${!!k.embedding}, Is Array? ${Array.isArray(parsed)}, Length: ${parsed ? parsed.length : 'N/A'}`);
  });
}
check();
