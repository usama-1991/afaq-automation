const fs = require('fs');
const path = 'd:/my_automation/afaq-automation/docs/Afaq AI Agent — v4 Production (Complete Pipeline).json';
let json = JSON.parse(fs.readFileSync(path, 'utf8'));

for (let node of json.nodes) {
  if (node.name === 'Detect Intent & Create Record') {
    let code = node.parameters.jsCode;
    
    // Fix regexes to include USD, $, and decimals
    code = code.replace(
      /\(\?:PKR\|Rs\\\.?\|pkr\)\\s\*?\(\[\\d,\.\]\+\)/g,
      "(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)\\\\s*([\\\\d,.]+)"
    );
    // Also fix the alternative side of the OR
    code = code.replace(
      /\(\?:PKR\|Rs\\\.?\|pkr\)\\s\*\(\[\\d,\.\]\+\)/g,
      "(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)\\\\s*([\\\\d,.]+)"
    );

    // Some specific replacements just in case the global didn't catch them
    code = code.replace(
      /const unitPriceMatches = \[\.\.\.combinedForPrice\.matchAll\(\/\(\?:PKR\|Rs\\\.?\|pkr\)\\s\*\(\[\\d,\.\]\+\)\\s\*\(\?:per\\s\+pack\|per\\s\+piece\|each\|\\\/pack\|\\\/piece\|\\\/pcs\)\|\(\?:price\|costs\)\[\\s\\w\]\{0,15\}\(\?:PKR\|Rs\\\.?\|pkr\)\\s\*\(\[\\d,\.\]\+\)\/gi\)\];/g,
      "const unitPriceMatches = [...combinedForPrice.matchAll(/(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)\\\\s*([\\\\d,.]+)\\\\s*(?:per\\\\s+pack|per\\\\s+piece|each|\\\\/pack|\\\\/piece|\\\\/pcs)|(?:price|costs)[\\\\s\\\\w]{0,15}(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)\\\\s*([\\\\d,.]+)/gi)];"
    );

    code = code.replace(
      /const totalMatches = \[\.\.\.aiReply\.matchAll\(\/\(\?:total\(\?:\\s\+amount\)\?\|amount\|bill\)\[\\s\\w\]\*\?\(\?:PKR\|Rs\\\.?\|pkr\)\\s\*\(\[\\d,\.\]\+\)\/gi\)\];/g,
      "const totalMatches = [...aiReply.matchAll(/(?:total(?:\\\\s+amount)?|amount|bill)[\\\\s\\\\w]*?(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)\\\\s*([\\\\d,.]+)/gi)];"
    );

    code = code.replace(
      /const inlinePriceMatch = rawName\.match\(\/\@\\s\*\(\?:PKR\|Rs\\\.?\|pkr\)\\s\*\(\[\\d,\.\]\+\)\/i\);/g,
      "const inlinePriceMatch = rawName.match(/@\\\\s*(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)\\\\s*([\\\\d,.]+)/i);"
    );

    code = code.replace(
      /rawName = rawName\.replace\(\/\@\\s\*\(\?:PKR\|Rs\\\.?\|pkr\)\\s\*\(\[\\d,\.\]\+\)\/i, ''\)\.trim\(\);/g,
      "rawName = rawName.replace(/@\\\\s*(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)\\\\s*([\\\\d,.]+)/i, '').trim();"
    );

    // Fix parseInt to parseFloat if still present
    code = code.replace(/parseInt\(\(unitPriceMatches\[0\]\[1\] \|\| unitPriceMatches\[0\]\[2\]\)\.replace\(\/,/g, "parseFloat((unitPriceMatches[0][1] || unitPriceMatches[0][2]).replace(/,");
    code = code.replace(/parseInt\(totalMatches\[totalMatches\.length - 1\]\[1\]\.replace\(\/,/g, "parseFloat(totalMatches[totalMatches.length - 1][1].replace(/,");
    code = code.replace(/parseInt\(inlinePriceMatch\[1\]\.replace\(\/,/g, "parseFloat(inlinePriceMatch[1].replace(/,");
    
    // Make sure currency defaults to USD
    code = code.replace(/currency: recordData\.currency \|\| 'PKR',/g, "currency: recordData.currency || 'USD',");
    code = code.replace(/currency:\s*'PKR',/g, "currency: 'USD',");

    node.parameters.jsCode = code;
  }
}

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log("Updated parsing to accurately support decimals and USD defaults in regexes");
