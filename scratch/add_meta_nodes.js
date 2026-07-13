const fs = require('fs');
const wfPath = 'docs/afaq_v4_complete_workflow.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// Generate unique IDs for the new nodes
const buildMetaId = 'build-meta-' + Date.now();
const sendMetaId = 'send-meta-' + Date.now();

// Find positions
const formatResNode = wf.nodes.find(n => n.name === 'Format Response');
const px = formatResNode.position[0] + 200;
const py = formatResNode.position[1];

// 1. Build Meta Payload Node
const buildMetaNode = {
  "parameters": {
    "jsCode": `const d = $input.first().json;

// Get credentials from the webhook payload or environment
const metaToken = d.meta_credentials?.access_token || $env.META_ACCESS_TOKEN || "";
const phoneNumberId = d.phone_number_id || d.meta_credentials?.phone_number_id || $env.META_PHONE_NUMBER_ID || "";
const igUserId = d.meta_credentials?.instagram_user_id || $env.INSTAGRAM_USER_ID || "";

let endpoint, payload;

if (d.platform === 'whatsapp') {
  endpoint = \`https://graph.facebook.com/v19.0/\${phoneNumberId}/messages\`;
  payload = {
    messaging_product: 'whatsapp',
    to: d.customer_phone,
    type: 'text',
    text: { body: d.ai_reply || d.reply, preview_url: false }
  };
} else if (d.platform === 'instagram') {
  endpoint = \`https://graph.facebook.com/v19.0/\${igUserId}/messages\`;
  payload = {
    recipient: { id: d.customer_phone },
    message: { text: d.ai_reply || d.reply }
  };
} else {
  // messenger
  endpoint = \`https://graph.facebook.com/v19.0/me/messages\`;
  payload = {
    recipient: { id: d.customer_phone },
    message: { text: d.ai_reply || d.reply }
  };
}

return [{ json: { ...d, meta_endpoint: endpoint, meta_payload: payload, meta_token: metaToken } }];`
  },
  "id": buildMetaId,
  "name": "Build Meta Payload",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [px, py]
};

// 2. Send to Meta Node
const sendMetaNode = {
  "parameters": {
    "method": "POST",
    "url": "={{ $json.meta_endpoint }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=Bearer {{ $json.meta_token }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify($json.meta_payload) }}",
    "options": {}
  },
  "id": sendMetaId,
  "name": "Send to Meta",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [px + 200, py]
};

// Add nodes
wf.nodes.push(buildMetaNode, sendMetaNode);

// Update connections
if (!wf.connections["Format Response"]) {
  wf.connections["Format Response"] = { main: [[]] };
}
// Add connection from Format Response to Build Meta Payload
wf.connections["Format Response"].main[0].push({
  node: "Build Meta Payload",
  type: "main",
  index: 0
});

// Add connection from Build Meta Payload to Send to Meta
wf.connections["Build Meta Payload"] = {
  main: [
    [
      {
        node: "Send to Meta",
        type: "main",
        index: 0
      }
    ]
  ]
};

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log("Successfully appended Meta nodes");
