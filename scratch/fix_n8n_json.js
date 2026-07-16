const fs = require('fs');

const path = 'd:/my_automation/afaq-automation/docs/Afaq AI Agent — v4 Production (Complete Pipeline).json';
let json = JSON.parse(fs.readFileSync(path, 'utf8'));

for (let node of json.nodes) {
  if (node.name === 'Build AI Prompt') {
    let code = node.parameters.jsCode;
    // Fix Currency (PKR to USD)
    code = code.replace(/PKR/g, 'USD');
    
    // Fix Email prompt
    // Add Email to order state block
    code = code.replace(
      /`Delivery address: \$\{existingOrder\.delivery_address \|\| '\(not yet provided\)'\}`,\n/,
      "`Delivery address: ${existingOrder.delivery_address || '(not yet provided)'}`,\n      `Email: ${existingOrder.customer_email || '(not yet provided)'}`,\n"
    );
    // Add Email to mandatory summary
    code = code.replace(
      /'\*Delivery Address\*: \[Address or Pending\]',\n/,
      "'*Delivery Address*: [Address or Pending]',\n  '*Email*: [Email Address or Pending]',\n"
    );
    // Update instruction
    code = code.replace(
      /especially when asking for an address, payment method, or confirming/,
      "especially when asking for an email, address, payment method, or confirming"
    );
    
    node.parameters.jsCode = code;
  }
  
  if (node.name === 'Detect Intent & Create Record') {
    let code = node.parameters.jsCode;
    // Fix Currency (allow both USD and PKR for parsing, but default to parsing either)
    // Wait, the regex currently is: /(?:PKR|Rs\.?|pkr)\s*([\d,]+)\s*(?:per\s+pack|per\s+piece|each|\/pack|\/piece|\/pcs)|(?:price|costs)[\s\w]{0,15}(?:PKR|Rs\.?|pkr)\s*([\d,]+)/gi
    code = code.replace(
      /\(\?:PKR\|Rs\\\.?\|pkr\)/g,
      "(?:USD|\\\\$|PKR|Rs\\\\.?|pkr)"
    );
    
    // Add Email extraction logic
    // Just before: `let paymentMethod = recordData.payment_method || null;`
    const emailExtractionLogic = `
    let customerEmail = recordData.customer_email || null;
    const emailMatch = msg.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+)/i);
    if (emailMatch) {
      customerEmail = emailMatch[1];
    } else if (!customerEmail) {
      const botEmailMatch = aiReply.match(/\\*[Ee]mail\\*\\s*[:\\-]\\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+)/);
      if (botEmailMatch) customerEmail = botEmailMatch[1];
    }
    
    let paymentMethod = recordData.payment_method || null;`;
    
    code = code.replace(
      /let paymentMethod = recordData\.payment_method \|\| null;/g,
      emailExtractionLogic
    );
    
    // Inject customer_email into the recordData object
    code = code.replace(
      /customer_name: ctx\.customer_name,\n\s*niche: niche,/g,
      "customer_name: ctx.customer_name,\n      customer_email: customerEmail,\n      niche: niche,"
    );
    
    // Change state logic for 'pending' to require email
    // `} else if (deliveryAddress && paymentMethod) {` -> `} else if (deliveryAddress && paymentMethod && customerEmail) {`
    code = code.replace(
      /\} else if \(deliveryAddress && paymentMethod\) \{/g,
      "} else if (deliveryAddress && paymentMethod && customerEmail) {"
    );
    
    // `} else if (deliveryAddress || intent === 'address_provided') {`
    code = code.replace(
      /\} else if \(deliveryAddress \|\| intent === 'address_provided'\) \{/g,
      "} else if (deliveryAddress || customerEmail || intent === 'address_provided') {"
    );

    node.parameters.jsCode = code;
  }
}

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log("Updated JSON");
