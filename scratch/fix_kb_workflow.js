const fs = require('fs');
const wf = {
  "name": "KB Backfill (Run Once)",
  "nodes": [
    {
      "parameters": {},
      "id": "node-1",
      "name": "On clicking 'Test Workflow'",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [400, 300]
    },
    {
      "parameters": {
        "operation": "getAll",
        "tableId": "knowledge_base",
        "returnAll": true,
        "filters": {
          "conditions": [
            { "keyName": "embedding", "condition": "is", "keyValue": "null" }
          ]
        }
      },
      "id": "node-2",
      "name": "Get KB Rows",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [600, 300]
    },
    {
      "parameters": {
        "batchSize": 1,
        "options": {}
      },
      "id": "node-3",
      "name": "Loop Over Rows",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [800, 300]
    },
    {
      "parameters": {
        "resource": "embedding",
        "model": "text-embedding-3-small",
        "input": "=[{{ $json.title }}]\\n{{ $json.content }}"
      },
      "id": "node-4",
      "name": "Generate Vector",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1.1,
      "position": [1000, 300]
    },
    {
      "parameters": {
        "operation": "update",
        "tableId": "knowledge_base",
        "matchColumns": "id",
        "columns": "embedding"
      },
      "id": "node-5",
      "name": "Save Vector",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1200, 300]
    }
  ],
  "connections": {
    "On clicking 'Test Workflow'": { "main": [ [ { "node": "Get KB Rows", "type": "main", "index": 0 } ] ] },
    "Get KB Rows": { "main": [ [ { "node": "Loop Over Rows", "type": "main", "index": 0 } ] ] },
    "Loop Over Rows": { "main": [ [ { "node": "Generate Vector", "type": "main", "index": 0 } ] ] },
    "Generate Vector": { "main": [ [ { "node": "Save Vector", "type": "main", "index": 0 } ] ] },
    "Save Vector": { "main": [ [ { "node": "Loop Over Rows", "type": "main", "index": 0 } ] ] }
  }
};

fs.writeFileSync('docs/kb_backfill_workflow.json', JSON.stringify(wf, null, 2));
console.log('Fixed kb_backfill_workflow.json');
