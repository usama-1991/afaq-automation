# AutoFlow AI — Complete n8n Setup & Workflow Guide
### Every workflow, every node, every connection for your exact stack

---

## Your Complete Data Flow (Full Picture)

```
Customer (WhatsApp / Instagram / Messenger)
        │
        ▼
Meta Cloud API Webhook
        │
        ▼
webhook-service (Railway :3003)
   ├─ Detects platform (WA / IG / FB)
   ├─ Finds tenant by phone/page ID → integrations table
   ├─ Creates/updates conversation in Supabase
   ├─ Saves inbound message to Supabase messages table
   └─ POST → agent-service /trigger
        │
        ▼
agent-service (Railway :3005)
   ├─ Fetches: agent config, chat history, knowledge base, tenant niche
   └─ POST → n8n Webhook (with full context payload)
        │
        ▼
n8n Master Workflow
   ├─ Switch Node (by niche)
   │     ├─ ecommerce  → Shopify branch
   │     ├─ restaurant → Google Sheets branch
   │     ├─ dental     → Google Calendar branch
   │     ├─ realestate → Listings branch
   │     ├─ salon      → Booking branch
   │     └─ clinic     → OPD Calendar branch
   ├─ Intent Detection Node (tags funnel stage)
   ├─ Build System Prompt (merge live data + KB + history)
   ├─ OpenAI GPT-4o Node
   ├─ Human Handoff Check
   ├─ Save AI reply to Supabase messages
   ├─ Update conversation_context table
   └─ POST → chat-service /send → Meta API → Customer
        │
        ▼
Supabase Realtime
        │
        ▼
AutoFlow Dashboard (Next.js) — updates live
```

---

## Part 1: Supabase Tables to Create First

Run these migrations before touching n8n. n8n writes to all of these.

```sql
-- ─────────────────────────────────────────
-- 1. Knowledge Base
-- ─────────────────────────────────────────
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  kb_type TEXT, -- 'url' | 'pdf' | 'text' | 'faq' | 'menu' | 'product_catalog' | 'location'
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 2. Conversation Context (n8n writes live data here)
-- ─────────────────────────────────────────
CREATE TABLE public.conversation_context (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  context_type TEXT,       -- 'last_order' | 'appointment' | 'lead_stage' | 'cart'
  context_data JSONB,
  last_intent TEXT,        -- 'product_inquiry' | 'order_placement' | 'booking' | 'complaint'
  funnel_stage TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 3. Orders (eCommerce + Restaurant)
-- ─────────────────────────────────────────
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  customer_phone TEXT,
  customer_name TEXT,
  items JSONB,
  order_amount DECIMAL(12,2),
  currency TEXT DEFAULT 'PKR',
  order_type TEXT DEFAULT 'delivery', -- 'delivery' | 'takeaway' | 'dine_in'
  status TEXT DEFAULT 'pending',      -- 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled'
  handled_by TEXT DEFAULT 'bot',      -- 'bot' | 'human'
  delivery_address TEXT,
  issue_type TEXT,                    -- 'wrong_order' | 'late' | 'missing_item' | null
  shopify_order_id TEXT,
  shopify_order_number TEXT,
  source TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- 4. Funnel Events (tracks AI conversion funnel)
-- ─────────────────────────────────────────
CREATE TABLE public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  stage TEXT NOT NULL,
  -- 'conversation_started' | 'product_intent_detected' | 'catalog_viewed'
  -- 'checkout_initiated' | 'order_confirmed' | 'refund_requested' | 'refund_resolved'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 5. Appointments (Dental, Salon, Clinic)
-- ─────────────────────────────────────────
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  patient_name TEXT,
  patient_phone TEXT,
  doctor_name TEXT,
  service_type TEXT,
  appointment_date DATE,
  appointment_time TIME,
  status TEXT DEFAULT 'pending', -- 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  is_new_patient BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  estimated_revenue DECIMAL(10,2),
  google_event_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 6. Leads (Real Estate)
-- ─────────────────────────────────────────
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  customer_name TEXT,
  customer_phone TEXT,
  intent TEXT,             -- 'buy' | 'rent' | 'sell'
  property_type TEXT,
  area_preference TEXT,
  bedrooms INTEGER,
  budget_min DECIMAL(15,2),
  budget_max DECIMAL(15,2),
  stage TEXT DEFAULT 'new_inquiry',
  -- 'new_inquiry' | 'qualified' | 'properties_sent' | 'visit_scheduled' | 'closed_won' | 'closed_lost'
  temperature TEXT DEFAULT 'warm', -- 'hot' | 'warm' | 'cold'
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 7. Integration Credentials (Shopify, Calendar, etc.)
-- ─────────────────────────────────────────
CREATE TABLE public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  platform TEXT,           -- 'shopify' | 'woocommerce' | 'google_calendar' | 'meta_pixel'
  credentials JSONB,       -- { access_token, store_url, refresh_token, etc. }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, platform)
);

-- ─────────────────────────────────────────
-- 8. RLS Policies for all new tables
-- ─────────────────────────────────────────
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_knowledge_base" ON public.knowledge_base FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tenant_conv_context" ON public.conversation_context FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tenant_orders" ON public.orders FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tenant_funnel" ON public.funnel_events FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tenant_appointments" ON public.appointments FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tenant_leads" ON public.leads FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "tenant_integration_creds" ON public.integration_credentials FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- Realtime for dashboard live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_context;
```

---

## Part 2: Update agent-service (Complete Implementation)

Replace `services/agent-service/server.js` entirely:

```javascript
import Fastify from 'fastify';
import { createClient } from '@supabase/supabase-js';

const fastify = Fastify({ logger: true });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY || '';

fastify.get('/health', async () => ({ status: 'ok', service: 'agent-service' }));

fastify.post('/trigger', async (request, reply) => {
  const {
    message_id,
    conversation_id,
    tenant_id,
    message,
    platform,
    customer_phone,
    customer_name
  } = request.body;

  if (!message_id || !tenant_id) {
    return reply.code(400).send({ error: 'Missing required fields' });
  }

  try {
    // 1. Get tenant info (niche, business name)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, niche, business_name, business_phone, metadata')
      .eq('id', tenant_id)
      .single();

    // 2. Get active AI agent config
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!agent) {
      fastify.log.info(`No active agent for tenant ${tenant_id}, skipping`);
      return { skipped: true, reason: 'No active agent' };
    }

    // 3. Get last 10 messages for conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('content, sender_type, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // 4. Get knowledge base for this tenant
    const { data: knowledgeBase } = await supabase
      .from('knowledge_base')
      .select('kb_type, title, content, metadata')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);

    // 5. Get integration credentials (Shopify, Calendar, etc.)
    const { data: integrations } = await supabase
      .from('integration_credentials')
      .select('platform, credentials')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true);

    const credMap = {};
    (integrations || []).forEach(i => { credMap[i.platform] = i.credentials; });

    // 6. Get existing conversation context (previous order/booking info)
    const { data: context } = await supabase
      .from('conversation_context')
      .select('*')
      .eq('conversation_id', conversation_id)
      .maybeSingle();

    // 7. Fire n8n with COMPLETE context
    const n8nPayload = {
      // Message info
      message_id,
      conversation_id,
      tenant_id,
      message_text: message,
      platform,
      customer_phone,
      customer_name: customer_name || 'Customer',

      // Tenant info
      niche: tenant?.niche || 'general',
      business_name: tenant?.business_name || tenant?.name,
      tenant_metadata: tenant?.metadata || {},

      // Agent config
      agent_config: {
        id: agent.id,
        name: agent.name,
        prompt: agent.prompt,
      },

      // Context
      conversation_history: (history || []).reverse(),
      knowledge_base: knowledgeBase || [],
      existing_context: context || null,

      // Integration credentials (Shopify token, Calendar token, etc.)
      integrations: credMap,
    };

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_API_KEY,
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n returned ${n8nResponse.status}: ${await n8nResponse.text()}`);
    }

    const result = await n8nResponse.json();
    return { triggered: true, n8n_response: result };

  } catch (err) {
    fastify.log.error(`agent-service trigger failed: ${err.message}`);
    return reply.code(500).send({ error: err.message });
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 3005;
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
```

---

## Part 3: Update webhook-service to call agent-service

In `services/webhook-service/server.js`, after saving inbound message to Supabase, add:

```javascript
// ─── ADD THIS after saving customer message to Supabase ───────────────────
async function triggerAgentService(payload) {
  const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://agent-service:3005';
  try {
    await fetch(`${AGENT_SERVICE_URL}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    fastify.log.warn(`Could not trigger agent-service: ${err.message}`);
    // Non-fatal — message already saved to Supabase
  }
}

// Call after inserting customer message:
if (savedMessage && senderType === 'customer') {
  await triggerAgentService({
    message_id: savedMessage.id,
    conversation_id: savedMessage.conversation_id,
    tenant_id: conversation.tenant_id,
    message: messageContent,
    platform: conversation.platform,
    customer_phone: conversation.external_conversation_id,
    customer_name: conversation.customer_name,
  });
}
```

---

## Part 4: n8n — Complete Workflow Setup

### WORKFLOW 1: AutoFlow Master Message Handler

**Deploy steps:**
1. Open n8n → New Workflow → name it "AutoFlow Master Handler"
2. Add nodes in this exact order

---

#### NODE 1: Webhook Trigger
```
Type: Webhook
HTTP Method: POST
Path: autoflow-master
Authentication: Header Auth
  Header Name: x-api-key
  Header Value: [your N8N_API_KEY]
Response Mode: Last Node
```
Copy the Production URL → this is your `N8N_WEBHOOK_URL` env variable.

---

#### NODE 2: Code Node — Validate + Unpack Payload
```javascript
// Validates incoming payload and sets default values
const body = $input.first().json;

// Safety check
if (!body.tenant_id || !body.message_text) {
  throw new Error('Invalid payload: missing tenant_id or message_text');
}

return [{
  json: {
    ...body,
    niche: body.niche || 'general',
    business_name: body.business_name || 'Business',
    conversation_history_text: (body.conversation_history || [])
      .map(m => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n'),
    knowledge_base_text: (body.knowledge_base || [])
      .map(k => `[${k.kb_type?.toUpperCase() || 'KB'}] ${k.title}:\n${k.content}`)
      .join('\n\n'),
  }
}];
```

---

#### NODE 3: HTTP Request — Fetch Unified Orders from Supabase
*Because you created a centralized `orders` table in Supabase, you do not need a Switch node or complex Google Sheets/WooCommerce integrations anymore! You can fetch orders for EVERY niche using a single query.*
```
Type: HTTP Request
Method: GET
URL: {{ $env.SUPABASE_URL }}/rest/v1/orders
Query Parameters:
  tenant_id: eq.{{ $json.tenant_id }}
  customer_phone: eq.{{ $json.customer_phone }}
  order: created_at.desc
  limit: 3
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}

On error: Continue (return empty array if no orders exist)
```

---

#### NODE 4: Code Node — Format Unified Orders Context
```javascript
// Get the original incoming payload (Change name to match your Node 2 exactly)
const mainData = $('Code in JavaScript').first().json;

// Get the orders we just fetched from Supabase
const ordersResponse = $input.first().json;
const orders = Array.isArray(ordersResponse) ? ordersResponse : [];

let liveContext = '';

// If Supabase returned orders for this customer
if (orders.length > 0) {
  liveContext = "Customer's recent orders:\n" +
    orders.map(o => {
      // Handle the dynamic niche metadata safely
      let details = '';
      if (o.niche === 'restaurant' || o.niche === 'ecommerce') {
        details = "| Items: " + (o.niche_metadata?.items || 'See details');
      } else if (o.niche === 'clinic' || o.niche === 'salon') {
        details = "| Scheduled: " + (o.scheduled_at || 'TBD') + " | Provider: " + (o.service_provider || 'Any');
      }
      
      return "Order ID: " + o.id.substring(0, 8) + " | Status: " + (o.status || '').toUpperCase() +
             " | Type: " + (o.order_type || o.niche) +
             " | Total: Rs. " + (o.total_amount || 0) + " " +
             details;
    }).join('\n');
}

return [{ json: { 
  ...mainData,
  live_data_context: liveContext || 'No previous orders found for this customer.'
}}];
```

---

#### NODE 6: Code Node — Intent Detection + Funnel Tagging
```javascript
const inputData = $input.first().json;
const message = (inputData.message_text || '').toLowerCase();
const niche = inputData.niche;

// Intent detection keywords per niche
const intents = {
  ecommerce: {
    product_inquiry: ['price', 'cost', 'available', 'size', 'color', 'fabric', 
                      'show me', 'catalog', 'hai kya', 'kitna', 'qeemat'],
    checkout_initiated: ['address', 'deliver', 'order karna', 'confirm', 'book',
                         'payment', 'easypaisa', 'jazzcash', 'cod', 'cash on delivery'],
    complaint: ['wrong', 'missing', 'damaged', 'return', 'refund', 'exchange', 
                'wapas', 'galat', 'nahi aaya'],
  },
  restaurant: {
    order_placement: ['order', 'chahiye', 'lena hai', 'send', 'deliver', 
                      'takeaway', 'parcel', 'pack'],
    menu_inquiry: ['menu', 'price', 'available', 'special', 'kya hai', 'items'],
    complaint: ['late', 'wrong', 'cold', 'missing', 'thanda', 'galat'],
  },
  dental: {
    booking_intent: ['appointment', 'slot', 'available', 'book', 'doctor', 
                     'scaling', 'whitening', 'filling', 'root canal', 'checkup'],
    clinical_query: ['pain', 'bleeding', 'swollen', 'dard', 'takleef', 'symptoms'],
  },
  realestate: {
    property_inquiry: ['flat', 'house', 'apartment', 'plot', 'villa', 'office',
                       'rent', 'buy', 'purchase', 'sale', 'dha', 'clifton', 'gulshan'],
    visit_request: ['visit', 'see', 'view', 'site', 'dekhna', 'Saturday', 'Sunday'],
  },
  salon: {
    booking_intent: ['appointment', 'slot', 'book', 'hair', 'facial', 'nails',
                     'bridal', 'color', 'cut', 'bleach', 'threading'],
  },
  clinic: {
    booking_intent: ['doctor', 'appointment', 'opd', 'consultant', 'specialist'],
    clinical_query: ['symptoms', 'pain', 'fever', 'dard', 'takleef', 'report'],
  }
};

let detectedIntent = 'general_inquiry';
let funnelStage = null;
let requiresHumanReview = false;

const nicheIntents = intents[niche] || {};

for (const [intent, keywords] of Object.entries(nicheIntents)) {
  if (keywords.some(k => message.includes(k))) {
    detectedIntent = intent;
    // Map intent to funnel stage
    if (intent === 'product_inquiry') funnelStage = 'product_intent_detected';
    if (intent === 'checkout_initiated') funnelStage = 'checkout_initiated';
    if (intent === 'order_placement') funnelStage = 'checkout_initiated';
    if (intent === 'booking_intent') funnelStage = 'booking_intent_detected';
    if (intent === 'property_inquiry') funnelStage = 'product_intent_detected';
    if (intent === 'visit_request') funnelStage = 'visit_requested';
    if (intent === 'clinical_query') requiresHumanReview = true;
    if (intent === 'complaint') requiresHumanReview = true;
    break;
  }
}

// Human handoff triggers (universal)
const handoffTriggers = ['human', 'agent', 'person', 'manager', 'owner', 
                         'banda chahiye', 'real person', 'speak to someone'];
const needsHandoff = handoffTriggers.some(t => message.includes(t));

return [{
  json: {
    ...inputData,
    detected_intent: detectedIntent,
    funnel_stage: funnelStage,
    requires_human_review: requiresHumanReview,
    needs_human_handoff: needsHandoff,
  }
}];
```

---

#### NODE 7: Code Node — Build Complete System Prompt
```javascript
const data = $input.first().json;

const systemPrompt = `You are ${data.agent_config.name}, an AI assistant for ${data.business_name}.

=== YOUR ROLE ===
${data.agent_config.prompt}

=== LIVE BUSINESS DATA (use this to answer customer questions) ===
${data.live_data_context || 'No live data available for this query.'}

=== KNOWLEDGE BASE ===
${data.knowledge_base_text || 'No knowledge base configured yet.'}

=== CONVERSATION CONTEXT ===
${data.existing_context ? JSON.stringify(data.existing_context.context_data, null, 2) : 'New conversation.'}

=== PREVIOUS MESSAGES ===
${data.conversation_history_text || 'This is the start of the conversation.'}

=== RESPONSE RULES ===
- Reply in the same language the customer used (Urdu, Roman Urdu, or English)
- Keep responses concise and helpful
- For ${data.niche === 'ecommerce' ? 'orders, always confirm item name + size + address before finalizing' : ''}
- For ${data.niche === 'dental' || data.niche === 'clinic' ? 'medical questions about symptoms or diagnosis, say: "Please consult our doctor directly for medical advice."' : ''}
- For ${data.niche === 'realestate' ? 'property queries, always ask for budget and area preference before showing listings' : ''}
- If customer explicitly asks for a human agent, respond: "I'll connect you with our team right away. Please hold on."
- Never make up information not in your knowledge base or live data above
- Today is: ${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

return [{
  json: {
    ...data,
    final_system_prompt: systemPrompt,
  }
}];
```

---

#### NODE 8: If Node — Skip AI if Human Handoff Needed
```
Type: If
Condition: {{ $json.needs_human_handoff }} is false
True output → NODE 9 (OpenAI)
False output → NODE 11 (Handoff handler)
```

---

#### NODE 9: OpenAI Chat Model
```
Type: OpenAI
Action: Message a model
Credential: OpenAI API (add your key in n8n credentials)
Model: gpt-4o-mini (cheaper, fast) or gpt-4o (better quality)
System Message: {{ $json.final_system_prompt }}
User Message: {{ $json.message_text }}
Max Tokens: 500
Temperature: 0.7
```

---

#### NODE 10: Code Node — Parse AI Reply + Extract Order/Booking
```javascript
const aiReply = $input.item.json.message?.content || 
                $input.item.json.choices?.[0]?.message?.content ||
                'I apologize, I could not process your request. Please try again.';

const data = $('NODE 7').item.json; // Get original data from before OpenAI node
const niche = data.niche;
const message = data.message_text.toLowerCase();

// Try to extract structured data from conversation
let extractedData = null;

// Order detection (ecommerce + restaurant)
if (['ecommerce', 'restaurant'].includes(niche)) {
  // Simple heuristic: if AI reply contains "confirmed" and customer message had address
  const hasAddress = message.includes('address') || message.includes('street') || 
                     message.includes('phase') || message.includes('block') ||
                     message.includes('dha') || message.includes('clifton');
  if (hasAddress && aiReply.toLowerCase().includes('confirm')) {
    extractedData = { type: 'order_ready_to_confirm' };
  }
}

// Appointment detection (dental, salon, clinic)
if (['dental', 'salon', 'clinic'].includes(niche)) {
  const timePatterns = /(\d{1,2})(:\d{2})?\s*(am|pm)/i;
  const dayPatterns = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|kal)/i;
  const hasTime = timePatterns.test(message) || timePatterns.test(aiReply);
  const hasDay = dayPatterns.test(message) || dayPatterns.test(aiReply);
  if (hasTime && hasDay && aiReply.toLowerCase().includes('book')) {
    extractedData = { type: 'appointment_ready_to_book' };
  }
}

return [{
  json: {
    ...data,
    ai_reply: aiReply,
    extracted_data: extractedData,
  }
}];
```

---

#### NODE 11: HTTP Request — Save AI Reply to Supabase
```
Type: HTTP Request
Method: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/messages
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: return=representation
Body (JSON):
{
  "conversation_id": "{{ $json.conversation_id }}",
  "sender_type": "bot",
  "content": "{{ $json.ai_reply }}",
  "tenant_id": "{{ $json.tenant_id }}"
}
```

---

#### NODE 12: HTTP Request — Update conversation_context
```
Type: HTTP Request
Method: POST  
URL: {{ $env.SUPABASE_URL }}/rest/v1/conversation_context
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: resolution=merge-duplicates
Body (JSON):
{
  "conversation_id": "{{ $json.conversation_id }}",
  "tenant_id": "{{ $json.tenant_id }}",
  "last_intent": "{{ $json.detected_intent }}",
  "funnel_stage": "{{ $json.funnel_stage }}",
  "context_data": {
    "last_message": "{{ $json.message_text }}",
    "live_data_snapshot": "{{ $json.live_data_context }}",
    "ai_replied_at": "{{ new Date().toISOString() }}"
  },
  "updated_at": "{{ new Date().toISOString() }}"
}
```

---

#### NODE 13: If Node — Log Funnel Event?
```
Condition: {{ $json.funnel_stage }} is not empty
True → NODE 14 (log funnel event)
False → NODE 15 (send to Meta API)
```

---

#### NODE 14: HTTP Request — Insert Funnel Event
```
Type: HTTP Request
Method: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/funnel_events
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
Body (JSON):
{
  "tenant_id": "{{ $json.tenant_id }}",
  "conversation_id": "{{ $json.conversation_id }}",
  "stage": "{{ $json.funnel_stage }}",
  "metadata": { "intent": "{{ $json.detected_intent }}", "message": "{{ $json.message_text }}" }
}
```
→ Connects to NODE 15 after

---

#### NODE 15: If Node — Human Handoff?
```
Condition: {{ $json.needs_human_handoff }} equals true
True → NODE 16 (update conversation status)  
False → NODE 17 (send reply via Meta API)
```

---

#### NODE 16: HTTP Request — Update Conversation Status to Pending (Handoff)
```
Type: HTTP Request
Method: PATCH
URL: {{ $env.SUPABASE_URL }}/rest/v1/conversations?id=eq.{{ $json.conversation_id }}
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
Body: { "status": "pending" }
```
→ Connects to NODE 17

---

#### NODE 17: HTTP Request — Send Reply via Meta Cloud API
```
Type: HTTP Request
Method: POST
URL: https://graph.facebook.com/v19.0/{{ $json.integrations.meta?.phone_number_id || $env.META_PHONE_NUMBER_ID }}/messages
Headers:
  Authorization: Bearer {{ $json.integrations.meta?.access_token || $env.META_ACCESS_TOKEN }}
  Content-Type: application/json
Body (JSON):
{
  "messaging_product": "whatsapp",
  "to": "{{ $json.customer_phone }}",
  "type": "text",
  "text": { "body": "{{ $json.ai_reply }}" }
}

NOTE: For Instagram/Messenger, use different endpoint:
  Instagram: POST /{ig-user-id}/messages
  Messenger: POST /me/messages (with recipient.id = PSID)
```

Add **platform routing** before this node:

```javascript
// Code Node: Build correct Meta API payload by platform
const data = $input.item.json;
let endpoint, payload;

if (data.platform === 'whatsapp') {
  const phoneNumberId = data.integrations?.meta?.phone_number_id || process.env.META_PHONE_NUMBER_ID;
  endpoint = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  payload = {
    messaging_product: 'whatsapp',
    to: data.customer_phone,
    type: 'text',
    text: { body: data.ai_reply }
  };
} else if (data.platform === 'instagram') {
  const igUserId = data.integrations?.meta?.instagram_user_id || process.env.INSTAGRAM_USER_ID;
  endpoint = `https://graph.facebook.com/v19.0/${igUserId}/messages`;
  payload = {
    recipient: { id: data.customer_phone }, // IGSID for Instagram
    message: { text: data.ai_reply }
  };
} else if (data.platform === 'messenger') {
  endpoint = `https://graph.facebook.com/v19.0/me/messages`;
  payload = {
    recipient: { id: data.customer_phone }, // PSID for Messenger
    message: { text: data.ai_reply }
  };
}

return [{ json: { ...data, meta_endpoint: endpoint, meta_payload: payload }}];
```

---

#### NODE 11b: Human Handoff Reply (connects from NODE 8 false output)
```javascript
// Code Node: Build handoff message
const data = $input.item.json;
const handoffMessage = `Ek second, main aapko humari team se connect kar raha hoon. Woh jald hi aapke saath baat karenge! 🙏`;

return [{
  json: {
    ...data,
    ai_reply: handoffMessage,
    needs_human_handoff: true,
  }
}];
```
→ Connects to NODE 11 (save to Supabase), then NODE 16 (update status), then NODE 17

---

### WORKFLOW 2: Appointment Reminder Cron

Create a **new workflow** named "AutoFlow Appointment Reminders":

#### Node 1: Schedule Trigger
```
Type: Schedule
Interval: Every 1 Hour
```

#### Node 2: HTTP Request — Fetch Upcoming Appointments (next 24h)
```
Type: HTTP Request
Method: GET
URL: {{ $env.SUPABASE_URL }}/rest/v1/appointments
Query Params:
  reminder_sent: eq.false
  status: eq.confirmed
  appointment_date: lte.{{ new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0] }}
  select: *,tenant_id,patient_phone,patient_name,service_type,appointment_date,appointment_time
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
```

#### Node 3: Loop Over Items
```
Type: Split In Batches
Batch Size: 1
```

#### Node 4: HTTP Request — Send WhatsApp Reminder
```javascript
// Code Node: Build reminder message
const appt = $input.item.json;
const message = `Hi ${appt.patient_name}! 🦷\n\n` +
  `Reminder: Your appointment for ${appt.service_type} is scheduled for ` +
  `${appt.appointment_date} at ${appt.appointment_time}.\n\n` +
  `Please arrive 10 minutes early. ` +
  `Reply CANCEL if you need to reschedule.`;

return [{ json: { ...appt, reminder_message: message }}];
```

Then HTTP Request to Meta API (same structure as Workflow 1 NODE 17).

#### Node 5: HTTP Request — Mark Reminder Sent
```
Method: PATCH
URL: {{ $env.SUPABASE_URL }}/rest/v1/appointments?id=eq.{{ $json.id }}
Body: { "reminder_sent": true }
```

---

### WORKFLOW 3: Campaign Broadcast

Create workflow "AutoFlow Campaign Broadcaster":

#### Node 1: Webhook Trigger
```
Path: autoflow-campaign
Method: POST
```
Your campaign-service calls this when a campaign is launched.

#### Node 2: HTTP Request — Fetch Campaign Contacts
```javascript
// Gets contacts for the selected segment from Supabase conversations table
```

#### Node 3: HTTP Request — Fetch Approved Template from Meta
```
GET https://graph.facebook.com/v19.0/{{ $json.waba_id }}/message_templates
?name={{ $json.template_name }}&status=APPROVED
```

#### Node 4: Split In Batches (1 contact at a time)

#### Node 5: HTTP Request — Send Template Message
```json
{
  "messaging_product": "whatsapp",
  "to": "{{ $json.phone }}",
  "type": "template",
  "template": {
    "name": "{{ $json.template_name }}",
    "language": { "code": "en_US" },
    "components": []
  }
}
```

#### Node 6: HTTP Request — Update Campaign Stats in Supabase
```
PATCH /rest/v1/campaigns?id=eq.{{ $json.campaign_id }}
Body: increment sentCount + deliveredCount
```

#### Node 7: Wait (throttle — Meta allows ~80 messages/sec)
```
Type: Wait
Amount: 50ms
```

---

## Part 5: Environment Variables (Complete List)

Add all of these to Railway + local `.env.local`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Meta Cloud API
META_ACCESS_TOKEN=EAAx...permanent_system_user_token
META_PHONE_NUMBER_ID=108253102123984
META_WHATSAPP_BUSINESS_ACCOUNT_ID=109283019238472
META_APP_SECRET=abc123...
META_WEBHOOK_VERIFY_TOKEN=your_custom_verify_string
INSTAGRAM_USER_ID=17841400000000000

# n8n
N8N_WEBHOOK_URL=https://your-workspace.app.n8n.cloud/webhook/autoflow-master
N8N_CAMPAIGN_WEBHOOK_URL=https://your-workspace.app.n8n.cloud/webhook/autoflow-campaign
N8N_API_KEY=your_secret_n8n_api_key

# Service URLs (internal Railway)
AGENT_SERVICE_URL=https://agent-service-production.up.railway.app
CHAT_SERVICE_URL=https://chat-service-production.up.railway.app
WEBHOOK_SERVICE_URL=https://webhook-service-production.up.railway.app

# OpenAI (used by n8n — set as n8n credential, not env)
OPENAI_API_KEY=sk-proj-...

# Google OAuth (for Calendar integration)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://your-app.railway.app/api/oauth/google/callback
```

---

## Part 6: n8n Credentials to Set Up

In n8n Settings → Credentials → Add:

```
1. Supabase
   - Host: your-project.supabase.co
   - Service Role Key: eyJ...

2. OpenAI
   - API Key: sk-proj-...
   
3. Header Auth (for securing your webhooks)
   - Header Name: x-api-key
   - Header Value: [your N8N_API_KEY]

4. Google OAuth2 (for Calendar)
   - Client ID + Secret from Google Cloud Console
   - Scopes: https://www.googleapis.com/auth/calendar
```

---

## Part 7: Testing Checklist

```
□ Step 1: n8n webhook URL live → test with Postman/curl
   curl -X POST https://your-n8n.com/webhook/autoflow-master \
     -H "x-api-key: your_key" \
     -H "Content-Type: application/json" \
     -d '{"tenant_id":"xxx","conversation_id":"yyy","message_text":"hello","niche":"ecommerce","platform":"whatsapp","customer_phone":"923001234567","agent_config":{"name":"ShopBot","prompt":"You are a helpful assistant"},"knowledge_base":[],"conversation_history":[]}'

□ Step 2: n8n returns AI reply in response body

□ Step 3: Reply appears in Supabase messages table

□ Step 4: webhook-service fires → agent-service → n8n (end-to-end)

□ Step 5: Send real WhatsApp to your test number → reply appears in CRM inbox

□ Step 6: Funnel event written to Supabase when product keyword detected

□ Step 7: Appointment reminder cron fires → check Supabase appointments table

□ Step 8: Campaign workflow triggered → template messages sent to 3 test numbers
```

---

## Workflow Diagram Summary

```
WORKFLOW 1: Master Handler (fires on every customer message)
  Webhook → Validate → Switch(niche) → [Live Data Fetch] → 
  Merge → Intent Detection → Build Prompt → [Human Handoff?] → 
  OpenAI → Parse Reply → Save to Supabase → Log Funnel → 
  [Update Status?] → Platform Router → Send via Meta API

WORKFLOW 2: Reminder Cron (fires every hour)
  Schedule → Fetch Due Appointments → Loop → 
  Build Message → Send WhatsApp → Mark Sent

WORKFLOW 3: Campaign Broadcaster (fires on campaign launch)  
  Webhook → Fetch Contacts → Fetch Template → 
  Loop → Send Template → Update Stats → Throttle
```

---

## Common Errors + Fixes

| Error | Cause | Fix |
|---|---|---|
| n8n webhook returns 404 | Workflow not activated | Click "Activate" toggle in n8n top right |
| Meta API 401 | Token expired or wrong | Regenerate system user token |
| OpenAI "rate limit" | Too many requests | Use gpt-4o-mini, add Wait node between retries |
| Supabase insert fails | RLS blocking service role | Check you're using SERVICE_ROLE_KEY not ANON_KEY in n8n |
| agent-service can't reach n8n | Railway networking | Use public n8n URL not localhost |
| Messages not appearing in CRM | Supabase realtime not set up | Run: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;` |
| Calendar slots wrong timezone | n8n uses UTC | Add timezone offset for Pakistan: `+05:00` |
