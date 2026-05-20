import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      envVars[key] = value;
    }
  }
});

const supabaseUrl = envVars.SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

async function checkSchema() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log("Fetching PostgREST schema from:", url);
  
  const response = await fetch(url, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  
  if (!response.ok) {
    console.error("Error fetching schema:", response.statusText);
    return;
  }
  
  const schema = await response.json();
  console.log("Tables available:");
  Object.keys(schema.definitions).forEach(table => {
    console.log(`- ${table}`);
    console.log("  Columns:", Object.keys(schema.definitions[table].properties));
  });
}

checkSchema();
