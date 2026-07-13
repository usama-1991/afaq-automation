const fs = require('fs');
const wfPath = 'docs/afaq_v4_complete_workflow.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

for (const node of wf.nodes) {
  if (node.type === 'n8n-nodes-base.httpRequest' && node.parameters.url && node.parameters.url.includes('supabase.co')) {
    // Enable predefined credentials
    node.parameters.authentication = 'predefinedCredentialType';
    node.parameters.nodeCredentialType = 'supabaseApi';
    
    // Add credentials mapping
    node.credentials = {
      "supabaseApi": {
        "id": "SqPZLoJsxHTK57M1",
        "name": "Raziq Supabase"
      }
    };

    // Remove apikey and Authorization from headers
    if (node.parameters.headerParameters && node.parameters.headerParameters.parameters) {
      node.parameters.headerParameters.parameters = node.parameters.headerParameters.parameters.filter(h => {
        const name = h.name.toLowerCase();
        return name !== 'apikey' && name !== 'authorization';
      });
    }
  }
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('Fixed auth');
