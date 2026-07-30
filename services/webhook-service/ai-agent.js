import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { sendTenantNotification } from './fcm.js';
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
  const _reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  try {
    console.log(`[AI-Agent][${_reqId}] ▶ START processing for conv_id: ${ctx.conversation_id}, msg: "${(ctx.normalized_message || '').slice(0, 50)}"`);

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
      ? productDocs.map(p => `Title: ${p.name}\nCategory: ${p.category || 'General'}\nPrice: ${ctx.currency || 'USD'} ${p.price || 'Ask'}\nDesc: ${p.description || 'N/A'}${p.image_url ? `\nImage_URL: ${p.image_url}` : ''}${p.product_url ? `\nLink: ${p.product_url}` : ''}${p.external_product_id ? `\nID: ${p.external_product_id}` : ''}\n`).join('\n')
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
      : '';
      
    if (productEntries) {
      kbSection += `PRODUCT CATALOG (${productDocs.length} items — THIS IS PART OF YOUR KNOWLEDGE BASE, use it to answer product/category questions):\n${productEntries}\n\nUse this catalog to answer ALL product and category inquiries. You can list categories by grouping product categories from this catalog.`;
    } else if (['ecommerce', 'restaurant', 'food_delivery'].includes(ctx.niche)) {
      kbSection += 'AVAILABLE PRODUCTS: No specific products matched. Ask the customer for more details about what they are looking for.';
    }
    
    if (!kbEntries && !productEntries) {
      kbSection = 'KNOWLEDGE BASE: No specific policies found.\n\n';
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
          '- NEVER ask again for a field that already has a value here.',
          '- You MUST collect Delivery address, Email, and Payment method. DO NOT skip any of these.',
          '- If Status is "confirmed", do not re-ask anything — just acknowledge the order is already confirmed and help with anything new.',
          '- If all fields (address, email, payment) are filled and Status is not yet "confirmed", ask the customer to confirm the order.',
          '- If the customer names a clearly different product than the one listed above, treat it as a new order and ignore the old product/quantity.',
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
      '1. Answer using the knowledge base AND product catalog provided below. The product catalog IS your knowledge — use it to answer product questions, category questions, pricing, etc.',
      '2. If the customer asks about something NOT covered by the knowledge base AND NOT in the product catalog, say you will connect them with a team member.',
      '3. NEVER invent prices, hours, availability, or contact details.',
      '4. Keep responses under 3 short paragraphs — be concise.',
      '5. Be warm, human, and conversational. Never sound robotic.',
      `6. Channel: ${ctx.platform}`,
      '7. When showing products, present them in a clean, conversational list. NEVER dump raw technical data (do NOT print raw "ID:", "Category:", or "Image_URL:" text).',
      '8. FORMATTING RULES (CRITICAL):',
      '   - Use WhatsApp native formatting: Use *single asterisks* for bold text (e.g., *Price:*). NEVER use double asterisks (**).',
      '   - NEVER use Markdown for links or images (do NOT use [text](url) or ![alt](url)).',
      '   - Provide links and images as raw, clickable URLs on their own lines, optionally with an emoji (e.g., 🔗 *Link:* https://... or 🖼️ *Image:* https://...).',
      '9. CRITICAL: You MUST explicitly ask the customer for their Email Address, Delivery Address, and Payment Method if they are "(not yet provided)". DO NOT proceed to final confirmation until you have ALL THREE.',
      '10. DO NOT say the order is confirmed if Address, Email, or Payment Method is still missing.',
      '11. Once ALL details are gathered, you MUST show the final summary and ask the user to confirm their order using WhatsApp Buttons.',
      '12. INSTRUCTION FOR BUTTONS: Whenever you need the user to make a choice between 2 or 3 options (like Yes/No, or Cash/Card), you MUST present them as native WhatsApp buttons by prefixing your entire message with exactly this syntax:',
      '[Buttons: Option 1 | Option 2]',
      'Your normal message text goes here...',
      'Example for confirming an order: [Buttons: Yes, Confirm | No, Cancel] Please review your order summary below. Do you want to confirm?',
      '(Max 3 options. The options must be separated by the | character. Keep the button labels very short, max 20 chars).',
      '',
      orderStateBlock,
      '',
      kbSection,
      '',
      (ctx.niche === 'ecommerce' ? [
        '--- MANDATORY ORDER SUMMARY ---',
        'If you are actively handling an order, you MUST summarize the details at the end of your reply (especially when asking for an email, address, payment method, or confirming).',
        'Use EXACTLY this layout for the order summary (including emojis and formatting):',
        '',
        '✨ *Almost there! Please review your order details below:*',
        '',
        '🛒 *YOUR CART*',
        `• [Qty]x [Item Name] (${ctx.currency || 'USD'} [Unit Price] each)`,
        '',
        '💰 *PAYMENT SUMMARY*',
        `• Subtotal: ${ctx.currency || 'USD'} [Subtotal]`,
        `• Delivery: ${ctx.currency || 'USD'} [Delivery]`,
        `• *Total Due: ${ctx.currency || 'USD'} [Total Amount]*`,
        '',
        '📬 *DELIVERY DETAILS*',
        '• Address: [Address or Pending]',
        '• Email: [Email Address or Pending]',
        '• Method: [Method or Pending]',
        '',
        'Does everything look correct? 👇'
      ].join('\\n') : [
        '--- MANDATORY ORDER SUMMARY ---',
        'If you are actively handling an order, you MUST summarize the details at the end of your reply (especially when asking for an email, address, payment method, or confirming).',
        'Always include the Unit Price if known. Use this exact format:',
        `*Product(s)*: [Qty]x [Item Name] @ ${ctx.currency || 'USD'} [Unit Price]`,
        `*Total Amount*: ${ctx.currency || 'USD'} [Total Amount]`,
        '*Delivery Address*: [Address or Pending]',
        '*Email*: [Email Address or Pending]',
        '*Payment Method*: [Method or Pending]'
      ].join('\\n')),
      '',
      '--- MANDATORY INTENT TAG ---',
      'At the VERY END of your message, on a new line, you MUST append exactly ONE of these tags:',
      'Intent: general_inquiry (for questions)',
      'Intent: order_placed (wants to buy, needs details)',
      'Intent: address_provided (user gave address)',
      'Intent: order_confirmed (user confirmed final order)',
      'Intent: checkout_intent (asking how to pay)',
      'Intent: human_handoff (user asked for human)',
      'Intent: review_submitted (user is giving a product review or rating for a delivered order)',
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

    // 4. Call GPT-4o-mini with 8-second Circuit Breaker
    console.log(`[AI-Agent] Calling OpenAI for conv_id: ${ctx.conversation_id}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // Increased timeout to 25s

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }, { signal: controller.signal });
    } catch (err) {
      console.error(`[AI-Agent] OpenAI request failed or timed out: ${err.message}`);
      completion = {
        choices: [{ message: { content: "Our team has received your message and will reply shortly.\n\nIntent: human_handoff" } }],
        usage: { prompt_tokens: 0, completion_tokens: 0 }
      };
    } finally {
      clearTimeout(timeout);
    }

    const raw_reply = completion.choices[0].message.content;
    const prompt_tokens = completion.usage?.prompt_tokens || 0;
    const completion_tokens = completion.usage?.completion_tokens || 0;

    // 5. Parse Intent
    let ai_intent = 'general_inquiry';
    const intentMatch = raw_reply.match(/Intent:\s*([a-zA-Z0-9_]+)/i);
    if (intentMatch) {
      ai_intent = intentMatch[1].toLowerCase();
    }
    let ai_reply = raw_reply.replace(/Intent:.*$/im, '').trim();
    
    // Forcibly clean up any stubborn Markdown the AI might have still generated
    ai_reply = ai_reply
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '🖼️ $2') // Convert markdown images to raw URLs
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2') // Convert markdown links to plain text links
      .replace(/\*\*([^*]+)\*\*/g, '*$1*');          // Convert double asterisks to single asterisks

    
    console.log(`[AI-Agent] AI Intent: ${ai_intent}`);

    // 5b. Detect Intent & Create Record
    const msg = ctx.normalized_message || '';
    const msgLower = msg.toLowerCase();
    let previousInfo = existingOrder || {};
    const previousOrderFinished = previousInfo.status && ['confirmed', 'cancelled', 'completed', 'dispatched', 'delivered'].includes(previousInfo.status);
    
    let createRecord = false;
    let recordType = null;
    let recordData = previousOrderFinished || Object.keys(previousInfo).length === 0
      ? {}
      : JSON.parse(JSON.stringify(previousInfo));

    const niche = ctx.niche || 'general';

    if (['ecommerce', 'restaurant', 'food_delivery'].includes(niche)) {
      const orderTriggerIntents = ['order_placed', 'address_provided', 'order_confirmed', 'checkout_intent'];
      const hasActiveOrder = Object.keys(recordData).length > 0;
      const isOrderIntent = orderTriggerIntents.includes(ai_intent);
      
      if (isOrderIntent || hasActiveOrder) {
        createRecord = true;
        recordType = 'order';

        let extractedItems = [];
        const cleanName = s => s.trim().replace(/\s+/g, ' ').replace(/^(i want|mujhe|muje|mjhe|chahiye|chahie|chaie|order|to order|buy|to buy|please|kindly|for|packs of|pack of|pieces of|piece of)\s+/gi, '').trim();

        const aiProductMatch = ai_reply.match(/(?:\*[Pp]roduct(?:s|\(s\))?\*\s*[:\-]\s*|🛒\s*\*YOUR\s*CART\*\s*\n\s*•\s*)([^\n]+)/i);
        const aiQtyMatch = ai_reply.match(/\*[Qq]uantity\*\s*[:\-]\s*(\d+)/);
        
        const combinedForPrice = ai_reply + ' ' + msg;
        const unitPriceMatches = [...combinedForPrice.matchAll(/(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)\s*(?:per\s+pack|per\s+piece|each|\/pack|\/piece|\/pcs)|(?:price|costs)[\s\w]{0,15}(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)/gi)];
        let unitPrice = 0;
        if (unitPriceMatches.length > 0) {
           unitPrice = parseFloat((unitPriceMatches[0][1] || unitPriceMatches[0][2]).replace(/,/g, ''));
        }

        const totalMatches = [...ai_reply.matchAll(/(?:total(?:[_\s]*amount)?|amount|bill|total\s*due)\s*[:\-]?\s*(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)/gi)];
        let orderTotal = 0;
        if (totalMatches.length > 0) {
          orderTotal = parseFloat(totalMatches[totalMatches.length - 1][1].replace(/,/g, ''));
        }

        const isAiValid = aiProductMatch && !/specify|which|unknown|missing|\?/i.test(aiProductMatch[1]);

        if (isAiValid) {
          let rawName = aiProductMatch[1];
          let parsedQty = 1;
          
          const inlinePriceMatch = rawName.match(/(?:@|\()\s*(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)/i);
          if (inlinePriceMatch) {
            unitPrice = parseFloat(inlinePriceMatch[1].replace(/,/g, ''));
            rawName = rawName.replace(/(?:@|\()\s*(?:USD|\\$|PKR|Rs\\.?|pkr|AED|SAR|[A-Z]{3})\s*([\d,.]+)[^)]*\)?/i, '').trim();
          }

          const inlineQtyMatch = rawName.match(/^(\d+)\s*[xX]\s*(.*)/);
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

        // Enrich items with external_product_id from product catalog
        // This ensures WooCommerce push uses the CORRECT product ID instead of fuzzy search
        if (productDocs.length > 0) {
          currentItems = currentItems.map(item => {
            if (item.external_product_id) return item; // already has ID
            const itemNameLower = (item.name || '').toLowerCase().trim();
            // Try exact match first, then partial match
            let match = productDocs.find(p => (p.name || '').toLowerCase().trim() === itemNameLower);
            if (!match) {
              match = productDocs.find(p => {
                const pName = (p.name || '').toLowerCase().trim();
                return pName.includes(itemNameLower) || itemNameLower.includes(pName);
              });
            }
            if (match) {
              console.log(`[AI-Agent] Matched item "${item.name}" -> product "${match.name}" (ext_id: ${match.external_product_id})`);
              return {
                ...item,
                name: match.name, // Use the canonical product name
                external_product_id: match.external_product_id || null,
                price: (parseFloat(match.price) > 0) ? parseFloat(match.price) : (item.price > 0 ? item.price : 0)
              };
            }
            return item;
          });
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
          const botAddressMatch = ai_reply.match(/\*?(?:Delivery\s+Address|Address)\*?\s*[:\-]\s*([^(\n]+)/i);
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
            const aiSummaryMatch = ai_reply.match(/\*?(?:Payment\s+Method|Method)\*?\s*[:\-]\s*([^\n]+)/i);
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

        let calculatedTotal = currentItems.reduce((s, i) => s + ((i.price || 0) * (i.qty || 1)), 0);
        if (calculatedTotal === 0 && orderTotal > 0) {
          calculatedTotal = orderTotal;
        }
        const customerConfirmed = /^\s*(confirm(ed)?|order\s*karain|haan\s*confirm|yes,?\s*confirm|yes\s*proceed|yes|yeah|yep|sure|y)\s*[.!]?\s*$/i.test(msg.trim());
        const aiConfirmed = /confirm ho gaya|order confirm|order placed|confirmed your order|order ki tayari|order accept|finalize your order|Your order is confirmed/i.test(ai_reply);

        let newStatus = recordData.status || 'pending_address';
        const hasAllFields = !!(deliveryAddress && paymentMethod && customerEmail);

        if (hasAllFields && (ai_intent === 'order_confirmed' || aiConfirmed || customerConfirmed)) {
          newStatus = 'confirmed';
        } else if (hasAllFields) {
          newStatus = 'pending';
        } else if (deliveryAddress && paymentMethod) {
          newStatus = 'pending_email'; // if only missing email
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
      
      // Propagate customer email to conversation record for contact card display
      if (recordData.customer_email && ctx.conversation_id) {
        await supabase.from('conversations')
          .update({ customer_email: recordData.customer_email })
          .eq('id', ctx.conversation_id);
        console.log(`[AI-Agent] Updated conversation ${ctx.conversation_id} with email: ${recordData.customer_email}`);
      }
      
      // ── Direct WooCommerce Sync + Email (no cross-service HTTP needed) ──
      if (recordType === 'order' && recordData.status === 'confirmed' && upsertedOrderId) {
        (async () => {
          try {
            console.log(`[AI-Agent] Order ${upsertedOrderId} confirmed! Starting direct platform sync...`);

            // 1. Check if already synced
            const { data: currentOrder } = await supabase.from('orders').select('platform_order_id').eq('id', upsertedOrderId).single();
            if (currentOrder?.platform_order_id) {
              console.log(`[AI-Agent] Order ${upsertedOrderId} already synced. Skipping.`);
              return;
            }

            // 2. Fetch e-commerce platform credentials from integrations table
            let platformCreds = null;
            const { data: integrations } = await supabase
              .from('integrations')
              .select('platform, credentials')
              .eq('tenant_id', ctx.tenant_id)
              .in('platform', ['shopify', 'woocommerce', 'salla', 'zid'])
              .eq('is_active', true)
              .limit(1);

            if (integrations && integrations.length > 0) {
              platformCreds = integrations[0];
            } else {
              // Fallback: check integration_credentials table
              const { data: icreds } = await supabase
                .from('integration_credentials')
                .select('platform, credentials')
                .eq('tenant_id', ctx.tenant_id)
                .in('platform', ['shopify', 'woocommerce', 'salla', 'zid'])
                .eq('is_active', true)
                .limit(1);
              if (icreds && icreds.length > 0) platformCreds = icreds[0];
            }

            // 3. Push to WooCommerce/Shopify directly
            if (platformCreds && platformCreds.platform === 'woocommerce') {
              const creds = platformCreds.credentials;
              const storeUrl = (creds.site_url || creds.store_url || '').replace(/\/+$/, '');
              if (!storeUrl || !creds.consumer_key || !creds.consumer_secret) {
                console.error(`[AI-Agent] WooCommerce credentials incomplete for tenant ${ctx.tenant_id}. site_url=${storeUrl}`);
              } else {
                const authHeader = 'Basic ' + Buffer.from(`${creds.consumer_key}:${creds.consumer_secret}`).toString('base64');
                const nameParts = (recordData.customer_name || '').split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                // Resolve product IDs — prefer stored external_product_id, fallback to WC search
                const resolvedLineItems = await Promise.all(
                  (recordData.items || []).map(async item => {
                    let productId = null;

                    // Use stored external_product_id if available (from Supabase catalog match)
                    if (item.external_product_id) {
                      productId = parseInt(item.external_product_id);
                      if (isNaN(productId)) productId = null;
                      else console.log(`[AI-Agent] Using stored product ID ${productId} for "${item.name}"`);
                    }

                    // Fallback: search WooCommerce catalog by exact name
                    if (!productId && item.name) {
                      try {
                        const searchRes = await fetch(
                          `${storeUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(item.name)}&per_page=5`,
                          { headers: { Authorization: authHeader } }
                        );
                        if (searchRes.ok) {
                          const products = await searchRes.json();
                          if (products && products.length > 0) {
                            const exactMatch = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                            const partialMatch = products.find(p => p.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(p.name.toLowerCase()));
                            const bestMatch = exactMatch || partialMatch;
                            
                            if (bestMatch) {
                              productId = bestMatch.id;
                              console.log(`[AI-Agent] WC search matched "${item.name}" -> product ID ${productId} ("${bestMatch.name}")`);
                            } else {
                              console.log(`[AI-Agent] WC search returned results, but none matched "${item.name}". Safely falling back to feeLine.`);
                            }
                          }
                        }
                      } catch (e) { console.error('[AI-Agent] WC product search error:', e.message); }
                    }
                    return { product_id: productId, name: item.name || 'Product', quantity: item.qty || 1, total: String((item.price || 0) * (item.qty || 1)) };
                  })
                );

                const validLineItems = resolvedLineItems.filter(i => i.product_id !== null).map(i => ({ product_id: i.product_id, quantity: i.quantity, total: i.total }));
                const feeLines = resolvedLineItems.filter(i => i.product_id === null).map(i => ({ name: `${i.quantity}x ${i.name}`, total: i.total }));

                console.log(`[AI-Agent] Pushing order to WooCommerce at ${storeUrl}...`);
                const wcResponse = await fetch(`${storeUrl}/wp-json/wc/v3/orders`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: authHeader },
                  body: JSON.stringify({
                    status: 'processing',
                    payment_method: 'cod',
                    payment_method_title: 'Cash on Delivery',
                    set_paid: false,
                    currency: recordData.currency || ctx.currency || 'USD',
                    billing: { first_name: firstName, last_name: lastName, phone: recordData.customer_phone, email: recordData.customer_email || '', address_1: recordData.delivery_address || '' },
                    shipping: { first_name: firstName, last_name: lastName, address_1: recordData.delivery_address || '', phone: recordData.customer_phone },
                    line_items: validLineItems,
                    fee_lines: feeLines,
                    meta_data: [
                      { key: '_ittisalo_synced', value: 'true' },
                      { key: '_ittisalo_order_id', value: upsertedOrderId },
                      { key: '_ittisalo_source', value: recordData.source || 'whatsapp' },
                    ],
                  }),
                });

                if (wcResponse.ok) {
                  const wcData = await wcResponse.json();
                  const platformOrderId = String(wcData.id);
                  const platformOrderNumber = `#${wcData.number}`;
                  console.log(`[AI-Agent] ✅ WooCommerce order created: ${platformOrderNumber} (ID: ${platformOrderId})`);

                  await supabase.from('orders').update({
                    platform_source: 'woocommerce',
                    platform_order_id: platformOrderId,
                    platform_order_number: platformOrderNumber,
                    platform_synced_at: new Date().toISOString(),
                  }).eq('id', upsertedOrderId);
                } else {
                  const errBody = await wcResponse.text().catch(() => 'unknown');
                  console.error(`[AI-Agent] ❌ WooCommerce API error (${wcResponse.status}): ${errBody}`);
                }
              }
            } else if (platformCreds && platformCreds.platform === 'shopify') {
              // Shopify push
              const creds = platformCreds.credentials;
              const nameParts = (recordData.customer_name || '').split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';

              const shopifyRes = await fetch(`https://${creds.store_domain}/admin/api/2024-10/orders.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': creds.access_token },
                body: JSON.stringify({
                  order: {
                    line_items: (recordData.items || []).map(item => ({ title: item.name || 'Product', quantity: item.qty || 1, price: String(item.price || 0) })),
                    customer: { first_name: firstName, last_name: lastName, phone: recordData.customer_phone, ...(recordData.customer_email ? { email: recordData.customer_email } : {}) },
                    shipping_address: { first_name: firstName, last_name: lastName, address1: recordData.delivery_address || 'To be confirmed', phone: recordData.customer_phone, country: 'US' },
                    financial_status: 'pending', fulfillment_status: null,
                    note: `Created by Ittisalo CRM. Chat order via ${recordData.source || 'whatsapp'}. Ittisalo ID: ${upsertedOrderId}`,
                    tags: 'ittisalo-synced', send_receipt: false, send_fulfillment_receipt: false,
                  },
                }),
              });
              if (shopifyRes.ok) {
                const shopData = await shopifyRes.json();
                console.log(`[AI-Agent] ✅ Shopify order created: ${shopData.order.name}`);
                await supabase.from('orders').update({
                  platform_source: 'shopify', platform_order_id: String(shopData.order.id),
                  platform_order_number: shopData.order.name, platform_synced_at: new Date().toISOString(),
                }).eq('id', upsertedOrderId);
              } else {
                const errBody = await shopifyRes.text().catch(() => 'unknown');
                console.error(`[AI-Agent] ❌ Shopify API error (${shopifyRes.status}): ${errBody}`);
              }
            } else if (platformCreds && platformCreds.platform === 'salla') {
              // Salla push scaffolding
              const creds = platformCreds.credentials;
              console.log(`[AI-Agent] ⏳ Salla order sync triggered (Scaffolding). Token: ${creds.access_token ? 'Present' : 'Missing'}`);
              
              // Future: implement fetch to https://api.salla.dev/admin/v2/orders
              await supabase.from('orders').update({
                platform_source: 'salla', platform_order_id: `salla_stub_${Date.now()}`,
                platform_order_number: `#SLL-${Date.now()}`, platform_synced_at: new Date().toISOString(),
              }).eq('id', upsertedOrderId);
              console.log(`[AI-Agent] ✅ Salla order stub created.`);
              
            } else if (platformCreds && platformCreds.platform === 'zid') {
              // Zid push scaffolding
              const creds = platformCreds.credentials;
              console.log(`[AI-Agent] ⏳ Zid order sync triggered (Scaffolding). Token: ${creds.access_token ? 'Present' : 'Missing'}`);
              
              // Future: implement fetch to https://api.zid.sa/v1/managers/store/orders
              await supabase.from('orders').update({
                platform_source: 'zid', platform_order_id: `zid_stub_${Date.now()}`,
                platform_order_number: `#ZID-${Date.now()}`, platform_synced_at: new Date().toISOString(),
              }).eq('id', upsertedOrderId);
              console.log(`[AI-Agent] ✅ Zid order stub created.`);
              
            } else {
              console.log(`[AI-Agent] No e-commerce platform configured for tenant ${ctx.tenant_id}. Skipping platform push.`);
            }

            // 4. Send confirmation email via Resend
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey && recordData.customer_email) {
              const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
              const businessName = ctx.business_name || 'Ittisalo';
              const orderNumber = upsertedOrderId.slice(0, 8).toUpperCase();
              const currency = recordData.currency || ctx.currency || 'USD';
              const itemsHtml = (recordData.items || []).map(i =>
                `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px">${i.qty || 1}x ${i.name || 'Product'}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;text-align:right">${currency} ${i.price || 0}</td></tr>`
              ).join('');

              console.log(`[AI-Agent] Sending confirmation email to ${recordData.customer_email}...`);
              const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
                body: JSON.stringify({
                  from: `${businessName} <${fromEmail}>`,
                  to: recordData.customer_email,
                  subject: `Order Confirmed — ${orderNumber}`,
                  html: `<div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937"><div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px;border-radius:16px 16px 0 0;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">Order Confirmed ✅</h1><p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Thank you for your order, ${recordData.customer_name || 'Customer'}!</p></div><div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none"><div style="background:#fef2f2;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center"><span style="font-size:13px;color:#991b1b;font-weight:600">Order Number</span><div style="font-size:28px;font-weight:800;color:#dc2626;margin-top:4px">${orderNumber}</div></div><h3 style="font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px">Items Ordered</h3><table style="width:100%;border-collapse:collapse;margin-bottom:20px">${itemsHtml}<tr style="background:#f9fafb"><td style="padding:12px;font-weight:700;font-size:15px">Total</td><td style="padding:12px;font-weight:800;font-size:18px;text-align:right;color:#dc2626">${currency} ${recordData.order_amount || 0}</td></tr></table>${recordData.delivery_address ? `<div style="border-top:1px solid #f3f4f6;padding-top:16px;margin-top:8px"><h4 style="font-size:13px;color:#6b7280;margin:0 0 6px">📍 Delivery Address</h4><p style="margin:0;font-size:14px;color:#374151">${recordData.delivery_address}</p></div>` : ''}<div style="border-top:1px solid #f3f4f6;padding-top:16px;margin-top:16px"><h4 style="font-size:13px;color:#6b7280;margin:0 0 6px">💳 Payment Method</h4><p style="margin:0;font-size:14px;color:#374151;font-weight:600">${recordData.payment_method || 'Cash on Delivery'}</p></div></div><div style="background:#f9fafb;padding:20px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;text-align:center"><p style="font-size:13px;color:#6b7280;margin:0">You'll receive shipping updates on WhatsApp.</p><p style="font-size:12px;color:#9ca3af;margin:8px 0 0">Powered by ${businessName}</p></div></div>`,
                }),
              });

              if (emailRes.ok) {
                console.log(`[AI-Agent] ✅ Confirmation email sent to ${recordData.customer_email}`);
                await supabase.from('orders').update({ email_sent_at: new Date().toISOString() }).eq('id', upsertedOrderId);
              } else {
                const errBody = await emailRes.text().catch(() => 'unknown');
                console.error(`[AI-Agent] ❌ Resend email error (${emailRes.status}): ${errBody}`);
              }
            } else if (!resendApiKey) {
              console.log(`[AI-Agent] RESEND_API_KEY not set. Skipping confirmation email.`);
            } else {
              console.log(`[AI-Agent] No customer email on order. Skipping confirmation email.`);
            }

          } catch (syncErr) {
            console.error(`[AI-Agent] ❌ Platform sync/email error:`, syncErr);
          }
        })();
      }
    }

    if (ai_intent === 'review_submitted') {
      const ratingMatch = msg.match(/\b([1-5])\b/);
      const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
      
      const { error: reviewErr } = await supabase.from('reviews').insert({
        tenant_id: ctx.tenant_id,
        customer_name: ctx.customer_name,
        customer_phone: ctx.customer_phone,
        review_text: msg,
        rating: rating,
        order_id: previousInfo.id || null
      });
      
      if (reviewErr) {
        console.error(`[AI-Agent] Error saving review:`, reviewErr);
      } else {
        console.log(`[AI-Agent] Review saved for ${ctx.customer_name} (${rating} stars)`);
      }
    }

    const needs_human_handoff = /human|agent|representative|insaan|baat|connect|transfer/i.test(msgLower);
    if (needs_human_handoff) {
       console.log(`[AI-Agent] Human handoff requested. Handing off...`);
       await supabase.from('conversations').update({ status: 'pending', bot_enabled: false }).eq('id', ctx.conversation_id);
       
       // Send Push Notification
       sendTenantNotification(
         supabase, 
         ctx.tenant_id, 
         'Human Handoff Requested', 
         `${ctx.customer_name || ctx.customer_phone} needs assistance.`,
         { conversationId: ctx.conversation_id, phone: ctx.customer_phone }
       ).catch(err => console.error('[FCM] Error sending handoff push:', err));
    }

    // 6. (Removed) Send Reply to Customer via Meta API
    // We no longer send the message here. Instead, we insert it into the 'messages' table below,
    // and the chat-service picks it up via Realtime listener and sends it to Meta.

    // Insert bot message into DB
    const { error: insertError } = await supabase.from('messages').insert({
      tenant_id: ctx.tenant_id,
      conversation_id: ctx.conversation_id,
      sender_type: 'bot',
      content: ai_reply,
      model_used: 'gpt-4o-mini',
      prompt_tokens,
      completion_tokens,
      kb_chunks_used: kbDocs.length,
      is_read: true
    });
    if (insertError) {
      console.error(`[AI-Agent] Failed to insert bot message:`, insertError);
    }
    
    // Update conversation
    await supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: (ctx.normalized_message || '').slice(0, 100),
      updated_at: new Date().toISOString()
    }).eq('id', ctx.conversation_id);

    console.log(`[AI-Agent][${_reqId}] ◀ END processing for conv_id: ${ctx.conversation_id}`);
    return { success: true, reply: ai_reply, intent: ai_intent };

  } catch (error) {
    console.error(`[AI-Agent] Error processing message:`, error);
  }
}
