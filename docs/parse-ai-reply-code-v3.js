const inputJson = $input.first().json;

// ── 1. Extract AI reply ──
let aiReply = '';
if (typeof inputJson.output === 'string') {
    aiReply = inputJson.output;
} else if (Array.isArray(inputJson.output) && inputJson.output[0]?.content?.[0]?.text) {
    aiReply = inputJson.output[0].content[0].text;
} else if (Array.isArray(inputJson.output) && typeof inputJson.output[0]?.text === 'string') {
    aiReply = inputJson.output[0].text;
} else if (inputJson.output?.content?.[0]?.text) {
    aiReply = inputJson.output.content[0].text;
} else if (inputJson.output?.text) {
    aiReply = inputJson.output.text;
} else if (inputJson.choices?.[0]?.message?.content) {
    aiReply = inputJson.choices[0].message.content;
} else if (inputJson.message?.content) {
    aiReply = inputJson.message.content;
} else if (inputJson.text) {
    aiReply = inputJson.text;
} else if (inputJson.response?.text) {
    aiReply = inputJson.response.text;
} else {
    aiReply = 'Maafi chahta hoon, main is waqt jawab nahi de sakta. Thodi der baad dobara try karein.';
}

const d = $('System Prompt Code').first().json;
const niche = d.niche;
const msg = d.message_text || '';
const msgLower = msg.toLowerCase();
const intent = d.detected_intent;

// ── 2. Restore previous extracted info ──
const previousInfo = d.existing_context?.context_data?.extracted_info || {};

let createRecord = false;
let recordType = null;
let recordData = { ...previousInfo };

// ═══════════════════════════════════════════════════════════════
// ECOMMERCE / RESTAURANT
// ═══════════════════════════════════════════════════════════════
if (['ecommerce', 'restaurant'].includes(niche)) {
  // FIX: product_inquiry now ALWAYS triggers extraction so items are captured on msg 1
  // Previously, if customer said "I want X" (product_inquiry) with no existing order,
  // extraction was skipped → by the time address arrived, previousInfo.items was empty → "Item from chat"
  const orderTriggerIntents = ['product_inquiry', 'order_placement', 'address_provided', 'order_confirmed', 'cod_request'];
  const shouldCreateOrder = orderTriggerIntents.includes(intent);

  if (shouldCreateOrder) {
    createRecord = true;
    recordType = 'order';

    // ── Item extraction ──
    let extractedItems = [];
    const cleanName = s => s.trim().replace(/\s+/g, ' ').replace(/^(i want|mujhe|muje|mjhe|chahiye|chahie|chaie|order|please|kindly)\s+/gi, '').trim();

    const patA = /(\d+)\s*(?:pack|packs|piece|pieces|pcs|pc|item|items|x)\s+(?:of\s+)?([a-zA-Z0-9][a-zA-Z0-9\s\-\.]{2,50}?)(?=\s*(?:chaie|chahiye|chahie|order|deliver|pkr|rs|\.|,|$|\n))/gi;
    const patB = /([a-zA-Z0-9][a-zA-Z0-9\s\-\.]{2,50}?)\s+(\d+)\s*(?:pack|packs|piece|pieces|pcs|pc|item|items|x)(?:\s|$|,)/gi;
    const patC = /(?:i\s+want|i\s+need|i\s+would\s+like|send\s+me|give\s+me)\s+([a-zA-Z0-9][a-zA-Z0-9\s\-\.]{1,50}?)\s+(\d+)\s*(?:pack|packs|piece|pieces|pcs|pc|item|items)/gi;
    const patD = /(?:mujhe|muje|mjhe|mjhay)\s+([a-zA-Z0-9][a-zA-Z0-9\s\-\.]{2,50}?)(?:\s+chaie|\s+chahiye|\s+chahie|\s+chahiyen|\s+lena|\s+order)/gi;
    const patE = /(\d+)\s*(?:pack|packs|piece|pieces|pcs|pc|item|items)\s+([a-zA-Z0-9][a-zA-Z0-9\s\-\.]{2,50})(?=\s|$|,)/gi;

    // FIX: Unrolled loop avoids TypeScript's 'RegExp | number' type error on lastIndex
    // Pattern C: "I want ITEM QTY packs"
    patC.lastIndex = 0;
    const matchesC = [...msg.matchAll(patC)];
    if (matchesC.length > 0) {
      extractedItems = matchesC.map(m => ({ name: cleanName(m[1] || ''), qty: parseInt(m[2]) || 1, price: 0 })).filter(i => i.name.length > 1);
    }

    // Pattern A: "QTY packs of ITEM"
    if (extractedItems.length === 0) {
      patA.lastIndex = 0;
      const matchesA = [...msg.matchAll(patA)];
      if (matchesA.length > 0) {
        extractedItems = matchesA.map(m => ({ name: cleanName(m[2] || ''), qty: parseInt(m[1]) || 1, price: 0 })).filter(i => i.name.length > 1);
      }
    }

    // Pattern E: "QTY packs ITEM"
    if (extractedItems.length === 0) {
      patE.lastIndex = 0;
      const matchesE = [...msg.matchAll(patE)];
      if (matchesE.length > 0) {
        extractedItems = matchesE.map(m => ({ name: cleanName(m[2] || ''), qty: parseInt(m[1]) || 1, price: 0 })).filter(i => i.name.length > 1);
      }
    }

    // Pattern B: "ITEM QTY packs"
    if (extractedItems.length === 0) {
      patB.lastIndex = 0;
      const matchesB = [...msg.matchAll(patB)];
      if (matchesB.length > 0) {
        extractedItems = matchesB.map(m => ({ name: cleanName(m[1] || ''), qty: parseInt(m[2]) || 1, price: 0 })).filter(i => i.name.length > 1);
      }
    }

    if (extractedItems.length === 0) {
      patD.lastIndex = 0;
      const matches = [...msg.matchAll(patD)];
      if (matches.length > 0) {
        extractedItems = matches.map(m => ({
          name: cleanName(m[1] || ''),
          qty: 1,
          price: 0,
        })).filter(i => i.name.length > 1);
      }
    }

    // ── Price extraction from AI reply ──
    const unitPriceMatch = aiReply.match(/(?:PKR|Rs\.?|pkr)\s*([\d,]+)\s*(?:\/pack|\/piece|\/pcs|each)/i);
    const totalMatch = aiReply.match(/\*{0,2}[Tt]otal\*{0,2}\s*[:\-]\s*(?:PKR|Rs\.?|pkr)\s*([\d,]+)/i);

    let unitPrice = unitPriceMatch ? parseInt(unitPriceMatch[1].replace(/,/g, '')) : 0;
    let orderTotal = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : 0;

    if (extractedItems.length > 0) {
      if (unitPrice > 0) extractedItems[0].price = unitPrice;
      else if (orderTotal > 0 && extractedItems[0].qty > 0) {
        extractedItems[0].price = Math.round(orderTotal / extractedItems[0].qty);
      }
    }

    if (extractedItems.length > 0 && extractedItems[0].qty === 1) {
      const aiQtyMatch = aiReply.match(/[Qq]uantity\*{0,2}\s*[:\-]\s*(\d+)/);
      if (aiQtyMatch) extractedItems[0].qty = parseInt(aiQtyMatch[1]);
    }

    let currentItems = recordData.items || [];
    if (extractedItems.length > 0) {
      currentItems = extractedItems;
    }

    // ── Delivery address extraction ──
    let deliveryAddress = recordData.delivery_address || null;
    const combinedForAddr = msg + ' ' + aiReply;

    const addrLabelMatch = combinedForAddr.match(/(?:[Dd]elivery\s+[Aa]ddress|[Dd]eliver\s+to)\s*[:\-]?\s*([^\n,\.]{8,100})/i);
    let newAddress = null;
    if (addrLabelMatch && (!deliveryAddress || intent === 'address_provided')) {
      newAddress = addrLabelMatch[1].trim();
    } else if (!deliveryAddress) {
      const addrKeywords = /\b(dha|clifton|gulshan|phase|block|street|road|avenue|lane|sector|town|garden|colony|defence|bahria|nazimabad|korangi|malir|johar|askari|highway|rd\b)/i;
      const addrMatch = combinedForAddr.match(new RegExp(`[\\w\\s,\\.\\-\\/]{0,30}${addrKeywords.source}[\\w\\s,\\.\\-\\/]{0,40}`, 'i'));
      if (addrMatch) newAddress = addrMatch[0].trim();
    }

    if (newAddress) {
      deliveryAddress = newAddress;
    } else if (!deliveryAddress || deliveryAddress.length < 10) {
      const botAddressMatch = aiReply.match(/\*?Delivery\s+Address\*?\s*[:\-]\s*([^(\n]+)/i);
      if (botAddressMatch && !botAddressMatch[1].toLowerCase().includes('pending') && !botAddressMatch[1].toLowerCase().includes('not yet')) {
        deliveryAddress = botAddressMatch[1].replace(/[.!]+$/, '').trim();
      }
    }

    // ── Email extraction ──
    let customerEmail = recordData.customer_email || null;
    const emailMatch = msg.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    if (emailMatch) {
      customerEmail = emailMatch[1];
    } else if (!customerEmail) {
      const botEmailMatch = aiReply.match(/\*?[Ee]mail\*?\s*[:\-]\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      if (botEmailMatch) customerEmail = botEmailMatch[1];
    }

    // ── Payment method extraction ──
    let paymentMethod = recordData.payment_method || null;
    if (!paymentMethod) {
      const combined = msgLower + ' ' + aiReply.toLowerCase();
      if (/\bcod\b|cash\s+on\s+delivery/.test(combined)) paymentMethod = 'COD';
      else if (/easypaisa/.test(combined)) paymentMethod = 'Easypaisa';
      else if (/jazzcash/.test(combined)) paymentMethod = 'JazzCash';
      else if (/bank\s*transfer/.test(combined)) paymentMethod = 'Bank Transfer';
    }

    // ── Calculate total ──
    const calculatedTotal = orderTotal > 0
      ? orderTotal
      : currentItems.reduce((s, i) => s + ((i.price || 0) * (i.qty || 1)), 0);

    // ── Status logic ──
    // FIX: Also detect confirmation from AI reply text, not just customer intent
    // This handles cases where customer says 'COD' and AI says 'order confirm ho gaya'
    const aiConfirmed = /confirm ho gaya|order confirm|order placed|confirmed your order|order ki tayari|order accept/i.test(aiReply);

    let newStatus = recordData.status || 'pending_address';
    const hasAllFields = !!(deliveryAddress && paymentMethod && customerEmail);

    if (hasAllFields && (intent === 'order_confirmed' || aiConfirmed)) {
      newStatus = 'confirmed';
    } else if (hasAllFields) {
      newStatus = 'pending';
    } else if (deliveryAddress && paymentMethod) {
      newStatus = 'pending_email';
    } else if (deliveryAddress || customerEmail || paymentMethod || intent === 'address_provided') {
      newStatus = 'pending_address';
    } else {
      newStatus = ['confirmed', 'pending', 'processing'].includes(recordData.status)
        ? recordData.status
        : 'pending_address';
    }

    recordData = {
      ...recordData,
      tenant_id: d.tenant_id,
      conversation_id: d.conversation_id,
      customer_phone: d.customer_phone,
      customer_name: d.customer_name,
      niche: niche,
      items: currentItems.length > 0 ? currentItems : [{ name: 'Item from chat', qty: 1, price: 0 }],
      // FIX 1: Correct Supabase column name is 'order_amount', NOT 'total_amount'
      order_amount: calculatedTotal,
      payment_method: paymentMethod,
      delivery_address: deliveryAddress,
      customer_email: customerEmail,
      // FIX 2: Safe fallback so source is never null/undefined
      source: d.platform || d.source || 'whatsapp',
      handled_by: 'bot',
      status: newStatus,
    };

    if (intent === 'order_confirmed') {
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

    const timeMatch = (msg + ' ' + aiReply).match(/(\d{1,2})(:\d{2})?\s*(am|pm|AM|PM)/);
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

// ═══════════════════════════════════════════════════════════════
// REAL ESTATE
// ═══════════════════════════════════════════════════════════════
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
    if (bedMatch && !bedrooms) bedrooms = parseInt(bedMatch[1]);

    recordData = {
      ...recordData,
      tenant_id: d.tenant_id,
      conversation_id: d.conversation_id,
      customer_name: d.customer_name,
      customer_phone: d.customer_phone,
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

return [{
  json: {
    ...d,
    ai_reply: aiReply,
    create_record: createRecord,
    record_type: recordType,
    record_data: recordData,
  }
}];
