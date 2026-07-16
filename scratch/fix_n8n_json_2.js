const fs = require('fs');
const path = 'd:/my_automation/afaq-automation/docs/Afaq AI Agent — v4 Production (Complete Pipeline).json';
let json = JSON.parse(fs.readFileSync(path, 'utf8'));

for (let node of json.nodes) {
  if (node.name === 'Detect Intent & Create Record') {
    let code = node.parameters.jsCode;
    
    // Fix regex to include decimals
    code = code.replace(/\[\\d,\]\+/g, '[\\d,.]+');
    
    // Fix parseInt to parseFloat
    code = code.replace(/parseInt\(\(unitPriceMatches\[0\]\[1\] \|\| unitPriceMatches\[0\]\[2\]\)\.replace\(\/,/g, "parseFloat((unitPriceMatches[0][1] || unitPriceMatches[0][2]).replace(/,");
    code = code.replace(/parseInt\(totalMatches\[totalMatches\.length - 1\]\[1\]\.replace\(\/,/g, "parseFloat(totalMatches[totalMatches.length - 1][1].replace(/,");
    code = code.replace(/parseInt\(inlinePriceMatch\[1\]\.replace\(\/,/g, "parseFloat(inlinePriceMatch[1].replace(/,");
    
    // Fix hardcoded "PKR" fallback currency to "USD"
    code = code.replace(
      /currency: recordData\.currency \|\| 'PKR',/g,
      "currency: recordData.currency || 'USD',"
    );

    node.parameters.jsCode = code;
  }
}

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log("Updated parsing to support decimals and USD defaults");
