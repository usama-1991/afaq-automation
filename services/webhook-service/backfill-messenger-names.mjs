/**
 * backfill-messenger-names.mjs
 * Run AFTER switching your Meta App to Live mode:
 *   node --env-file=../../.env.local backfill-messenger-names.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const token = process.env.MESSENGER_ACCESS_TOKEN;
if (!token) { console.error('MESSENGER_ACCESS_TOKEN not set'); process.exit(1); }

// Get all Messenger conversations that still have the placeholder name
const { data: convs, error } = await supabase
  .from('conversations')
  .select('id, external_conversation_id, customer_name')
  .eq('platform', 'messenger')
  .eq('customer_name', 'Messenger User'); // only update placeholders

if (error) { console.error('Supabase error:', error.message); process.exit(1); }
console.log(`Found ${convs.length} conversations to backfill...`);

let updated = 0;
for (const c of convs) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${c.external_conversation_id}?fields=name&access_token=${token}`
    );
    const data = await res.json();

    if (data.name) {
      const { error: uErr } = await supabase
        .from('conversations')
        .update({ customer_name: data.name })
        .eq('id', c.id);
      if (uErr) {
        console.error(`  ✗ ${c.external_conversation_id}: ${uErr.message}`);
      } else {
        console.log(`  ✓ ${c.external_conversation_id} → "${data.name}"`);
        updated++;
      }
    } else {
      console.warn(`  ? ${c.external_conversation_id}: No name returned —`, JSON.stringify(data));
    }
  } catch (e) {
    console.error(`  ✗ ${c.external_conversation_id}: ${e.message}`);
  }
}

console.log(`\nDone. Updated ${updated}/${convs.length} conversations.`);
