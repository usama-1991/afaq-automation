/**
 * Backfill real names for ALL conversations currently showing generic names.
 * Handles Messenger (Page Conversations API) and Instagram (Graph API).
 * 
 * Usage:
 *   $env:SUPABASE_URL="https://xxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   $env:MESSENGER_ACCESS_TOKEN="EAAx..."
 *   $env:INSTAGRAM_ACCESS_TOKEN="EAAx..."   (optional, falls back to messenger token)
 *   node backfill-names.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MESSENGER_TOKEN = process.env.MESSENGER_ACCESS_TOKEN;
const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || MESSENGER_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Messenger: use Page Conversations API to get participant name ──────────
async function fetchMessengerName(psid, pageId) {
  if (!MESSENGER_TOKEN) return null;

  // Strategy 1: Page Conversations API
  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?user_id=${psid}&fields=participants&access_token=${MESSENGER_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    const participants = data?.data?.[0]?.participants?.data || [];
    const user = participants.find(p => p.id !== pageId);
    if (user?.name && user.name !== 'Facebook User') {
      console.log(`  ✅ [Conversations API] Found: "${user.name}"`);
      return user.name;
    }
    console.log(`  ⚠️  Conversations API participants: ${JSON.stringify(participants)}`);
  } catch (e) {
    console.log(`  ❌ Conversations API error: ${e.message}`);
  }

  // Strategy 2: Direct profile lookup (may work for some accounts)
  try {
    const url = `https://graph.facebook.com/v19.0/${psid}?fields=name,first_name,last_name&access_token=${MESSENGER_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(`  📡 Profile API response: ${JSON.stringify(data)}`);
    if (data.name) return data.name;
    if (data.first_name) return `${data.first_name} ${data.last_name || ''}`.trim();
  } catch (e) {
    console.log(`  ❌ Profile API error: ${e.message}`);
  }

  return null;
}

// ── Instagram: try name and username fields ───────────────────────────────
async function fetchInstagramName(igsid) {
  if (!INSTAGRAM_TOKEN) return null;

  try {
    const url = `https://graph.facebook.com/v19.0/${igsid}?fields=name,username&access_token=${INSTAGRAM_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(`  📡 Instagram API response: ${JSON.stringify(data)}`);
    if (data.name) return data.name;
    if (data.username) return `@${data.username}`;
  } catch (e) {
    console.log(`  ❌ Instagram API error: ${e.message}`);
  }

  return null;
}

async function main() {
  console.log('🔍 Fetching all conversations with generic names...\n');

  // Get page IDs from integrations table
  const { data: integrations } = await supabase
    .from('integrations')
    .select('platform, external_account_id, tenant_id');

  const pageIds = {};
  for (const i of integrations || []) {
    pageIds[i.platform] = i.external_account_id;
  }
  console.log('📋 Page IDs from integrations:', pageIds);

  // Fetch ALL messenger/instagram conversations regardless of name
  // (we'll skip ones that already have good names)
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('id, platform, external_conversation_id, customer_name')
    .in('platform', ['messenger', 'instagram'])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ Supabase error:', error.message);
    process.exit(1);
  }

  if (!convos || convos.length === 0) {
    console.log('✅ No messenger/instagram conversations found.');
    return;
  }

  const genericNames = ['Messenger User', 'Instagram User', 'Facebook User', 'Unknown'];
  const toFix = convos.filter(c => genericNames.includes(c.customer_name));
  const alreadyNamed = convos.filter(c => !genericNames.includes(c.customer_name));

  console.log(`\n📊 Total: ${convos.length} | Already named: ${alreadyNamed.length} | Need fixing: ${toFix.length}\n`);

  if (toFix.length === 0) {
    console.log('🎉 All conversations already have real names!');
    return;
  }

  let fixed = 0;
  let failed = 0;

  for (const conv of toFix) {
    console.log(`→ [${conv.platform}] "${conv.customer_name}" | ID: ${conv.external_conversation_id}`);

    let realName = null;
    if (conv.platform === 'messenger') {
      const pageId = pageIds['messenger'];
      if (!pageId) { console.log('  ⚠️  No messenger page ID in integrations table — skipping'); failed++; continue; }
      realName = await fetchMessengerName(conv.external_conversation_id, pageId);
    } else if (conv.platform === 'instagram') {
      realName = await fetchInstagramName(conv.external_conversation_id);
    }

    if (realName) {
      const { error: updateErr } = await supabase
        .from('conversations')
        .update({ customer_name: realName })
        .eq('id', conv.id);

      if (updateErr) {
        console.log(`  ❌ DB update failed: ${updateErr.message}\n`);
        failed++;
      } else {
        console.log(`  💾 Updated: "${conv.customer_name}" → "${realName}"\n`);
        fixed++;
      }
    } else {
      console.log(`  ⚠️  Could not resolve name — leaving as "${conv.customer_name}"\n`);
      failed++;
    }
  }

  console.log(`\n🏁 Done! Fixed: ${fixed} | Could not fix: ${failed}`);
  if (failed > 0) {
    console.log('\n💡 Tip: "Could not fix" usually means the Meta API returned an error.');
    console.log('   This happens when your app is in Development mode and the sender');
    console.log('   is not a registered tester. Once your app goes Live, all names will resolve.');
  }
}

main().catch(console.error);
