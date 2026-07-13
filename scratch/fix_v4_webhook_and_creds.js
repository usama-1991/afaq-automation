const fs = require('fs');
const wfPath = 'docs/afaq_v4_complete_workflow.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

for (const node of wf.nodes) {
  // Remove hardcoded "Raziq Supabase" and "OpenAi account tps" credentials
  if (node.credentials) {
    delete node.credentials;
  }

  // Update the Webhook Trigger node to use x-api-key authentication
  if (node.name === 'Webhook Trigger' && node.type === 'n8n-nodes-base.webhook') {
    node.parameters.authentication = 'headerAuth';
    // When using headerAuth, n8n expects a headerAuth credential
    // The user will select their "Header Auth account" upon import
  }
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('Fixed Webhook Auth and removed hardcoded credentials');
