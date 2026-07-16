const fs = require('fs');
const path = 'd:/my_automation/afaq-automation/docs/Afaq AI Agent — v4 Production (Complete Pipeline).json';
let json = JSON.parse(fs.readFileSync(path, 'utf8'));

for (let node of json.nodes) {
  if (node.name === 'Detect Intent & Create Record') {
    let code = node.parameters.jsCode;
    
    // Globally replace the PKR regex string
    code = code.replace(/\(\?:PKR\|Rs\\\.?\?\|pkr\)/g, "(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)");
    code = code.replace(/\(\?:PKR\|Rs\\\.?\|pkr\)/g, "(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)");

    // Fix parseInt to parseFloat for unitPrice, orderTotal, and inlinePrice
    code = code.replace(/parseInt\(\(unitPriceMatches/g, "parseFloat((unitPriceMatches");
    code = code.replace(/parseInt\(totalMatches/g, "parseFloat(totalMatches");
    code = code.replace(/parseInt\(inlinePriceMatch/g, "parseFloat(inlinePriceMatch");

    // Make sure currency defaults to USD
    code = code.replace(/currency: recordData\.currency \|\| 'PKR',/g, "currency: recordData.currency || 'USD',");

    node.parameters.jsCode = code;
  }
}

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log("Updated!");
