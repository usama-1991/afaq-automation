const fs = require('fs');
const path = require('path');

const v3Path = path.join(__dirname, '../docs/afaq_v3_workflow.json');
const v4Path = path.join(__dirname, '../docs/afaq_v4_complete_workflow.json');

const wf = JSON.parse(fs.readFileSync(v3Path, 'utf8'));

wf.name = "Afaq AI Agent — v4 Production (Complete Pipeline)";

// Define new nodes
const detectIntentCode = `// ─────────────────────────────────────────────
// NODE: Detect Intent & Create Record
// ─────────────────────────────────────────────
const ctx = $('Extract AI Reply').first().json;
const msg = ctx.message || ctx.normalized_message || '';
const msgLower = msg.toLowerCase();
const aiReply = ctx.ai_reply || '';

function detectIntent(text) {
  const m = text.toLowerCase();
  if (/order confirm|confirm kar|haan confirm|yes confirm|ok confirm/.test(m)) return 'order_confirmed';
  if (/deliver|address|location|ghar|makan|city|phase|block|dha|clifton/.test(m)) return 'address_provided';
  if (/\\bcod\\b|cash on delivery|easypaisa|jazzcash|bank transfer|payment/.test(m)) return 'cod_request';
  if (/want|need|order|chahiye|chaie|buy|purchase|kitna|price|rate/.test(m)) return 'order_placement';
  if (/appointment|book|slot|visit|checkup|schedule/.test(m)) return 'booking_intent';
  if (/property|flat|house|apartment|plot|rent|buy|bedroom/.test(m)) return 'property_inquiry';
  if (/price|cost|rate|how much|kitna|menu|list|products|services/.test(m)) return 'product_inquiry';
  return 'general_inquiry';
}

const intent = detectIntent(msg);

// ── Restore previous extracted info (Assuming we add a Find Context node later, or we can just leave it empty for now. But wait, in v3, we don't fetch conversation_context yet. We should ideally fetch it or initialize it.)
// For now, initialize empty.
const previousInfo = {}; 

let createRecord = false;
let recordType = null;
let recordData = { ...previousInfo };

const niche = ctx.niche || 'general';

// ═══════════════════════════════════════════════════════════════
// ECOMMERCE / RESTAURANT
// ═══════════════════════════════════════════════════════════════
if (['ecommerce', 'restaurant'].includes(niche)) {
  const orderTriggerIntents = ['product_inquiry', 'order_placement', 'address_provided', 'order_confirmed', 'cod_request'];
  const shouldCreateOrder = orderTriggerIntents.includes(intent);

  if (shouldCreateOrder) {
    createRecord = true;
    recordType = 'order';

    let extractedItems = [];
    const cleanName = s => s.trim().replace(/\\s+/g, ' ').replace(/^(i want|mujhe|muje|mjhe|chahiye|chahie|chaie|order|please|kindly)\\s+/gi, '').trim();

    const patA = /(\\d+)\\s*(?:pack|packs|piece|pieces|pcs|pc|item|items|x)\\s+(?:of\\s+)?([a-zA-Z0-9][a-zA-Z0-9\\s\\-\\.\\s]{2,50}?)(?=\\s*(?:chaie|chahiye|chahie|order|deliver|pkr|rs|\\.|,|$|\\n))/gi;
    const patB = /([a-zA-Z0-9][a-zA-Z0-9\\s\\-\\.\\s]{2,50}?)\\s+(\\d+)\\s*(?:pack|packs|piece|pieces|pcs|pc|item|items|x)(?:\\s|$|,)/gi;
    const patC = /(?:i\\s+want|i\\s+need|i\\s+would\\s+like|send\\s+me|give\\s+me)\\s+([a-zA-Z0-9][a-zA-Z0-9\\s\\-\\.\\s]{1,50}?)\\s+(\\d+)\\s*(?:pack|packs|piece|pieces|pcs|pc|item|items)/gi;
    const patD = /(?:mujhe|muje|mjhe|mjhay)\\s+([a-zA-Z0-9][a-zA-Z0-9\\s\\-\\.\\s]{2,50}?)(?:\\s+chaie|\\s+chahiye|\\s+chahie|\\s+chahiyen|\\s+lena|\\s+order)/gi;
    const patE = /(\\d+)\\s*(?:pack|packs|piece|pieces|pcs|pc|item|items)\\s+([a-zA-Z0-9][a-zA-Z0-9\\s\\-\\.\\s]{2,50})(?=\\s|$|,)/gi;

    patC.lastIndex = 0;
    const matchesC = [...msg.matchAll(patC)];
    if (matchesC.length > 0) {
      extractedItems = matchesC.map(m => ({ name: cleanName(m[1] || ''), qty: parseInt(m[2]) || 1, price: 0 })).filter(i => i.name.length > 1);
    }
    if (extractedItems.length === 0) {
      patA.lastIndex = 0;
      const matchesA = [...msg.matchAll(patA)];
      if (matchesA.length > 0) {
        extractedItems = matchesA.map(m => ({ name: cleanName(m[2] || ''), qty: parseInt(m[1]) || 1, price: 0 })).filter(i => i.name.length > 1);
      }
    }
    if (extractedItems.length === 0) {
      patE.lastIndex = 0;
      const matchesE = [...msg.matchAll(patE)];
      if (matchesE.length > 0) {
        extractedItems = matchesE.map(m => ({ name: cleanName(m[2] || ''), qty: parseInt(m[1]) || 1, price: 0 })).filter(i => i.name.length > 1);
      }
    }
    if (extractedItems.length === 0) {
      patB.lastIndex = 0;
      const matchesB = [...msg.matchAll(patB)];
      if (matchesB.length > 0) {
        extractedItems = matchesB.map(m => ({ name: cleanName(m[1] || ''), qty: parseInt(m[2]) || 1, price: 0 })).filter(i => i.name.length > 1);
      }
    }
    if (extractedItems.length === 0) {
      patD.lastIndex = 0;
      const matchesD = [...msg.matchAll(patD)];
      if (matchesD.length > 0) {
        extractedItems = matchesD.map(m => ({ name: cleanName(m[1] || ''), qty: 1, price: 0 })).filter(i => i.name.length > 1);
      }
    }

    const unitPriceMatch = aiReply.match(/(?:PKR|Rs\\.?|pkr)\\s*([\\d,]+)\\s*(?:\\/pack|\\/piece|\\/pcs|each)/i);
    const totalMatch = aiReply.match(/\\*{0,2}[Tt]otal\\*{0,2}\\s*[:\\-]\\s*(?:PKR|Rs\\.?|pkr)\\s*([\\d,]+)/i);

    let unitPrice = unitPriceMatch ? parseInt(unitPriceMatch[1].replace(/,/g, '')) : 0;
    let orderTotal = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : 0;

    if (extractedItems.length > 0) {
      if (unitPrice > 0) extractedItems[0].price = unitPrice;
      else if (orderTotal > 0 && extractedItems[0].qty > 0) {
        extractedItems[0].price = Math.round(orderTotal / extractedItems[0].qty);
      }
    }

    if (extractedItems.length > 0 && extractedItems[0].qty === 1) {
      const aiQtyMatch = aiReply.match(/[Qq]uantity\\*{0,2}\\s*[:\\-]\\s*(\\d+)/);
      if (aiQtyMatch) extractedItems[0].qty = parseInt(aiQtyMatch[1]);
    }

    let currentItems = recordData.items || [];
    if (extractedItems.length > 0) {
      currentItems = extractedItems;
    }

    let deliveryAddress = recordData.delivery_address || null;
    const combinedForAddr = msg + ' ' + aiReply;
    const addrLabelMatch = combinedForAddr.match(/(?:[Dd]elivery\\s+[Aa]ddress|[Dd]eliver\\s+to)\\s*[:\\-]?\\s*([^\\n,\\.]{8,100})/i);
    if (addrLabelMatch && (!deliveryAddress || intent === 'address_provided')) {
      deliveryAddress = addrLabelMatch[1].trim();
    }
    if (!deliveryAddress) {
      const addrKeywords = /\\b(dha|clifton|gulshan|phase|block|street|road|avenue|lane|sector|town|garden|colony|defence|bahria|nazimabad|korangi|malir|johar|askari|highway|rd\\b)/i;
      const addrMatch = combinedForAddr.match(new RegExp(\`[\\\\w\\\\s,\\\\.\\\\-\\\\/]{0,30}\${addrKeywords.source}[\\\\w\\\\s,\\\\.\\\\-\\\\/]{0,40}\`, 'i'));
      if (addrMatch) deliveryAddress = addrMatch[0].trim();
    }

    let paymentMethod = recordData.payment_method || null;
    if (!paymentMethod) {
      const combined = msgLower + ' ' + aiReply.toLowerCase();
      if (/\\bcod\\b|cash\\s+on\\s+delivery/.test(combined)) paymentMethod = 'COD';
      else if (/easypaisa/.test(combined)) paymentMethod = 'Easypaisa';
      else if (/jazzcash/.test(combined)) paymentMethod = 'JazzCash';
      else if (/bank\\s*transfer/.test(combined)) paymentMethod = 'Bank Transfer';
    }

    const calculatedTotal = orderTotal > 0 ? orderTotal : currentItems.reduce((s, i) => s + ((i.price || 0) * (i.qty || 1)), 0);

    const aiConfirmed = /confirm ho gaya|order confirm|order placed|confirmed your order|order ki tayari|order accept/i.test(aiReply);
    let newStatus;
    if (intent === 'order_confirmed' || aiConfirmed) {
      newStatus = 'confirmed';
    } else if (deliveryAddress && paymentMethod) {
      newStatus = 'pending';
    } else if (deliveryAddress || intent === 'address_provided') {
      newStatus = 'pending';
    } else {
      newStatus = ['confirmed', 'pending', 'processing'].includes(recordData.status) ? recordData.status : 'pending_address';
    }

    recordData = {
      ...recordData,
      tenant_id: ctx.tenant_id,
      conversation_id: ctx.conversation_id,
      customer_phone: ctx.customer_phone,
      customer_name: ctx.customer_name,
      niche: niche,
      items: currentItems.length > 0 ? currentItems : [{ name: 'Item from chat', qty: 1, price: 0 }],
      order_amount: calculatedTotal,
      payment_method: paymentMethod,
      delivery_address: deliveryAddress,
      source: ctx.platform || 'whatsapp',
      handled_by: 'bot',
      status: newStatus,
    };

    if (intent === 'order_confirmed' || aiConfirmed) {
      recordData.confirmed_at = new Date().toISOString();
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// DENTAL / SALON / CLINIC
// ═══════════════════════════════════════════════════════════════
if (['dental', 'salon', 'clinic'].includes(niche)) {
  if (['booking_intent', 'appointment_confirmed'].includes(intent)) {
    createRecord = true;
    recordType = 'appointment';

    const timeMatch = (msg + ' ' + aiReply).match(/(\\d{1,2})(:\\d{2})?\\s*(am|pm|AM|PM)/);
    const dayMatch = (msg + ' ' + aiReply).match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|kal|parso)/i);

    let apptDate = recordData.appointment_date || null;
    let apptTime = recordData.appointment_time || null;

    if (dayMatch && !apptDate) {
      const dayMap = { tomorrow:1,kal:1,parso:2,monday:0,tuesday:1,wednesday:2,thursday:3,friday:4,saturday:5,sunday:6 };
      const day = dayMatch[1].toLowerCase();
      const d2 = new Date();
      if (['tomorrow','kal','parso'].includes(day)) {
        d2.setDate(d2.getDate() + (dayMap[day] || 1));
      } else {
        const target = dayMap[day];
        const today = d2.getDay();
        const diff = (target - today + 7) % 7 || 7;
        d2.setDate(d2.getDate() + diff);
      }
      apptDate = d2.toISOString().split('T')[0];
    }

    if (timeMatch && !apptTime) {
      const hour = parseInt(timeMatch[1]);
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
      apptTime = \`\${String(hour24).padStart(2,'0')}:00:00\`;
    }

    recordData = {
      ...recordData,
      tenant_id: ctx.tenant_id,
      conversation_id: ctx.conversation_id,
      patient_name: ctx.customer_name,
      patient_phone: ctx.customer_phone,
      niche: niche,
      service_type: recordData.service_type || 'Consultation',
      appointment_date: apptDate,
      appointment_time: apptTime,
      status: intent === 'appointment_confirmed' ? 'confirmed' : 'pending',
      is_new_patient: ctx.is_new_conversation,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// REAL ESTATE
// ═══════════════════════════════════════════════════════════════
if (niche === 'realestate') {
  if (['property_inquiry','requirement_provided','visit_request'].includes(intent)) {
    createRecord = true;
    recordType = 'lead';

    const budgetMatch = msg.match(/(\\d+\\.?\\d*)\\s*(crore|lakh|cr|lac)/i);
    let budgetMax = recordData.budget_max || null;
    if (budgetMatch && !budgetMax) {
      const num = parseFloat(budgetMatch[1]);
      const unit = budgetMatch[2].toLowerCase();
      budgetMax = ['crore','cr'].includes(unit) ? num * 10000000 : num * 100000;
    }

    const bedMatch = msg.match(/(\\d+)\\s*(bed|bedroom|br)/i);
    let bedrooms = recordData.bedrooms || null;
    if (bedMatch && !bedrooms) bedrooms = parseInt(bedMatch[1]);

    recordData = {
      ...recordData,
      tenant_id: ctx.tenant_id,
      conversation_id: ctx.conversation_id,
      customer_name: ctx.customer_name,
      customer_phone: ctx.customer_phone,
      intent: recordData.intent || (msgLower.includes('rent') ? 'rent' : msgLower.includes('sell') ? 'sell' : 'buy'),
      bedrooms,
      budget_max: budgetMax,
      stage: intent === 'visit_request' ? 'visit_scheduled' :
             intent === 'requirement_provided' ? 'qualified' : (recordData.stage || 'new_inquiry'),
      temperature: 'warm',
      last_activity_at: new Date().toISOString(),
    };
  }
}

const needs_human_handoff = /human|agent|representative|insaan|baat|connect|transfer/i.test(msgLower);

return [{
  json: {
    ...ctx,
    detected_intent: intent,
    create_record: createRecord,
    record_type: recordType,
    record_data: recordData,
    needs_human_handoff: needs_human_handoff
  }
}];
`;

const newNodes = [
  {
    "parameters": { "jsCode": detectIntentCode },
    "id": "node-add-1",
    "name": "Detect Intent & Create Record",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [1700, 480]
  },
  {
    "parameters": {
      "conditions": {
        "boolean": [
          {
            "value1": "={{ $json.create_record }}",
            "value2": true
          }
        ]
      }
    },
    "id": "node-add-2",
    "name": "Should Write Record?",
    "type": "n8n-nodes-base.if",
    "typeVersion": 1,
    "position": [1750, 280]
  },
  {
    "parameters": {
      "dataType": "string",
      "value1": "={{ $json.record_type }}",
      "rules": {
        "rules": [
          { "value2": "order" },
          { "value2": "appointment" },
          { "value2": "lead" }
        ]
      }
    },
    "id": "node-add-3",
    "name": "Route by Record Type",
    "type": "n8n-nodes-base.switch",
    "typeVersion": 1,
    "position": [1850, 100]
  },
  {
    "parameters": {
      "method": "POST",
      "url": "https://ldtqnpenpobmqqvdrbmq.supabase.co/rest/v1/orders",
      "sendHeaders": true,
      "headerParameters": {
        "parameters": [
          { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Content-Type", "value": "application/json" },
          { "name": "Prefer", "value": "resolution=merge-duplicates,return=representation" }
        ]
      },
      "sendBody": true,
      "bodyParameters": {
        "parameters": [
          { "name": "", "value": "={{ JSON.stringify($json.record_data) }}" }
        ]
      },
      "contentType": "raw",
      "rawContentType": "application/json",
      "body": "={{ JSON.stringify($json.record_data) }}"
    },
    "id": "node-add-4a",
    "name": "Insert Order",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [2050, -50],
    "continueOnFail": true
  },
  {
    "parameters": {
      "method": "POST",
      "url": "https://ldtqnpenpobmqqvdrbmq.supabase.co/rest/v1/appointments",
      "sendHeaders": true,
      "headerParameters": {
        "parameters": [
          { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Content-Type", "value": "application/json" },
          { "name": "Prefer", "value": "resolution=merge-duplicates,return=representation" }
        ]
      },
      "sendBody": true,
      "contentType": "raw",
      "rawContentType": "application/json",
      "body": "={{ JSON.stringify($json.record_data) }}"
    },
    "id": "node-add-4b",
    "name": "Insert Appointment",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [2050, 100],
    "continueOnFail": true
  },
  {
    "parameters": {
      "method": "POST",
      "url": "https://ldtqnpenpobmqqvdrbmq.supabase.co/rest/v1/leads",
      "sendHeaders": true,
      "headerParameters": {
        "parameters": [
          { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Content-Type", "value": "application/json" },
          { "name": "Prefer", "value": "resolution=merge-duplicates,return=representation" }
        ]
      },
      "sendBody": true,
      "contentType": "raw",
      "rawContentType": "application/json",
      "body": "={{ JSON.stringify($json.record_data) }}"
    },
    "id": "node-add-4c",
    "name": "Insert Lead",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [2050, 250],
    "continueOnFail": true
  },
  {
    "parameters": {
      "method": "POST",
      "url": "https://ldtqnpenpobmqqvdrbmq.supabase.co/rest/v1/conversation_context",
      "sendHeaders": true,
      "headerParameters": {
        "parameters": [
          { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Content-Type", "value": "application/json" },
          { "name": "Prefer", "value": "resolution=merge-duplicates" }
        ]
      },
      "sendBody": true,
      "contentType": "raw",
      "rawContentType": "application/json",
      "body": "={{ JSON.stringify({\n  conversation_id: $('Detect Intent & Create Record').first().json.conversation_id || $('Extract AI Reply').first().json.conversation_id || $json.conversation_id,\n  tenant_id: $json.tenant_id,\n  context_type: 'chat',\n  last_intent: $('Detect Intent & Create Record').first().json.detected_intent,\n  context_data: {\n    extracted_info: $json.record_data || {},\n    updated_at: new Date().toISOString()\n  },\n  updated_at: new Date().toISOString()\n}) }}"
    },
    "id": "node-add-5",
    "name": "Update Context",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [2250, 100],
    "continueOnFail": true
  },
  {
    "parameters": {
      "conditions": {
        "boolean": [
          {
            "value1": "={{ $json.needs_human_handoff }}",
            "value2": true
          }
        ]
      }
    },
    "id": "node-add-6",
    "name": "Human Handoff?",
    "type": "n8n-nodes-base.if",
    "typeVersion": 1,
    "position": [1750, 700]
  },
  {
    "parameters": {
      "method": "PATCH",
      "url": "=https://ldtqnpenpobmqqvdrbmq.supabase.co/rest/v1/conversations?id=eq.{{ $json.conversation_id }}",
      "sendHeaders": true,
      "headerParameters": {
        "parameters": [
          { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
          { "name": "Content-Type", "value": "application/json" }
        ]
      },
      "sendBody": true,
      "contentType": "raw",
      "rawContentType": "application/json",
      "body": "={{ JSON.stringify({ status: 'pending', bot_enabled: false }) }}"
    },
    "id": "node-add-7",
    "name": "Mark Convo Pending",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [2050, 700],
    "continueOnFail": true
  }
];

wf.nodes.push(...newNodes);

// Now patch connections
// Disconnect Extract AI Reply from Prepare Conversation Body
wf.connections["Extract AI Reply"] = {
  "main": [
    [ { "node": "Detect Intent & Create Record", "type": "main", "index": 0 } ]
  ]
};

wf.connections["Detect Intent & Create Record"] = {
  "main": [
    [ 
      { "node": "Should Write Record?", "type": "main", "index": 0 },
      { "node": "Human Handoff?", "type": "main", "index": 0 }
    ]
  ]
};

wf.connections["Should Write Record?"] = {
  "main": [
    [ { "node": "Route by Record Type", "type": "main", "index": 0 } ],
    [ { "node": "Prepare Conversation Body", "type": "main", "index": 0 } ]
  ]
};

wf.connections["Route by Record Type"] = {
  "main": [
    [ { "node": "Insert Order", "type": "main", "index": 0 } ],
    [ { "node": "Insert Appointment", "type": "main", "index": 0 } ],
    [ { "node": "Insert Lead", "type": "main", "index": 0 } ]
  ]
};

wf.connections["Insert Order"] = {
  "main": [ [ { "node": "Update Context", "type": "main", "index": 0 } ] ]
};
wf.connections["Insert Appointment"] = {
  "main": [ [ { "node": "Update Context", "type": "main", "index": 0 } ] ]
};
wf.connections["Insert Lead"] = {
  "main": [ [ { "node": "Update Context", "type": "main", "index": 0 } ] ]
};

wf.connections["Update Context"] = {
  "main": [ [ { "node": "Prepare Conversation Body", "type": "main", "index": 0 } ] ]
};

wf.connections["Human Handoff?"] = {
  "main": [
    [ { "node": "Mark Convo Pending", "type": "main", "index": 0 } ]
  ]
};

// And we must ensure Prepare Conversation Body receives data from Update Context / Should Write Record? (False). 
// The existing connection Prepare Conversation Body -> Upsert Conversation is fine.

// Also patch the URLs in the existing nodes to use environment variables to make it clean
for (let n of wf.nodes) {
  if (n.name === "Search Knowledge Base" || n.name === "Upsert Conversation" || n.name === "Save Messages") {
    n.parameters.url = n.parameters.url.replace("YOUR_SUPABASE_URL", "ldtqnpenpobmqqvdrbmq.supabase.co");
    // Also use $env.SUPABASE_SERVICE_ROLE_KEY
    if (n.parameters.headerParameters && n.parameters.headerParameters.parameters) {
      for (let param of n.parameters.headerParameters.parameters) {
        if (param.name === "apikey" || param.name === "Authorization") {
          if (param.value.includes("YOUR_SUPABASE_SERVICE_ROLE_KEY")) {
             param.value = param.value.replace("YOUR_SUPABASE_SERVICE_ROLE_KEY", "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}");
          }
        }
      }
    }
  }
}

fs.writeFileSync(v4Path, JSON.stringify(wf, null, 2));
console.log("Written " + v4Path);
