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
const openAiKey = env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  console.log("Starting KB backfill...");
  
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, title, content')
    .filter('embedding', 'is', null)
    .eq('is_active', true);

  if (error) {
    console.error("DB Error:", error.message);
    return;
  }

  console.log(`Found ${data.length} rows to backfill.`);

  for (const row of data) {
    const textToEmbed = `[${row.title}]\n${row.content}`;
    console.log(`Embedding ID ${row.id}...`);
    
    try {
      const aiRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          input: textToEmbed,
          model: "text-embedding-3-small"
        })
      });

      const aiData = await aiRes.json();
      const embedding = aiData?.data?.[0]?.embedding;

      if (embedding) {
        await supabase
          .from('knowledge_base')
          .update({ embedding })
          .eq('id', row.id);
        console.log(`Successfully updated ID ${row.id}`);
      } else {
        console.log(`Failed to get embedding for ID ${row.id}:`, aiData);
      }
    } catch (e) {
      console.error(`Error processing ID ${row.id}:`, e.message);
    }
  }

  console.log("Done.");
}

backfill();
