/**
 * Fixed Name Script — uses Page Conversations API for Messenger
 * Run: node fix-names.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MESSENGER_TOKEN = process.env.MESSENGER_ACCESS_TOKEN;
const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.MESSENGER_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// For Messenger: use the Page Conversations API to find participant name
async function fetchMessengerName(psid, pageId) {
  if (!MESSENGER_TOKEN || !pageId) return null;

  // Try conversations API — finds the thread and returns participant names
  const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?user_id=${psid}&fields=participants&access_token=${MESSENGER_TOKEN}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`  📡 Conversations API response: ${JSON.stringify(data)}`);

    const participants = data?.data?.[0]?.participants?.data || [];
    // Find the participant that is NOT the page itself
    const user = participants.find(p => p.id !== pageId);
    if (user?.name) return user.name;
  } catch (e) {
    console.error(`  ❌ Conversations API failed: ${e.message}`);
  }
  return null;
}

// For Instagram: use the username/name fields directly
async function fetchInstagramName(igsid) {
  if (!INSTAGRAM_TOKEN) return null;
  const url = `https://graph.facebook.com/v19.0/${igsid}?fields=name,username&access_token=${INSTAGRAM_TOKEN}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`  📡 Graph API response: ${JSON.stringify(data)}`);
    if (data.name) return data.name;
    if (data.username) return `@${data.username}`;
  } catch (e) {
    console.error(`  ❌ Instagram name fetch failed: ${e.message}`);
  }
  return null;
}

async function main() {
  console.log('🔍 Fetching conversations with generic names...\n');

  // We need the page IDs from integrations to use in the Conversations API
  const { data: integrations } = await supabase
    .from('integrations')
    .select('platform, external_account_id')
    .in('platform', ['messenger', 'instagram']);

  const pageIds = {};
  for (const i of integrations || []) {
    pageIds[i.platform] = i.external_account_id;
  }
  console.log('Page IDs from integrations table:', pageIds);

  const { data: convos, error } = await supabase
    .from('conversations')
    .select('id, platform, external_conversation_id, customer_name')
    .in('platform', ['messenger', 'instagram'])
    .in('customer_name', ['Messenger User', 'Instagram User']);

  if (error) {
    console.error('❌ Supabase error:', error.message);
    process.exit(1);
  }

  if (!convos || convos.length === 0) {
    console.log('✅ No conversations with generic names found!');
    return;
  }

  console.log(`\nFound ${convos.length} conversation(s) to fix:\n`);

  for (const conv of convos) {
    console.log(`→ [${conv.platform}] PSID/IGSID: ${conv.external_conversation_id} | Current: "${conv.customer_name}"`);
    
    let realName = null;
    if (conv.platform === 'messenger') {
      realName = await fetchMessengerName(conv.external_conversation_id, pageIds['messenger']);
    } else if (conv.platform === 'instagram') {
      realName = await fetchInstagramName(conv.external_conversation_id);
    }

    if (realName) {
      console.log(`  ✅ Real name: "${realName}" — updating DB...`);
      const { error: updateErr } = await supabase
        .from('conversations')
        .update({ customer_name: realName })
        .eq('id', conv.id);
      if (updateErr) console.error(`  ❌ Update failed: ${updateErr.message}`);
      else console.log(`  💾 Updated successfully!\n`);
    } else {
      console.log(`  ⚠️  Could not retrieve real name — skipping.\n`);
    }
  }

  console.log('Done.');
}

main();
