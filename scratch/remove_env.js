const fs = require('fs');
const wfPath = 'docs/afaq_v4_complete_workflow.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

for (const node of wf.nodes) {
  if (node.parameters && node.parameters.jsCode) {
    node.parameters.jsCode = node.parameters.jsCode
      .replace(/\$env\.META_ACCESS_TOKEN/g, '"YOUR_META_ACCESS_TOKEN_HERE"')
      .replace(/\$env\.META_PHONE_NUMBER_ID/g, '"YOUR_PHONE_NUMBER_ID_HERE"')
      .replace(/\$env\.INSTAGRAM_USER_ID/g, '"YOUR_INSTAGRAM_USER_ID_HERE"');
  }
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('Removed $env references');
