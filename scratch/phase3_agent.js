const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../docs/Afaq AI Agent — v4 Production (Complete Pipeline).json');
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Find positions
const kbNode = workflow.nodes.find(n => n.name === 'Search Knowledge Base');
const x = kbNode.position[0];
const y = kbNode.position[1];

// 1. Create Search Products Node
const searchProductsNode = {
  "parameters": {
    "method": "POST",
    "url": "https://ldtqnpenpobmqqvdrbmq.supabase.co/rest/v1/rpc/search_products",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "supabaseApi",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "contentType": "raw",
    "rawContentType": "application/json",
    "body": "={{ JSON.stringify({\n  p_tenant_id: $('Merge Tenant').first().json.tenant_id,\n  p_query: $('Merge Tenant').first().json.message\n}) }}",
    "options": {
      "timeout": 10000
    }
  },
  "id": "search-products-node-id",
  "name": "Search Products",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [x, y + 200],
  "alwaysOutputData": true,
  "continueOnFail": true,
  "credentials": {
    "supabaseApi": {
      "id": "BothqFLEOZUsG3Ms",
      "name": "Supabase account"
    }
  }
};

// 2. Create Merge Node
const mergeNode = {
  "parameters": {
    "mode": "wait"
  },
  "id": "merge-kb-products",
  "name": "Merge Search Results",
  "type": "n8n-nodes-base.merge",
  "typeVersion": 2.1,
  "position": [x + 200, y]
};

workflow.nodes.push(searchProductsNode, mergeNode);

// 3. Update Assemble Context code
const assembleNode = workflow.nodes.find(n => n.name === 'Assemble Context');
assembleNode.position[0] = x + 400; // Shift it right

assembleNode.parameters.jsCode = `// ─────────────────────────────────────────────
// NODE 12: Assemble full context for AI
// ─────────────────────────────────────────────
const ctx       = $('Merge Tenant').first().json;
const agentItem = $('Load Agent').first().json;
const convItem  = $('Find Conversation').first().json;

// Extract knowledge base docs
const kbDocs = $('Search Knowledge Base').all()
  .map(item => item.json)
  .filter(doc => doc && doc.title && doc.content && !doc.error);

// Extract products
let productDocs = [];
try {
  productDocs = $('Search Products').all()
    .map(item => item.json)
    .filter(doc => doc && doc.name && !doc.error);
} catch(e) {}

// Agent prompt — from agents table
const agent      = agentItem?.id ? agentItem : null;
const agentPrompt = agent?.prompt ||
  \`You are a helpful AI assistant for \${ctx.business_name}. Answer customer questions professionally.\`;

// Format knowledge base entries
const kbEntries = kbDocs.length > 0
  ? kbDocs.map((kb, i) => \`[\${i + 1}] \${kb.title}:\\n\${kb.content}\`).join('\\n\\n')
  : '';

// Format product entries (Phase 3 Commerce V2)
const productEntries = productDocs.length > 0
  ? productDocs.map(p => {
      let desc = p.description ? p.description.substring(0, 150) + '...' : '';
      return \`- \${p.name} | Price: \${p.price} \${p.currency}\\n  Category: \${p.category}\\n  Desc: \${desc}\\n  URL: \${p.product_url || ''}\\n  Image: \${p.image_url || ''}\`;
    }).join('\\n\\n')
  : '';

let finalContext = '';
if (kbEntries) finalContext += \`=== GENERAL POLICIES & FAQS ===\\n\${kbEntries}\\n\\n\`;
if (productEntries) finalContext += \`=== LIVE PRODUCT CATALOG ===\\n\${productEntries}\\n\\n\`;

// Existing conversation
const existingConv      = convItem?.id ? convItem : null;
const conversation_id   = ctx.conversation_id || existingConv?.id || null;
const is_new_conversation = !existingConv;

return [{
  json: {
    ...ctx,
    agent_prompt:       agentPrompt,
    kb_entries:         finalContext,
    kb_count:           kbDocs.length,
    product_count:      productDocs.length,
    conversation_id:    conversation_id,
    is_new_conversation: is_new_conversation
  }
}];`;

// 4. Update Build AI Prompt to handle products properly
const buildPromptNode = workflow.nodes.find(n => n.name === 'Build AI Prompt');
buildPromptNode.parameters.jsCode = buildPromptNode.parameters.jsCode.replace(
  'const kbSection = ctx.kb_entries',
  '// NEW IN PHASE 3: Tell AI how to format product cards if we want to add UI later\nconst productCardInstruction = "\\n\\n--- PRODUCT MEDIA MESSAGES ---\\nIf you are recommending a product from the LIVE PRODUCT CATALOG and it has an Image URL, you should format your response nicely so the user sees the product clearly.";\n\nconst kbSection = ctx.kb_entries'
);
buildPromptNode.parameters.jsCode = buildPromptNode.parameters.jsCode.replace(
  "orderStateBlock,\\n  '',\\n  kbSection",
  "orderStateBlock,\\n  '',\\n  productCardInstruction,\\n  '',\\n  kbSection"
);

// 5. Update Connections
// A. Prepare Search Body branches to both
if (!workflow.connections["Prepare Search Body"]["main"]) workflow.connections["Prepare Search Body"]["main"] = [[]];
workflow.connections["Prepare Search Body"]["main"][0].push(
  { "node": "Search Products", "type": "main", "index": 0 }
);

// B. Search Knowledge Base connects to Merge (Wait)
workflow.connections["Search Knowledge Base"] = {
  "main": [
    [ { "node": "Merge Search Results", "type": "main", "index": 0 } ]
  ]
};

// C. Search Products connects to Merge (Wait)
workflow.connections["Search Products"] = {
  "main": [
    [ { "node": "Merge Search Results", "type": "main", "index": 1 } ]
  ]
};

// D. Merge connects to Assemble Context
workflow.connections["Merge Search Results"] = {
  "main": [
    [ { "node": "Assemble Context", "type": "main", "index": 0 } ]
  ]
};

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('Successfully edited Phase 3 Agent Architecture in the workflow.');
