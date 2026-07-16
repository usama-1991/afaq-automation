const fs = require('fs');
const path = 'd:/my_automation/afaq-automation/docs/Afaq AI Agent — v4 Production (Complete Pipeline).json';
let json = JSON.parse(fs.readFileSync(path, 'utf8'));

for (let node of json.nodes) {
  if (node.name === 'Detect Intent & Create Record') {
    let code = node.parameters.jsCode;
    
    // Explicitly add currency to the recordData
    code = code.replace(
      /handled_by: 'bot',\n\s*status: newStatus,/g,
      "handled_by: 'bot',\n      status: newStatus,\n      currency: 'USD',"
    );

    node.parameters.jsCode = code;
  }
}

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log("Updated currency explicitly");
