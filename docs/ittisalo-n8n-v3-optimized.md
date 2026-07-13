# Ittisalo — n8n Complete Setup Guide v3 (Optimized)
### Updated for Chat Memory Fixes and Token Optimization

---

## What Changed From v2 to v3 (Optimizations)

We identified two major issues in the v2 workflows:
1. **Chat History Loop / Amnesia:** The bot kept asking for the address or order details over and over. This happened because the AI was not persisting the *extracted* data across conversation turns. 
2. **High OpenAI Token Usage:** The system prompt was massive, injecting the entire knowledge base and the full conversation history on every single turn, costing too many tokens.

**v3 Fixes Applied:**
- **State Management (Memory):** We now save `extracted_info` into the `conversation_context` table and feed it back to the AI in the `PREVIOUSLY EXTRACTED INFORMATION` section of the prompt. This forces the AI to remember what it already collected.
- **Token Trimming:** We slice the conversation history to only the last 10 messages, trim the knowledge base articles to 1000 characters each, and instruct the AI to keep responses concise.
- **Context Merging:** In Node 10a, new extracted data is merged with the previous turn's data instead of overwriting it, creating a perfect memory loop.

*Note: The Supabase table schemas and DB webhooks remain exactly the same as v2. You only need to update the n8n workflows as shown below.*

---

## WORKFLOW 1: Ittisalo Master Message Handler (Optimized)

**Trigger webhook path:** `ittisalo-master`

---

### NODE 1: Webhook Trigger
```
Type: Webhook
Path: ittisalo-master
Method: POST
Authentication: Header Auth → Header Auth account (x-api-key)
Respond: When Last Node Finishes
Response Data: First Entry JSON
```

---

### NODE 2: Code — Validate + Unpack (OPTIMIZED)
```javascript
const body = $input.first().json;
if (!body.tenant_id || !body.message_text) {
  throw new Error('Invalid payload');
}

// TOKEN OPTIMIZATION 1: Limit conversation history to last 10 messages
const recentHistory = (body.conversation_history || []).slice(-10);

// TOKEN OPTIMIZATION 2: Limit KB size to prevent massive token usage
const trimmedKb = (body.knowledge_base || []).map(k => {
  return `[${(k.kb_type || 'KB').toUpperCase()}] ${k.title}:\n${k.content.substring(0, 1000)}`;
});

return [{
  json: {
    ...body,
    niche: body.niche || 'general',
    conversation_history_text: recentHistory
      .map(m => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n'),
    knowledge_base_text: trimmedKb.join('\n\n'),
  }
}];
```

---

### NODE 3: Switch — Route by Niche
```
Type: Switch
Value to switch on: {{ $json.niche }}

Output 0: ecommerce
Output 1: restaurant
Output 2: dental
Output 3: realestate
Output 4: salon
Output 5: clinic
Output 6: (fallback - everything else)
```

*(Nodes 4a through 4f and Node 5 are identical to v2. They simply fetch live data and Merge it back. See original doc for exact SQL/API calls).*

---

### NODE 6: Code — Intent Detection + Funnel Stage
*(This node remains identical to v2. It uses regex to detect intent like 'product_inquiry', 'address_provided', etc. and passes it to detected_intent)*

---

### NODE 7: Code — Build System Prompt (OPTIMIZED)
```javascript
const d = $input.first().json;
const nicheInstructions = {
  ecommerce:  'When taking an order, collect items and delivery address. If PREVIOUSLY EXTRACTED INFORMATION already contains the delivery address, DO NOT ask for it again. Confirm the order summary.',
  restaurant: 'When taking food orders, collect items and delivery address. If PREVIOUSLY EXTRACTED INFORMATION contains them, DO NOT ask again. Confirm the order.',
  dental:     'NEVER diagnose or prescribe. If date/time are in PREVIOUSLY EXTRACTED INFORMATION, do not ask again. Confirm appointment.',
  salon:      'When booking, confirm service, stylist, date, and time. Skip asking for details already in PREVIOUSLY EXTRACTED INFORMATION.',
  clinic:     'NEVER diagnose or prescribe. Skip asking for details already in PREVIOUSLY EXTRACTED INFORMATION.',
  realestate: 'Always qualify: ask budget, area, bedrooms. If already in PREVIOUSLY EXTRACTED INFORMATION, do not ask again.',
};

// MEMORY FIX 1: Retrieve previously extracted info so AI remembers!
const extractedInfo = d.existing_context?.context_data?.extracted_info || {};
const previousInfoText = Object.keys(extractedInfo).length > 0 
  ? JSON.stringify(extractedInfo, null, 2) 
  : 'None';

const systemPrompt = `You are ${d.agent_config.name}, an AI assistant for ${d.business_name}.

=== YOUR ROLE ===
${d.agent_config.prompt}

=== LIVE BUSINESS DATA ===
${d.live_data_context || 'No live data available.'}

=== KNOWLEDGE BASE ===
${d.knowledge_base_text || 'No knowledge base configured.'}

=== PREVIOUSLY EXTRACTED INFORMATION (CRITICAL: DO NOT ASK FOR THESE AGAIN) ===
${previousInfoText}

=== CONVERSATION HISTORY ===
${d.conversation_history_text || 'This is the start of the conversation.'}

=== NICHE-SPECIFIC INSTRUCTIONS ===
${nicheInstructions[d.niche] || 'Be helpful and professional.'}

=== RESPONSE RULES ===
- Reply in the same language the customer used (Urdu, Roman Urdu, or English)
- Keep responses concise and under 100 words to save tokens.
- Never make up information.
- If asked for a human agent, reply: "Zaroor! Main aapko abhi hamare team se connect kar raha hoon."
- Today is: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'full' })}`;

return [{ json: { ...d, final_system_prompt: systemPrompt } }];
```

---

### NODE 8: If — Skip AI if Human Handoff
*(Identical to v2)*

---

### NODE 9: OpenAI Chat (OPTIMIZED)
```
Type: OpenAI
Action: Message a model
Model: GPT-4O-MINI (Switch to mini to save massive tokens while keeping high logic)

Messages:
  Message 1: System -> {{ $json.final_system_prompt }}
  Message 2: User -> {{ $json.message_text }}

Options:
  Max Tokens: 250 (Reduced from 400)
  Temperature: 0.7
```

---

### NODE 10a: Code — Parse AI Reply + Extract Structured Data (OPTIMIZED)
```javascript
const aiReply = $input.first().json?.choices?.[0]?.message?.content
  || $input.first().json?.message?.content
  || 'Maafi chahta hoon, main is waqt jawab nahi de sakta. Thodi der baad dobara try karein.';

const d = $('Code — Build System Prompt').first().json;
const niche = d.niche;
const msg = d.message_text.toLowerCase();
const intent = d.detected_intent;

// MEMORY FIX 2: Preserve previous extracted info to fix the memory loop!
const previousInfo = d.existing_context?.context_data?.extracted_info || {};

let createRecord = false;
let recordType = null;
let recordData = { ...previousInfo }; // Start with previous data!

// ----------------------------------------------------
// ECOMMERCE / RESTAURANT
// ----------------------------------------------------
if (['ecommerce','restaurant'].includes(niche)) {
  if (['product_inquiry','order_placement','address_provided','order_confirmed'].includes(intent)) {
    createRecord = true;
    recordType = 'order';

    const itemPatterns = [
      /(\d+)\s*(piece|pcs|pc|item|x)\s+([a-zA-Z\s]+)/gi,
      /([a-zA-Z\s]+)\s+(size\s+[smlxl]+)/gi,
    ];
    let extractedItems = [];
    for (const pattern of itemPatterns) {
      const matches = [...msg.matchAll(pattern)];
      if (matches.length > 0) {
        extractedItems = matches.map(m => ({ name: m[0].trim(), qty: 1, price: 0 }));
        break;
      }
    }
    
    // Merge items instead of overwriting
    let currentItems = recordData.items || [];
    if (extractedItems.length > 0) {
       currentItems = [...currentItems, ...extractedItems];
    }

    recordData = {
      ...recordData,
      tenant_id: d.tenant_id,
      conversation_id: d.conversation_id,
      customer_phone: d.customer_phone,
      customer_name: d.customer_name,
      niche: niche,
      items: currentItems.length > 0 ? currentItems : (recordData.items || [{ name: 'Item from chat', qty: 1, price: 0 }]),
      status: recordData.status || (niche === 'restaurant' ? 'pending' : 'pending_address'),
      source: d.platform,
      handled_by: 'bot',
    };

    if (intent === 'address_provided') {
      recordData.status = 'pending';
      const addressKeywords = ['dha','clifton','gulshan','phase','block','street','road','karachi','house','makan','apartment','flat'];
      const words = msg.split(' ');
      const addrIdx = words.findIndex(w => addressKeywords.some(k => w.includes(k)));
      if (addrIdx >= 0) {
        recordData.delivery_address = words.slice(Math.max(0, addrIdx-2), addrIdx+6).join(' ');
      }
    }

    if (intent === 'order_confirmed') {
      recordData.status = 'confirmed';
      recordData.confirmed_at = new Date().toISOString();
    }
  }
}

// ----------------------------------------------------
// DENTAL / SALON / CLINIC
// ----------------------------------------------------
if (['dental','salon','clinic'].includes(niche)) {
  if (['booking_intent','appointment_confirmed'].includes(intent)) {
    createRecord = true;
    recordType = 'appointment';

    const timeMatch = (msg + ' ' + aiReply).match(/(\d{1,2})(:\d{2})?\s*(am|pm|AM|PM)/);
    const dayMatch = (msg + ' ' + aiReply).match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|kal|parso)/i);

    let apptDate = recordData.appointment_date || null;
    let apptTime = recordData.appointment_time || null;

    if (dayMatch && !apptDate) {
      const dayMap = { tomorrow: 1, kal: 1, parso: 2, monday:0,tuesday:1,wednesday:2,thursday:3,friday:4,saturday:5,sunday:6 };
      const day = dayMatch[1].toLowerCase();
      if (['tomorrow','kal','parso'].includes(day)) {
        const d2 = new Date();
        d2.setDate(d2.getDate() + (dayMap[day] || 1));
        apptDate = d2.toISOString().split('T')[0];
      } else {
        const target = dayMap[day];
        const today = new Date().getDay();
        const diff = (target - today + 7) % 7 || 7;
        const d2 = new Date();
        d2.setDate(d2.getDate() + diff);
        apptDate = d2.toISOString().split('T')[0];
      }
    }

    if (timeMatch && !apptTime) {
      const hour = parseInt(timeMatch[1]);
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
      apptTime = `${String(hour24).padStart(2,'0')}:00:00`;
    }

    recordData = {
      ...recordData,
      tenant_id: d.tenant_id,
      conversation_id: d.conversation_id,
      patient_name: d.customer_name,
      patient_phone: d.customer_phone,
      niche: niche,
      service_type: recordData.service_type || 'Consultation',
      appointment_date: apptDate,
      appointment_time: apptTime,
      status: intent === 'appointment_confirmed' ? 'confirmed' : 'pending',
      is_new_patient: !d.existing_context,
    };
  }
}

// ----------------------------------------------------
// REAL ESTATE
// ----------------------------------------------------
if (niche === 'realestate') {
  if (['property_inquiry','requirement_provided','visit_request'].includes(intent)) {
    createRecord = true;
    recordType = 'lead';

    const budgetMatch = msg.match(/(\d+\.?\d*)\s*(crore|lakh|cr|lac)/i);
    let budgetMax = recordData.budget_max || null;
    if (budgetMatch && !budgetMax) {
      const num = parseFloat(budgetMatch[1]);
      const unit = budgetMatch[2].toLowerCase();
      budgetMax = ['crore','cr'].includes(unit) ? num * 10000000 : num * 100000;
    }

    const bedMatch = msg.match(/(\d+)\s*(bed|bedroom|br)/i);
    let bedrooms = recordData.bedrooms || null;
    if (bedMatch && !bedrooms) {
        bedrooms = parseInt(bedMatch[1]);
    }

    recordData = {
      ...recordData,
      tenant_id: d.tenant_id,
      conversation_id: d.conversation_id,
      customer_name: d.customer_name,
      customer_phone: d.customer_phone,
      intent: recordData.intent || (msg.includes('rent') ? 'rent' : msg.includes('sell') ? 'sell' : 'buy'),
      bedrooms: bedrooms,
      budget_max: budgetMax,
      stage: intent === 'visit_request' ? 'visit_scheduled' :
             intent === 'requirement_provided' ? 'qualified' : (recordData.stage || 'new_inquiry'),
      temperature: 'warm',
      last_activity_at: new Date().toISOString(),
    };
  }
}

return [{
  json: {
    ...d,
    ai_reply: aiReply,
    create_record: createRecord,
    record_type: recordType,
    record_data: recordData,
  }
}];
```

---

### NODE 11 to NODE 15
*(These remain identical to v2. They route the record to the correct Supabase table, upsert it, and save the AI reply)*

---

### NODE 16: HTTP Request — Update conversation_context (OPTIMIZED)
```
Type: HTTP Request
Method: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/conversation_context
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: resolution=merge-duplicates
Body: (Use Expression to safely pass JSON objects)
={{
  JSON.stringify({
    conversation_id: $json.conversation_id,
    tenant_id: $json.tenant_id,
    last_intent: $json.detected_intent,
    funnel_stage: $json.funnel_stage,
    context_data: {
      last_message: $json.message_text,
      last_ai_reply: $json.ai_reply,
      record_type: $json.record_type,
      written_id: $json.written_id,
      extracted_info: $json.record_data || {},
      updated_at: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  })
}}
```

---

### NODE 17 to NODE 22
*(These remain identical to v2. They check for human handoff and route the message via the Meta API to WhatsApp/Instagram/Messenger)*

---

## Conclusion
By saving `extracted_info` directly into Supabase's `conversation_context` table and feeding it back into the AI's prompt (`PREVIOUSLY EXTRACTED INFORMATION`), the bot will permanently remember the items, address, budget, or dates across conversation turns, completely eliminating the "amnesia loop" issue.

Additionally, trimming the Knowledge Base and slicing the conversation history to the last 10 messages will significantly reduce your OpenAI API token costs. Use `GPT-4O-MINI` to further drastically reduce the token cost per response.
