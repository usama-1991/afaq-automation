/**
 * Fix n8n workflow: 
 * 1. Connect "Build Platform-Specific Meta API Request" → "HTTP Request - Send via meta api"
 * 2. Fix Instagram endpoint to use /me/messages instead of /{igUserId}/messages
 * 3. Use platform-specific tokens instead of hardcoded WhatsApp token
 *
 * Usage: node scripts/fix_n8n_meta_dispatch.js
 * Then re-import the output JSON into n8n.
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../docs/Ittisalo_master_workflow_FIXED_v3.json');
const outputPath = path.join(__dirname, '../docs/Ittisalo_master_workflow_FIXED_v4.json');

const wf = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// ─── FIX 1: Connect Build Platform-Specific Meta API Request → HTTP Request - Send via meta api ───
// Currently: If2 (False) → Build Platform-Specific Meta API Request (dead end)
// Should be: If2 (False) → Build Platform-Specific Meta API Request → HTTP Request - Send via meta api

if (!wf.connections['Build Platform-Specific Meta API Request']) {
  wf.connections['Build Platform-Specific Meta API Request'] = { main: [[]] };
}

// Add connection to HTTP Request - Send via meta api
const existingConns = wf.connections['Build Platform-Specific Meta API Request'].main[0];
const alreadyConnected = existingConns.some(c => c.node === 'HTTP Request - Send via meta api');
if (!alreadyConnected) {
  existingConns.push({
    node: 'HTTP Request - Send via meta api',
    type: 'main',
    index: 0
  });
  console.log('✅ Connected: Build Platform-Specific Meta API Request → HTTP Request - Send via meta api');
} else {
  console.log('ℹ️  Already connected.');
}

// ─── FIX 2: Fix the Build Platform-Specific Meta API Request code ───
// - Instagram should use /me/messages (not /{igUserId}/messages)  
// - Use environment variables for tokens instead of hardcoded values
// - Use platform-specific tokens

const buildNode = wf.nodes.find(n => n.name === 'Build Platform-Specific Meta API Request');
if (buildNode) {
  buildNode.parameters.jsCode = `const d = $input.first().json;

// Use environment-variable tokens so each platform gets the right credential
// Fallback chain: platform-specific env → general META token → webhook payload
const waToken = $env.META_ACCESS_TOKEN || d.wa_access_token || "";
const messengerToken = $env.MESSENGER_ACCESS_TOKEN || waToken;
const igToken = $env.INSTAGRAM_ACCESS_TOKEN || messengerToken;
const phoneNumberId = d.phone_number_id || d.wa_phone_number_id || $env.META_PHONE_NUMBER_ID || "";

let endpoint, payload, token;

if (d.platform === 'whatsapp') {
  token = waToken;
  endpoint = \`https://graph.facebook.com/v21.0/\${phoneNumberId}/messages\`;
  payload = {
    messaging_product: 'whatsapp',
    to: d.customer_phone,
    type: 'text',
    text: { body: d.ai_reply, preview_url: false }
  };
} else if (d.platform === 'instagram') {
  // FIX: Instagram Send API uses /me/messages, NOT /{ig_user_id}/messages
  token = igToken;
  endpoint = 'https://graph.facebook.com/v21.0/me/messages';
  payload = {
    recipient: { id: d.customer_phone },
    message: { text: d.ai_reply }
  };
} else {
  // messenger — /me/messages is correct
  token = messengerToken;
  endpoint = 'https://graph.facebook.com/v21.0/me/messages';
  payload = {
    recipient: { id: d.customer_phone },
    message: { text: d.ai_reply }
  };
}

return [{ json: { ...d, meta_endpoint: endpoint, meta_payload: payload, meta_token: token } }];
`;
  console.log('✅ Fixed: Build Platform-Specific Meta API Request code (correct endpoints + dynamic tokens)');
} else {
  console.log('⚠️  Node "Build Platform-Specific Meta API Request" not found');
}

// ─── Write output ───
fs.writeFileSync(outputPath, JSON.stringify(wf, null, 2));
console.log(`\n📄 Written fixed workflow to: ${outputPath}`);
console.log('\n🔄 Next steps:');
console.log('1. Go to n8n → Import Workflow → select the output file');
console.log('2. Ensure MESSENGER_ACCESS_TOKEN, INSTAGRAM_ACCESS_TOKEN are set in n8n environment variables');
console.log('3. Activate the workflow');
