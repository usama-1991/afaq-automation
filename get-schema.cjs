const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key] = val.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_schema_columns', { table_name: 'appointments' });
  if (error) {
    const { data: cols } = await supabase.from('appointments').select('*').limit(1);
    console.log(Object.keys(cols[0]));
  } else {
    console.log(data);
  }
}
check();
