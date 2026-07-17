const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../docs/Afaq AI Agent — v4 Production (Complete Pipeline).json');
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Find the maximum X position to place new nodes to the right
let maxX = -5000;
let minY = 0;
workflow.nodes.forEach(n => {
    if (n.position && n.position[0] > maxX) maxX = n.position[0];
    if (n.position && n.position[1] < minY) minY = n.position[1];
});

const startX = maxX + 400;
const startY = minY - 600; // Place above existing workflow

const newNodes = [
    // ----------------------------------------------------------------
    // WOOCOMMERCE SYNC PIPELINE
    // ----------------------------------------------------------------
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "sync-woocommerce",
        "responseMode": "lastNode",
        "options": {}
      },
      "id": "webhook-woo-sync",
      "name": "Webhook: Sync WooCommerce",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [startX, startY]
    },
    {
      "parameters": {
        "jsCode": "const body = $input.first().json.body || $input.first().json;\n\nif (!body.tenant_id || !body.store_url || !body.consumer_key || !body.consumer_secret) {\n  throw new Error('Missing required fields: tenant_id, store_url, consumer_key, consumer_secret');\n}\n\n// Format URL to ensure no trailing slash\nconst storeUrl = body.store_url.replace(/\\/$/, '');\n\nreturn [{\n  json: {\n    tenant_id: body.tenant_id,\n    store_url: storeUrl,\n    consumer_key: body.consumer_key,\n    consumer_secret: body.consumer_secret,\n    products_url: `${storeUrl}/wp-json/wc/v3/products`\n  }\n}];"
      },
      "id": "code-prep-woo",
      "name": "Prepare Woo Request",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [startX + 200, startY]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $json.products_url }}",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            { "name": "per_page", "value": "100" },
            { "name": "status", "value": "publish" }
          ]
        },
        "authentication": "genericCredentialType",
        "genericAuthType": "httpBasicAuth",
        "credentials": {
          "httpBasicAuth": {
            "id": "={{ $json.consumer_key }}",
            "password": "={{ $json.consumer_secret }}"
          }
        },
        "options": {}
      },
      "id": "http-fetch-woo",
      "name": "Fetch Woo Products",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [startX + 400, startY],
      "continueOnFail": true
    },
    {
      "parameters": {
        "fieldToSplitOut": "body",
        "options": {}
      },
      "id": "split-woo-products",
      "name": "Split Woo Products",
      "type": "n8n-nodes-base.itemLists",
      "typeVersion": 3,
      "position": [startX + 600, startY]
    },
    {
      "parameters": {
        "jsCode": "const product = $input.first().json;\nconst tenant_id = $('Prepare Woo Request').first().json.tenant_id;\n\n// Strip HTML from description\nconst stripHtml = (html) => html ? html.replace(/<[^>]*>?/gm, '').trim() : '';\n\nconst record = {\n  tenant_id: tenant_id,\n  external_product_id: String(product.id),\n  name: product.name,\n  category: (product.categories && product.categories.length > 0) ? product.categories[0].name : 'Uncategorized',\n  description: stripHtml(product.description || product.short_description),\n  price: parseFloat(product.price || 0),\n  currency: 'USD', // WooCommerce doesn't return currency per product by default, update later if needed\n  image_url: (product.images && product.images.length > 0) ? product.images[0].src : null,\n  product_url: product.permalink,\n  stock_status: product.stock_status || 'instock',\n  is_active: product.status === 'publish',\n  updated_at: new Date().toISOString()\n};\n\nreturn [{ json: record }];"
      },
      "id": "code-map-woo",
      "name": "Map to Schema",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [startX + 800, startY]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://ldtqnpenpobmqqvdrbmq.supabase.co/rest/v1/products?on_conflict=tenant_id,external_product_id",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "supabaseApi",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Prefer", "value": "resolution=merge-duplicates,return=representation" }
          ]
        },
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "application/json",
        "body": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "http-upsert-products",
      "name": "Upsert into Products",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [startX + 1000, startY],
      "credentials": {
        "supabaseApi": { "id": "BothqFLEOZUsG3Ms", "name": "Supabase account" }
      }
    },

    // ----------------------------------------------------------------
    // WEB CRAWLER SYNC PIPELINE (FALLBACK)
    // ----------------------------------------------------------------
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "sync-scraper",
        "responseMode": "lastNode",
        "options": {}
      },
      "id": "webhook-scrape-sync",
      "name": "Webhook: Sync Web Scraper",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [startX, startY + 300]
    },
    {
      "parameters": {
        "jsCode": "const body = $input.first().json.body || $input.first().json;\n\nif (!body.tenant_id || !body.website_url) {\n  throw new Error('Missing required fields: tenant_id, website_url');\n}\n\nreturn [{\n  json: {\n    tenant_id: body.tenant_id,\n    website_url: body.website_url\n  }\n}];"
      },
      "id": "code-prep-scrape",
      "name": "Prepare Scrape Request",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [startX + 200, startY + 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.firecrawl.dev/v0/scrape",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": "Bearer fc-YOUR_FIRECRAWL_KEY" },
            { "name": "Content-Type", "value": "application/json" }
          ]
        },
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "application/json",
        "body": "={{ JSON.stringify({ url: $json.website_url, pageOptions: { onlyMainContent: true } }) }}",
        "options": {}
      },
      "id": "http-firecrawl",
      "name": "Scrape with Firecrawl",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [startX + 400, startY + 300],
      "continueOnFail": true
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.openai.com/v1/chat/completions",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "openAiApi",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" }
          ]
        },
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "application/json",
        "body": "={{ JSON.stringify({\n  model: 'gpt-4o-mini',\n  messages: [\n    { role: 'system', content: 'You are a data extractor. Extract all products and their details from the provided website text. Return ONLY a raw JSON array of objects with the following keys: name, category, description, price (number), currency (string, e.g. USD), image_url (if any URL found), product_url (if any). Do not use markdown blocks, just raw JSON.' },\n    { role: 'user', content: $json.data && $json.data.markdown ? $json.data.markdown : '' }\n  ]\n}) }}",
        "options": {}
      },
      "id": "http-openai-extract",
      "name": "Extract Products (OpenAI)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [startX + 600, startY + 300],
      "credentials": {
        "openAiApi": { "id": "BIvBbKLw9MFQV3gf", "name": "OpenAI account" }
      }
    },
    {
      "parameters": {
        "jsCode": "try {\n  const response = $input.first().json;\n  const content = response.choices[0].message.content;\n  // Clean possible markdown backticks\n  const cleanContent = content.replace(/^```json\\n?|```$/gm, '').trim();\n  const products = JSON.parse(cleanContent);\n  return products.map(p => ({ json: p }));\n} catch(e) {\n  return [];\n}"
      },
      "id": "code-parse-openai",
      "name": "Parse Products JSON",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [startX + 800, startY + 300]
    },
    {
      "parameters": {
        "jsCode": "const product = $input.first().json;\nconst tenant_id = $('Prepare Scrape Request').first().json.tenant_id;\n\nfunction makeUUID() {\n  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {\n    const r = Math.random() * 16 | 0;\n    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);\n  });\n}\n\nconst record = {\n  tenant_id: tenant_id,\n  external_product_id: 'scraped-' + makeUUID(),\n  name: product.name,\n  category: product.category || 'Uncategorized',\n  description: product.description || '',\n  price: parseFloat(product.price || 0),\n  currency: product.currency || 'USD',\n  image_url: product.image_url || null,\n  product_url: product.product_url || null,\n  stock_status: 'instock',\n  is_active: true,\n  updated_at: new Date().toISOString()\n};\n\nreturn [{ json: record }];"
      },
      "id": "code-map-scraped",
      "name": "Map Scraped to Schema",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [startX + 1000, startY + 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://ldtqnpenpobmqqvdrbmq.supabase.co/rest/v1/products?on_conflict=tenant_id,external_product_id",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "supabaseApi",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Prefer", "value": "resolution=merge-duplicates,return=representation" }
          ]
        },
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "application/json",
        "body": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "http-upsert-scraped-products",
      "name": "Upsert Scraped Products",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [startX + 1200, startY + 300],
      "credentials": {
        "supabaseApi": { "id": "BothqFLEOZUsG3Ms", "name": "Supabase account" }
      }
    }
];

const newConnections = {
    // Woo Connections
    "Webhook: Sync WooCommerce": {
      "main": [
        [ { "node": "Prepare Woo Request", "type": "main", "index": 0 } ]
      ]
    },
    "Prepare Woo Request": {
      "main": [
        [ { "node": "Fetch Woo Products", "type": "main", "index": 0 } ]
      ]
    },
    "Fetch Woo Products": {
      "main": [
        [ { "node": "Split Woo Products", "type": "main", "index": 0 } ]
      ]
    },
    "Split Woo Products": {
      "main": [
        [ { "node": "Map to Schema", "type": "main", "index": 0 } ]
      ]
    },
    "Map to Schema": {
      "main": [
        [ { "node": "Upsert into Products", "type": "main", "index": 0 } ]
      ]
    },

    // Scrape Connections
    "Webhook: Sync Web Scraper": {
      "main": [
        [ { "node": "Prepare Scrape Request", "type": "main", "index": 0 } ]
      ]
    },
    "Prepare Scrape Request": {
      "main": [
        [ { "node": "Scrape with Firecrawl", "type": "main", "index": 0 } ]
      ]
    },
    "Scrape with Firecrawl": {
      "main": [
        [ { "node": "Extract Products (OpenAI)", "type": "main", "index": 0 } ]
      ]
    },
    "Extract Products (OpenAI)": {
      "main": [
        [ { "node": "Parse Products JSON", "type": "main", "index": 0 } ]
      ]
    },
    "Parse Products JSON": {
      "main": [
        [ { "node": "Map Scraped to Schema", "type": "main", "index": 0 } ]
      ]
    },
    "Map Scraped to Schema": {
      "main": [
        [ { "node": "Upsert Scraped Products", "type": "main", "index": 0 } ]
      ]
    }
};

// Append nodes
workflow.nodes.push(...newNodes);

// Append connections
for (const [sourceNode, targets] of Object.entries(newConnections)) {
  if (!workflow.connections[sourceNode]) {
    workflow.connections[sourceNode] = targets;
  } else {
    // Merge if exists
    for (const [type, typeTargets] of Object.entries(targets)) {
      if (!workflow.connections[sourceNode][type]) {
        workflow.connections[sourceNode][type] = typeTargets;
      } else {
        workflow.connections[sourceNode][type].push(...typeTargets);
      }
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('Successfully appended Phase 2 Sync logic to the workflow.');
