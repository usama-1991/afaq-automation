import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import ws from 'ws';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function processAIAgent(ctx) {
  try {
    console.log(`[AI-Agent] Processing message for conv_id: ${ctx.conversation_id}`);

    // 1. Generate Embedding for the message
    let embedding = [];
    try {
      const embedResp = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: ctx.normalized_message,
      });
      embedding = embedResp.data[0].embedding;
    } catch (e) {
      console.warn(`[AI-Agent] Embedding failed: ${e.message}`);
    }

    // 2. Search Knowledge Base
    let kbDocs = [];
    if (embedding.length > 0) {
      const { data: kbRes, error: kbErr } = await supabase.rpc('search_knowledge_base', {
        query_embedding: embedding,
        p_tenant_id: ctx.tenant_id,
        match_threshold: 0.10,
        match_count: 5
      });
      if (!kbErr && kbRes) {
        kbDocs = kbRes;
      }
    }

    // 2b. Search Products (if ecommerce)
    let productDocs = [];
    if (['ecommerce', 'restaurant', 'food_delivery'].includes(ctx.niche)) {
      const { data: prodRes, error: prodErr } = await supabase.rpc('search_products', {
        p_tenant_id: ctx.tenant_id,
        p_query: ctx.normalized_message || '',
        p_limit: 40
      });
      if (!prodErr && prodRes) {
        productDocs = prodRes;
      }
    }

    // 3. Assemble Context
    const kbEntries = kbDocs.length > 0
      ? kbDocs.map((kb, i) => `[${i + 1}] ${kb.title}:\n${kb.content}`).join('\n\n')
      : '';
      
    const productEntries = productDocs.length > 0
      ? productDocs.map(p => `- ${p.name} (Category: ${p.category || 'General'}) - Price: ${ctx.currency || 'USD'} ${p.price || 'Ask'} - Desc: ${p.description || 'N/A'}${p.image_url ? ` - Image: ${p.image_url}` : ''}${p.product_url ? ` - Link: ${p.product_url}` : ''}${p.external_product_id ? ` - ID: ${p.external_product_id}` : ''}`).join('\n')
      : '';

    let finalContext = '';
    if (kbEntries) finalContext += `=== GENERAL POLICIES & FAQS ===\n${kbEntries}\n\n`;

    const language = ctx.agent_language || 'ar';
    const nicheInstructions = {
      restaurant:    'You help customers with menu items, prices, opening hours, delivery, and reservations.',
      dental:        'You help patients with appointments, treatments, pricing, and clinic hours. Always recommend professional consultation.',
      real_estate:   'You help clients find properties, understand pricing, and arrange viewings.',
      salon:         'You help with bookings, services, available slots, and pricing.',
      ecommerce:     'You help with products, availability, orders, delivery, and returns.',
      food_delivery: 'You help with order tracking, menu items, delivery times, and issues.',
      medical:       'You help with appointments and general clinic information. Always recommend professional medical consultation.',
      general:       'You help customers with their inquiries professionally and helpfully.'
    };

    const languageInstructions = {
      ar: 'يجب أن تجيب باللغة العربية الفصحى أو بنفس لهجة العميل. اجعل ردودك طبيعية ودافئة.',
      ur: 'آپ کو اردو میں جواب دینا ہے۔ قدرتی اور دوستانہ زبان استعمال کریں۔',
      en: 'Reply in clear, warm, conversational English.'
    };

    let kbSection = kbEntries
      ? `KNOWLEDGE BASE (${kbDocs.length} relevant results):\n${kbEntries}\n\n`
      : 'KNOWLEDGE BASE: No specific policies found.\n\n';
      
    if (productEntries) {
      kbSection += `AVAILABLE PRODUCTS CATALOG (${productDocs.length} items):\n${productEntries}\n\nUse this catalog to suggest products and prices.`;
    } else if (['ecommerce', 'restaurant', 'food_delivery'].includes(ctx.niche)) {
      kbSection += 'AVAILABLE PRODUCTS: No specific products matched or catalog is empty. Ask the customer for details.';
    }

    // Check for existing order
    let existingOrder = null;
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('conversation_id', ctx.conversation_id)
      .neq('status', 'cancelled')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (orderData) existingOrder = orderData;

    let orderStateBlock = '';
    if (['ecommerce', 'restaurant', 'food_delivery'].includes(ctx.niche)) {
      if (existingOrder) {
        const items = Array.isArray(existingOrder.items) ? existingOrder.items : [];
        const itemsStr = items.length
          ? items.map(i => `${i.qty || 1}x ${i.name || 'item'}${i.price ? ` @ ${ctx.currency || 'USD'} ${i.price}` : ''}`).join(', ')
          : '(none yet)';

        orderStateBlock = [
          '--- CURRENT ORDER STATE (authoritative — trust this over anything implied by chat history) ---',
          `Items: ${itemsStr}`,
          `Order total: ${existingOrder.order_amount ? (ctx.currency || 'USD') + ' ' + existingOrder.order_amount : '(not yet calculated)'}`,
          `Delivery address: ${existingOrder.delivery_address || '(not yet provided)'}`,
          `Email: ${existingOrder.customer_email || '(not yet provided)'}`,
          `Payment method: ${existingOrder.payment_method || '(not yet provided)'}`,
          `Status: ${existingOrder.status || 'pending_address'}`,
          '',
          'Instructions for using this state:',
          '- Only ask the customer for fields above that are still "(not yet provided)".',
          '- NEVER ask again for a field that already has a value here, even if you cannot see it stated in the recent chat history.',
          '- If Status is "confirmed", do not re-ask anything — just acknowledge the order is already confirmed and help with anything new.',
          '- If all fields are filled and Status is not yet "confirmed", ask the customer to confirm the order.',
          '- If the customer names a clearly different product than the one listed above, treat it as a new order and ignore the old product/quantity (but you may reuse a previously given delivery address or payment method if the customer does not provide a new one).',
        ].join('\n');
      } else {
        orderStateBlock = '--- CURRENT ORDER STATE ---\nNo order in progress yet for this conversation.';
      }
    }

    const systemPrompt = [
      `You are the AI assistant for ${ctx.business_name}.`,
      `Business type: ${ctx.niche || 'general'}`,
      '',
      ctx.agent_prompt || `You are a helpful AI assistant for ${ctx.business_name}. Answer customer questions professionally.`,
      '',
      nicheInstructions[ctx.niche] || nicheInstructions.general,
      languageInstructions[language] || languageInstructions.en,
      '',
      '--- RULES ---',
      '1. Answer ONLY using the knowledge base content provided below.',
      '2. If the answer is not in the knowledge base, say you will connect the customer with a team member.',
      '3. NEVER invent prices, hours, availability, or contact details.',
      '4. Keep responses under 3 short paragraphs — be concise.',
      '5. Be warm, human, and conversational. Never sound robotic.',
      `6. Channel: ${ctx.platform}`,
      '7. When recommending or showing products, you MUST format EACH product exactly like this:\nTitle: [Product Name]\nPrice: [Price]\nLink: [Link]\nID: [ID]\n![Product Name](Image_URL)\n\nDo this for EVERY product you recommend so they are formatted beautifully. If you are listing categories, just list the category names.',
      '8. NEVER assume a payment method, address, or email. You MUST explicitly ask the customer for these details if they are "(not yet provided)".',
      '9. DO NOT say the order is confirmed if Address, Email, or Payment Method is still missing.',
      '10. Once ALL details are gathered, you MUST show the final summary and ask "Please reply with YES to confirm your order." DO NOT say the order is confirmed until the customer explicitly agrees.',
      '',
      orderStateBlock,
      '',
      kbSection,
      '',
      '--- MANDATORY ORDER SUMMARY ---',
      'If you are actively handling an order, you MUST summarize the details at the end of your reply (especially when asking for an email, address, payment method, or confirming).',
      'Always include the Unit Price if known. Use this exact format:',
      `*Product(s)*: [Qty]x [Item Name] @ ${ctx.currency || 'USD'} [Unit Price]`,
      `*Total Amount*: ${ctx.currency || 'USD'} [Total Amount]`,
      '*Delivery Address*: [Address or Pending]',
      '*Email*: [Email Address or Pending]',
      '*Payment Method*: [Method or Pending]',
      '',
      '--- MANDATORY INTENT TAG ---',
      'At the VERY END of your message, on a new line, you MUST append exactly ONE of these tags:',
      'Intent: general_inquiry (for questions)',
      'Intent: order_placed (wants to buy, needs details)',
      'Intent: address_provided (user gave address)',
      'Intent: order_confirmed (user confirmed final order)',
      'Intent: checkout_intent (asking how to pay)',
      'Intent: human_handoff (user asked for human)',
      'Example: [Your reply...] \n\nIntent: order_placed'
    ].join('\n');

    const messages = [{ role: 'system', content: systemPrompt }];
    
    // Add history
    const history = ctx.conversation_history || [];
    for (const msg of history) {
      if (msg.sender_type === 'customer') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.sender_type === 'bot') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }
    
    // Add current message
    messages.push({ role: 'user', content: ctx.normalized_message });

    // 4. Call GPT-4o-mini
    console.log(`[AI-Agent] Calling OpenAI for conv_id: ${ctx.conversation_id}`);
    // DEBUG LOG FOR SYSTEM PROMPT
    console.log(`[DEBUG] System Prompt: ${messages[0].content}`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const raw_reply = completion.choices[0].message.content;
    const prompt_tokens = completion.usage?.prompt_tokens || 0;
    const completion_tokens = completion.usage?.completion_tokens || 0;

    // 5. Parse Intent
    let ai_intent = 'general_inquiry';
    const intentMatch = raw_reply.match(/Intent:\s*([a-zA-Z0-9_]+)/i);
    if (intentMatch) {
      ai_intent = intentMatch[1].toLowerCase();
    }
    const ai_reply = raw_reply.replace(/Intent:.*$/im, '').trim();
    
    console.log(`[AI-Agent] AI Intent: ${ai_intent}`);

    // 5b. Detect Intent & Create Record
    const msg = ctx.normalized_message || '';
    const msgLower = msg.toLowerCase();
    let previousInfo = existingOrder || {};
    const previousOrderFinished = previousInfo.status && ['confirmed', 'cancelled', 'completed'].includes(previousInfo.status);
    
    let createRecord = false;
    let recordType = null;
    let recordData = previousOrderFinished || Object.keys(previousInfo).length === 0
      ? {}
      : JSON.parse(JSON.stringify(previousInfo));

    const niche = ctx.niche || 'general';

    if (['ecommerce', 'restaurant', 'food_delivery'].includes(niche)) {
      const orderTriggerIntents = ['product_inquiry', 'order_placed', 'address_provided', 'order_confirmed', 'checkout_intent'];
      const hasActiveOrder = Object.keys(recordData).length > 0;
      const isOrderIntent = orderTriggerIntents.includes(ai_intent);
      
      if (isOrderIntent || hasActiveOrder) {
        createRecord = true;
        recordType = 'order';

        let extractedItems = [];
        const cleanName = s => s.trim().replace(/\s+/g, ' ').replace(/^(i want|mujhe|muje|mjhe|chahiye|chahie|chaie|order|to order|buy|to buy|please|kindly|for|packs of|pack of|pieces of|piece of)\s+/gi, '').trim();

        const aiProductMatch = ai_reply.match(/\*[Pp]roduct(?:s|\(s\))?\*\s*[:\-]\s*([^\n]+)/);
        const aiQtyMatch = ai_reply.match(/\*[Qq]uantity\*\s*[:\-]\s*(\d+)/);
        
        const combinedForPrice = ai_reply + ' ' + msg;
        const unitPriceMatches = [...combinedForPrice.matchAll(/(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)\s*(?:per\s+pack|per\s+piece|each|\/pack|\/piece|\/pcs)|(?:price|costs)[\s\w]{0,15}(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)/gi)];
        let unitPrice = 0;
        if (unitPriceMatches.length > 0) {
           unitPrice = parseFloat((unitPriceMatches[0][1] || unitPriceMatches[0][2]).replace(/,/g, ''));
        }

        const totalMatches = [...ai_reply.matchAll(/(?:total(?:\s+amount)?|amount|bill)[\s\w]*?(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)/gi)];
        let orderTotal = 0;
        if (totalMatches.length > 0) {
          orderTotal = parseFloat(totalMatches[totalMatches.length - 1][1].replace(/,/g, ''));
        }

        const isAiValid = aiProductMatch && !/specify|which|unknown|missing|\?/i.test(aiProductMatch[1]);

        if (isAiValid) {
          let rawName = aiProductMatch[1];
          let parsedQty = 1;
          
          const inlinePriceMatch = rawName.match(/@\s*(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)/i);
          if (inlinePriceMatch) {
            unitPrice = parseFloat(inlinePriceMatch[1].replace(/,/g, ''));
            rawName = rawName.replace(/@\s*(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)/i, '').trim();
          }

          const inlineQtyMatch = rawName.match(/^(\d+)[xX]\s*(.*)/);
          if (inlineQtyMatch) {
            parsedQty = parseInt(inlineQtyMatch[1]);
            rawName = inlineQtyMatch[2];
          } else if (aiQtyMatch) {
            parsedQty = parseInt(aiQtyMatch[1]);
          }
          
          extractedItems = [{ 
            name: cleanName(rawName).replace(/[.,]$/, ''),
            qty: parsedQty, 
            price: unitPrice 
          }];
        } else {
          const patA = /(\d+)\s*(?:pack|packs|piece|pieces|pcs|pc|item|items|x)\s+(?:of\s+)?([a-zA-Z0-9][a-zA-Z0-9\s\-\.\s]{2,50}?)(?=\s*(?:chaie|chahiye|chahie|order|deliver|pkr|rs|\.|,|$|\n))/gi;
          const patC = /(?:i\s+want(?:\s+to)?(?:\s+order)?|i\s+need(?:\s+to)?(?:\s+order)?|i\s+would\s+like|send\s+me|give\s+me|order)\s+([a-zA-Z0-9][a-zA-Z0-9\s\-\.\s]{1,50}?)\s+(\d+)\s*(?:pack|packs|piece|pieces|pcs)/gi;
          const patD = /(?:mujhe|muje|mjhe|mjhay)\s+([a-zA-Z0-9][a-zA-Z0-9\s\-\.\s]{2,50}?)(?:\s+chaie|\s+chahiye|\s+chahie|\s+chahiyen|\s+lena|\s+order)/gi;
          const patE = /(?:product|item)\s*[:\-]?\s*([a-zA-Z0-9][a-zA-Z0-9\s\-\.\s]{2,50}?)\s+(\d+)\s*(?:pack|packs|piece|pieces|pcs)/gi;

          patE.lastIndex = 0;
          const matchesE = [...msg.matchAll(patE)];
          if (matchesE.length > 0) extractedItems = matchesE.map(m => ({ name: cleanName(m[1] || ''), qty: parseInt(m[2]) || 1, price: 0 }));

          if (extractedItems.length === 0) {
            patA.lastIndex = 0;
            const matchesA = [...msg.matchAll(patA)];
            if (matchesA.length > 0) extractedItems = matchesA.map(m => ({ name: cleanName(m[2] || ''), qty: parseInt(m[1]) || 1, price: 0 }));
          }

          if (extractedItems.length === 0) {
            patC.lastIndex = 0;
            const matchesC = [...msg.matchAll(patC)];
            if (matchesC.length > 0) extractedItems = matchesC.map(m => ({ name: cleanName(m[1] || ''), qty: parseInt(m[2]) || 1, price: 0 }));
          }
          
          if (extractedItems.length === 0) {
            patD.lastIndex = 0;
            const matchesD = [...msg.matchAll(patD)];
            if (matchesD.length > 0) extractedItems = matchesD.map(m => ({ name: cleanName(m[1] || ''), qty: 1, price: 0 }));
          }
        }

        const previousUnitPrice = (Array.isArray(previousInfo.items) && previousInfo.items[0] && previousInfo.items[0].price > 0)
          ? previousInfo.items[0].price
          : 0;

        if (extractedItems.length > 0) {
          if (unitPrice > 0) {
            extractedItems[0].price = unitPrice;
          } else if (orderTotal > 0 && extractedItems[0].qty > 0) {
            extractedItems[0].price = Math.round(orderTotal / extractedItems[0].qty);
          } else if (previousUnitPrice > 0) {
            extractedItems[0].price = previousUnitPrice;
          }
        }

        const previousOrderTotal = previousInfo.order_amount || 0;
        if (orderTotal === 0 && previousOrderTotal > 0) {
          orderTotal = previousOrderTotal;
        }

        let currentItems = [];
        if (extractedItems.length > 0) {
          currentItems = extractedItems;
        } else if (Array.isArray(previousInfo.items) && previousInfo.items.length > 0 && !previousInfo.items[0].name.includes('specify') && previousInfo.items[0].name !== 'Pending items' && previousInfo.items[0].name !== 'order') {
          currentItems = previousInfo.items;
        } else {
          currentItems = [{ name: 'Pending items', qty: 1, price: 0 }];
        }

        let deliveryAddress = recordData.delivery_address || null;
        const combinedForAddr = msg;
        const addrLabelMatch = combinedForAddr.match(/(?:[Dd]elivery\s+[Aa]ddress|[Dd]eliver\s+to|address(?: is)?|address to this)\s*[:\-]?\s*([^\n]{8,100})/i);
        
        let newAddress = null;
        if (addrLabelMatch) {
          newAddress = addrLabelMatch[1].replace(/[.!]+$/, '').trim();
        } else if (ai_intent === 'address_provided' || !deliveryAddress) {
          const addrKeywords = /\b(dha|clifton|gulshan|phase|block|street|road|avenue|lane|sector|town|garden|colony|defence|bahria|nazimabad|korangi|malir|johar|askari|highway|rd\b)/i;
          const addrMatch = combinedForAddr.match(new RegExp(`[\\w\\s,\\.\\-\\/]{0,30}${addrKeywords.source}[^\\n\\.!]{0,40}`, 'i'));
          if (addrMatch) newAddress = addrMatch[0].trim();
        }

        if (newAddress) {
          deliveryAddress = newAddress;
        } else if (!deliveryAddress || deliveryAddress.length < 10) {
          const botAddressMatch = ai_reply.match(/\*?Delivery\s+Address\*?\s*[:\-]\s*([^(\n]+)/i);
          if (botAddressMatch && !botAddressMatch[1].toLowerCase().includes('pending') && !botAddressMatch[1].toLowerCase().includes('not yet')) {
            deliveryAddress = botAddressMatch[1].replace(/[.!]+$/, '').trim();
          }
        }

        let customerEmail = recordData.customer_email || null;
        const emailMatch = msg.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
        if (emailMatch) {
          customerEmail = emailMatch[1];
        } else if (!customerEmail) {
          const botEmailMatch = ai_reply.match(/\*?[Ee]mail\*?\s*[:\-]\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
          if (botEmailMatch) customerEmail = botEmailMatch[1];
        }
        
        let paymentMethod = recordData.payment_method || null;
        if (!paymentMethod || ai_intent === 'checkout_intent') {
          // Extract primarily from the customer message to prevent AI hallucinations locking in a method
          const customerMsgLower = msgLower;
          if (/\bcod\b|cash\s+on\s+delivery/.test(customerMsgLower)) paymentMethod = 'COD';
          else if (/easypaisa/.test(customerMsgLower)) paymentMethod = 'Easypaisa';
          else if (/jazzcash/.test(customerMsgLower)) paymentMethod = 'JazzCash';
          else if (/bank\s*transfer/.test(customerMsgLower)) paymentMethod = 'Bank Transfer';
          
          // Fallback: check AI reply ONLY IF it explicitly states "*Payment Method*: COD" in the summary
          if (!paymentMethod) {
            const aiSummaryMatch = ai_reply.match(/\*?[Pp]ayment\s+Method\*?\s*[:\-]\s*([^\n]+)/i);
            if (aiSummaryMatch) {
              const pm = aiSummaryMatch[1].toLowerCase();
              if (!pm.includes('pending') && !pm.includes('not yet provided')) {
                if (pm.includes('cod') || pm.includes('cash on delivery')) paymentMethod = 'COD';
                else if (pm.includes('easypaisa')) paymentMethod = 'Easypaisa';
                else if (pm.includes('jazzcash')) paymentMethod = 'JazzCash';
                else if (pm.includes('bank transfer')) paymentMethod = 'Bank Transfer';
              }
            }
          }
        }

        const calculatedTotal = orderTotal > 0 ? orderTotal : currentItems.reduce((s, i) => s + ((i.price || 0) * (i.qty || 1)), 0);

        const customerConfirmed = /^\s*(confirm(ed)?|order\s*karain|haan\s*confirm|yes,?\s*confirm|yes\s*proceed|yes|yeah|yep|sure|y)\s*[.!]?\s*$/i.test(msg.trim());
        const aiConfirmed = /confirm ho gaya|order confirm|order placed|confirmed your order|order ki tayari|order accept|finalize your order|Your order is confirmed/i.test(ai_reply);

        let newStatus = recordData.status || 'pending_address';
        const hasAllFields = !!(deliveryAddress && paymentMethod && customerEmail);

        if (hasAllFields && (ai_intent === 'order_confirmed' || aiConfirmed || customerConfirmed)) {
          newStatus = 'confirmed';
        } else if (hasAllFields) {
          newStatus = 'pending';
        } else if (deliveryAddress || customerEmail || paymentMethod || ai_intent === 'address_provided' || ai_intent === 'checkout_intent') {
          newStatus = 'pending_address';
        } else {
          newStatus = 'pending_address';
        }
        
        recordData = {
          ...recordData,
          tenant_id: ctx.tenant_id,
          conversation_id: ctx.conversation_id,
          customer_phone: ctx.customer_phone,
          customer_name: ctx.customer_name,
          customer_email: customerEmail,
          niche: niche,
          items: currentItems,
          order_amount: calculatedTotal,
          payment_method: paymentMethod,
          delivery_address: deliveryAddress,
          source: ctx.platform || 'whatsapp',
          handled_by: 'bot',
          status: newStatus,
          currency: ctx.currency || 'USD',
          updated_at: new Date().toISOString()
        };

        if (newStatus === 'confirmed') {
          recordData.confirmed_at = new Date().toISOString();
        }
      }
    }

    if (['dental', 'salon', 'clinic'].includes(niche)) {
      if (['booking_intent', 'appointment_confirmed'].includes(ai_intent)) {
        createRecord = true;
        recordType = 'appointment';

        const timeMatch = (msg + ' ' + ai_reply).match(/(\d{1,2})(:\d{2})?\s*(am|pm|AM|PM)/);
        const dayMatch = (msg + ' ' + ai_reply).match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|kal|parso)/i);

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
          tenant_id: ctx.tenant_id,
          conversation_id: ctx.conversation_id,
          patient_name: ctx.customer_name,
          patient_phone: ctx.customer_phone,
          niche: niche,
          service_type: recordData.service_type || 'Consultation',
          appointment_date: apptDate,
          appointment_time: apptTime,
          status: ai_intent === 'appointment_confirmed' ? 'confirmed' : 'pending',
          is_new_patient: ctx.is_new_conversation,
        };
      }
    }

    if (niche === 'realestate') {
      if (['property_inquiry','requirement_provided','visit_request'].includes(ai_intent)) {
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
          tenant_id: ctx.tenant_id,
          conversation_id: ctx.conversation_id,
          customer_name: ctx.customer_name,
          customer_phone: ctx.customer_phone,
          intent: recordData.intent || (msgLower.includes('rent') ? 'rent' : msgLower.includes('sell') ? 'sell' : 'buy'),
          bedrooms,
          budget_max: budgetMax,
          stage: ai_intent === 'visit_request' ? 'visit_scheduled' :
                 ai_intent === 'requirement_provided' ? 'qualified' : (recordData.stage || 'new_inquiry'),
          temperature: 'warm',
          last_activity_at: new Date().toISOString(),
        };
      }
    }

    if (createRecord) {
      console.log(`[AI-Agent] Upserting ${recordType} record...`);
      let upsertedOrderId = null;
      
      if (recordType === 'order') {
        const { data: ord, error: ordErr } = await supabase.from('orders').upsert(recordData, { onConflict: 'conversation_id' }).select('id').single();
        if (ordErr) console.error("[AI-Agent] Order Upsert Error:", ordErr);
        if (ord) upsertedOrderId = ord.id;
      } else if (recordType === 'appointment') {
        const { error: apptErr } = await supabase.from('appointments').upsert(recordData, { onConflict: 'conversation_id' });
        if (apptErr) console.error("[AI-Agent] Appointment Upsert Error:", apptErr);
      } else if (recordType === 'lead') {
        const { error: leadErr } = await supabase.from('leads').upsert(recordData, { onConflict: 'conversation_id' });
        if (leadErr) console.error("[AI-Agent] Lead Upsert Error:", leadErr);
      }

      await supabase.from('conversation_context').upsert({
        conversation_id: ctx.conversation_id,
        tenant_id: ctx.tenant_id,
        context_type: 'chat',
        last_intent: ai_intent,
        context_data: { extracted_info: recordData, updated_at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      }, { onConflict: 'conversation_id' });
      
      // Trigger Ecommerce Sync if Order is Confirmed
      if (recordType === 'order' && recordData.status === 'confirmed' && upsertedOrderId) {
        const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
        const syncKey = process.env.ORDERS_SYNC_API_KEY || process.env.OPENAI_API_KEY; // Fallback so it at least tries
        
        if (dashboardUrl) {
           console.log(`[AI-Agent] Order confirmed! Triggering ecommerce sync to ${dashboardUrl}/api/orders/sync...`);
           fetch(`${dashboardUrl}/api/orders/sync`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'x-api-key': syncKey
             },
             body: JSON.stringify({ order_id: upsertedOrderId })
           }).catch(err => console.error(`[AI-Agent] Sync trigger failed:`, err));
        } else {
           console.warn(`[AI-Agent] Order confirmed, but DASHBOARD_URL is not set. Cannot trigger WooCommerce sync.`);
        }
      }
    }

    const needs_human_handoff = /human|agent|representative|insaan|baat|connect|transfer/i.test(msgLower);
    if (needs_human_handoff) {
       console.log(`[AI-Agent] Human handoff requested. Handing off...`);
       await supabase.from('conversations').update({ status: 'pending', bot_enabled: false }).eq('id', ctx.conversation_id);
    }

    // Insert bot message into DB
    await supabase.from('messages').insert({
      conversation_id: ctx.conversation_id,
      sender_type: 'bot',
      content: ai_reply,
      model_used: 'gpt-4o-mini',
      prompt_tokens,
      completion_tokens,
      kb_chunks_used: kbDocs.length,
      is_read: true
    });
    
    // Update conversation
    await supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: (ctx.normalized_message || '').slice(0, 100),
      updated_at: new Date().toISOString()
    }).eq('id', ctx.conversation_id);

    console.log(`[AI-Agent] Processing complete for conv_id: ${ctx.conversation_id}`);
    return { success: true, reply: ai_reply, intent: ai_intent };

  } catch (error) {
    console.error(`[AI-Agent] Error processing message:`, error);
  }
}
