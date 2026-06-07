# AutoFlow AI — n8n Complete Setup Guide v2
### Updated for Niche-Specific Orders Windows (Bidirectional Flow)

---

## What Changed From v1

The Orders window existing in your frontend changes everything.

**v1 flow (one direction):**
```
Customer WhatsApp → n8n → writes to Supabase → CRM shows it
```

**v2 flow (two directions):**
```
Direction 1: Customer WhatsApp → n8n → creates order/appointment/lead in Supabase → Orders window shows it live

Direction 2: Owner clicks button in Orders window → Supabase row updates → Supabase DB Webhook → n8n → sends WhatsApp status message to customer
```

Without Direction 2, your Orders window buttons (Confirm, Dispatch, Deliver, Confirm Appointment, etc.) are dead. They update the database but the customer never hears back. n8n closes that loop automatically.

---

## New Complete Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DIRECTION 1: Customer → CRM                       │
│                                                                       │
│  Customer WhatsApp/IG/FB                                             │
│        ↓                                                             │
│  webhook-service → saves message → Supabase                         │
│        ↓                                                             │
│  agent-service → fires n8n Master Workflow                          │
│        ↓                                                             │
│  n8n: Switch(niche) → fetch live data → detect intent               │
│        ↓                                                             │
│  n8n: OpenAI generates reply                                         │
│        ↓                                                             │
│  n8n: writes to niche table ← THIS IS NEW AND CRITICAL              │
│    ecommerce  → INSERT into orders (status: pending_address)         │
│    restaurant → INSERT into orders (status: pending, type: food)     │
│    dental     → INSERT into appointments (status: pending)           │
│    salon      → INSERT into appointments (status: pending)           │
│    clinic     → INSERT into appointments (status: pending)           │
│    realestate → INSERT into leads (stage: new_inquiry)               │
│        ↓                                                             │
│  Supabase Realtime → Orders Window updates live                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    DIRECTION 2: Owner Action → Customer              │
│                                                                       │
│  Owner clicks button in Orders Window (Confirm / Dispatch / etc.)   │
│        ↓                                                             │
│  Frontend PATCH → Supabase row status changes                        │
│        ↓                                                             │
│  Supabase Database Webhook fires (configured in Supabase dashboard) │
│        ↓                                                             │
│  n8n Status Notifier Workflow                                        │
│        ↓                                                             │
│  Builds WhatsApp message based on new status + niche                 │
│        ↓                                                             │
│  Sends WhatsApp to customer via Meta Cloud API                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Supabase Tables (Updated Schema)

The tables are the same as v1 but with important additions to support the Orders window status buttons and Supabase webhooks.

```sql
-- ─────────────────────────────────────────────────────────────
-- 1. Knowledge Base (unchanged from v1)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  kb_type TEXT,
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Conversation Context (unchanged from v1)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.conversation_context (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  context_type TEXT,
  context_data JSONB,
  last_intent TEXT,
  funnel_stage TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. Orders (eCommerce + Restaurant) — UPDATED for Orders window
-- New fields: order_number, niche, whatsapp_notified_at, notes
-- Status values map directly to Orders window Kanban columns
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,

  -- Order details (n8n fills these from conversation)
  items JSONB,                    -- [{ name, qty, price, size, variant }]
  order_amount DECIMAL(12,2),
  currency TEXT DEFAULT 'PKR',
  order_type TEXT DEFAULT 'delivery', -- 'delivery' | 'takeaway' | 'dine_in' | 'bulk_event'
  delivery_address TEXT,
  notes TEXT,

  -- niche tells Orders window which column labels to show
  niche TEXT DEFAULT 'ecommerce',     -- 'ecommerce' | 'restaurant'

  -- Status — maps to Orders window Kanban columns:
  -- ecommerce:  pending_address → confirmed → dispatched → delivered → cancelled
  -- restaurant: pending → confirmed → preparing → delivered → cancelled
  status TEXT DEFAULT 'pending_address',

  -- Who handles it
  handled_by TEXT DEFAULT 'bot',      -- 'bot' | 'human'
  source TEXT DEFAULT 'whatsapp',     -- 'whatsapp' | 'instagram' | 'messenger'
  issue_type TEXT,                    -- 'wrong_order' | 'late' | 'missing_item'

  -- External platform reference
  shopify_order_id TEXT,
  shopify_order_number TEXT,

  -- Timestamps (Orders window uses these for display)
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Direction 2: track if customer was notified for each status
  -- Prevents duplicate WhatsApp sends if DB webhook fires twice
  whatsapp_notified_status TEXT      -- last status customer was notified about
);

-- ─────────────────────────────────────────────────────────────
-- 4. Funnel Events (unchanged from v1)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  stage TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 5. Appointments (Dental, Salon, Clinic) — UPDATED for Orders window
-- Status values map to Orders window appointment timeline columns
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  patient_name TEXT,
  patient_phone TEXT NOT NULL,
  doctor_name TEXT,             -- or stylist_name for salon
  service_type TEXT,
  niche TEXT DEFAULT 'dental',  -- 'dental' | 'salon' | 'clinic'

  appointment_date DATE,
  appointment_time TIME,

  -- Status maps to Orders window appointment columns:
  -- pending → confirmed → completed → cancelled | no_show
  status TEXT DEFAULT 'pending',

  is_new_patient BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  estimated_revenue DECIMAL(10,2),
  google_event_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Direction 2: track notification status
  whatsapp_notified_status TEXT
);

-- ─────────────────────────────────────────────────────────────
-- 6. Leads (Real Estate) — UPDATED for Orders window
-- Stage values map to Lead Pipeline Kanban columns
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  customer_name TEXT,
  customer_phone TEXT NOT NULL,

  -- Requirement details extracted by n8n AI
  intent TEXT,                  -- 'buy' | 'rent' | 'sell'
  property_type TEXT,
  area_preference TEXT,
  bedrooms INTEGER,
  budget_min DECIMAL(15,2),
  budget_max DECIMAL(15,2),

  -- Stage maps to Orders window Lead Pipeline columns:
  -- new_inquiry → qualified → properties_sent → visit_scheduled → closed_won | closed_lost
  stage TEXT DEFAULT 'new_inquiry',

  temperature TEXT DEFAULT 'warm',  -- 'hot' | 'warm' | 'cold'
  properties_sent JSONB DEFAULT '[]', -- list of listing IDs sent
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Direction 2
  whatsapp_notified_status TEXT
);

-- ─────────────────────────────────────────────────────────────
-- 7. Integration Credentials (unchanged from v1)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  platform TEXT,
  credentials JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, platform)
);

-- ─────────────────────────────────────────────────────────────
-- 8. RLS Policies
-- ─────────────────────────────────────────────────────────────
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

-- Realtime (Orders window subscribes to these)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_context;
```

---

## Part 2: Supabase Database Webhooks (New — Powers Direction 2)

This is what makes owner button clicks in the Orders window automatically notify customers on WhatsApp. Configure in your Supabase dashboard.

### How to set up Supabase Database Webhooks

1. Supabase Dashboard → **Database → Webhooks**
2. Click **Create a new hook**
3. Configure as below for each table

### Webhook 1: Orders Status Change
```
Name: orders_status_changed
Table: orders
Events: UPDATE
Conditions: (none — fires on any update)
Type: HTTP Request
URL: https://afaqautomationai.app.n8n.cloud/webhook/autoflow-status-notifier
Method: POST
Headers:
  x-api-key: [your N8N_API_KEY]
  Content-Type: application/json
Payload: { "type": "orders", "record": "{{ record }}", "old_record": "{{ old_record }}" }
```

### Webhook 2: Appointments Status Change
```
Name: appointments_status_changed
Table: appointments
Events: UPDATE
URL: https://afaqautomationai.app.n8n.cloud/webhook/autoflow-status-notifier
Same headers as above
Payload: { "type": "appointments", "record": "{{ record }}", "old_record": "{{ old_record }}" }
```

### Webhook 3: Leads Stage Change
```
Name: leads_stage_changed
Table: leads
Events: UPDATE
URL: https://afaqautomationai.app.n8n.cloud/webhook/autoflow-status-notifier
Same headers as above
Payload: { "type": "leads", "record": "{{ record }}", "old_record": "{{ old_record }}" }
```

---

## Part 3: agent-service (Updated — Same as v1, No Changes Needed)

The agent-service from v1 is correct. No changes. It already passes `niche`, `integrations`, `knowledge_base` and full context to n8n. Keep it as-is.

Only one addition — pass the META credentials per tenant so n8n Workflow 2 can send WhatsApp without hardcoded env vars:

In `agent-service/server.js`, add to the payload:
```javascript
// Add to n8nPayload object:
meta_credentials: {
  phone_number_id: credMap['meta']?.phone_number_id || $env.META_PHONE_NUMBER_ID,
  access_token: credMap['meta']?.access_token || $env.META_ACCESS_TOKEN,
  instagram_user_id: credMap['meta']?.instagram_user_id || $env.INSTAGRAM_USER_ID,
},
```

---

## Part 4: n8n Workflows (Complete)

You need **5 workflows total**:

| # | Workflow Name | Trigger | Purpose |
|---|---|---|---|
| 1 | Master Message Handler | Webhook (from agent-service) | Customer message → AI reply + create order/appt/lead |
| 2 | Status Notifier | Webhook (from Supabase DB hook) | Owner action → WhatsApp notification to customer |
| 3 | Appointment Reminders | Cron (every hour) | Auto-remind patients/clients 24h before |
| 4 | Campaign Broadcaster | Webhook (from campaign-service) | Bulk template sends |
| 5 | Lead Follow-up Cron | Cron (every 24h) | Re-engage cold leads |

---

## WORKFLOW 1: AutoFlow Master Message Handler

**Trigger webhook path:** `autoflow-master`

---

### NODE 1: Webhook Trigger
```
Type: Webhook
Path: autoflow-master
Method: POST
Authentication: Header Auth → Header Auth account (x-api-key)
Respond: When Last Node Finishes
Response Data: First Entry JSON
```

---

### NODE 2: Code — Validate + Unpack
```javascript
const body = $input.first().json;
if (!body.tenant_id || !body.message_text) {
  throw new Error('Invalid payload');
}

return [{
  json: {
    ...body,
    niche: body.niche || 'general',
    conversation_history_text: (body.conversation_history || [])
      .map(m => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n'),
    knowledge_base_text: (body.knowledge_base || [])
      .map(k => `[${(k.kb_type || 'KB').toUpperCase()}] ${k.title}:\n${k.content}`)
      .join('\n\n'),
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

---

### NODE 4a: eCommerce Branch — Fetch WooCommerce Orders
```
Type: HTTP Request
Method: GET
URL: https://lemonchiffon-oryx-271652.hostingersite.com/wp-json/wc/v3/orders
Authentication: Basic Auth
  Username: {{ $json.integrations.woocommerce?.consumer_key }}
  Password: {{ $json.integrations.woocommerce?.consumer_secret }}
Query Parameters (Using JSON):
{
  "per_page": 5,
  "search": "{{ $json.customer_phone }}"
}
Continue on Fail: true
```

**Code Node after (eCommerce):**
```javascript
const wooOrders = $input.all().map(item => item.json).filter(o => o && o.id);
const base = $('Code — Validate + Unpack').first().json;

let liveContext = 'No previous orders found for this customer.';
if (wooOrders.length > 0) {
  liveContext = "Customer's recent WooCommerce orders:\n" +
    wooOrders.slice(0, 3).map(o =>
      `Order #${o.id}: ${o.status.toUpperCase()} | ` +
      `Items: ${(o.line_items || []).map(i => i.name).join(', ')} | ` +
      `Total: PKR ${o.total}`
    ).join('\n');
}

return [{ json: { ...base, live_data_context: liveContext } }];
```

---

### NODE 4b: Restaurant Branch — Fetch Today's Orders from Supabase
```
Type: HTTP Request
Method: GET
URL: {{ $env.SUPABASE_URL }}/rest/v1/orders
Query:
  tenant_id: eq.{{ $json.tenant_id }}
  niche: eq.restaurant
  created_at: gte.{{ new Date().toISOString().split('T')[0] }}
  status: neq.delivered
  select: id,customer_name,items,status,order_type,created_at
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
Continue on Fail: true
```

**Code Node after (Restaurant):**
```javascript
const todayOrders = $input.first().json || [];
const base = $('Code — Validate + Unpack').first().json;

const liveContext = todayOrders.length > 0
  ? `Active orders today: ${todayOrders.length}\n` +
    todayOrders.map(o =>
      `• ${o.customer_name}: ${JSON.stringify(o.items)} — Status: ${o.status}`
    ).join('\n')
  : 'No active orders right now.';

return [{ json: { ...base, live_data_context: liveContext } }];
```

---

### NODE 4c: Dental/Salon/Clinic Branch — Fetch Calendar Availability
```
Type: HTTP Request
Method: GET
URL: https://www.googleapis.com/calendar/v3/calendars/{{ $json.integrations.google_calendar?.calendar_id }}/events
Query:
  timeMin: {{ new Date().toISOString() }}
  timeMax: {{ new Date(Date.now() + 7*24*60*60*1000).toISOString() }}
  maxResults: 20
  singleEvents: true
  orderBy: startTime
Headers:
  Authorization: Bearer {{ $json.integrations.google_calendar?.access_token }}
Continue on Fail: true
```

**Code Node after (Appointment niches):**
```javascript
const events = $input.first().json?.items || [];
const base = $('Code — Validate + Unpack').first().json;

// Build available slots (next 5 working days, 9am-5pm, hourly)
const booked = events.map(e => new Date(e.start?.dateTime || e.start?.date).getTime());
const available = [];

for (let d = 1; d <= 7 && available.length < 6; d++) {
  const date = new Date();
  date.setDate(date.getDate() + d);
  if ([0,6].includes(date.getDay())) continue; // skip weekend
  for (let h = 9; h <= 16; h++) {
    const slot = new Date(date);
    slot.setHours(h, 0, 0, 0);
    // Pakistan timezone offset
    const pkTime = new Date(slot.getTime() + 5*60*60*1000);
    if (!booked.some(b => Math.abs(b - slot.getTime()) < 3600000)) {
      available.push(slot.toLocaleString('en-PK', {
        weekday:'short', month:'short', day:'numeric',
        hour:'2-digit', minute:'2-digit', timeZone:'Asia/Karachi'
      }));
    }
  }
}

const liveContext = `Available appointment slots:\n${available.slice(0,6).join('\n')}`;
return [{ json: { ...base, live_data_context: liveContext } }];
```

---

### NODE 4d: Real Estate Branch — Fetch Listings from Supabase
```
Type: HTTP Request
Method: GET
URL: {{ $env.SUPABASE_URL }}/rest/v1/listings
Query:
  tenant_id: eq.{{ $json.tenant_id }}
  status: eq.available
  select: title,area,type,bedrooms,price,description
  limit: 5
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
Continue on Fail: true
```

**Code Node after (Real Estate):**
```javascript
const listings = $input.first().json || [];
const base = $('Code — Validate + Unpack').first().json;

const liveContext = listings.length > 0
  ? `Available properties:\n` + listings.map(l =>
      `• ${l.title} — PKR ${Number(l.price).toLocaleString()} | ${l.bedrooms} Bed | ${l.area} | ${l.type}`
    ).join('\n')
  : 'No listings available right now. Ask for requirements to search further.';

return [{ json: { ...base, live_data_context: liveContext } }];
```

---

### NODE 4e + 4f: Fallback (Salon direct / General)
```javascript
// Code Node — no live data fetch needed, pass through
const base = $input.first().json;
return [{ json: { ...base, live_data_context: '' } }];
```

---

### NODE 5: Merge
```
Type: Merge
Mode: Append (collects all 7 branch outputs into one stream)
Connect all outputs of 4a through 4f here
```

---

### NODE 6: Code — Intent Detection + Funnel Stage
```javascript
const data = $input.first().json;
const msg = data.message_text.toLowerCase();
const niche = data.niche;

// Intent maps per niche
const intentMap = {
  ecommerce: [
    { intent: 'product_inquiry',    funnel: 'product_intent_detected',
      keys: ['price','cost','available','size','color','hai kya','kitna','show','catalog','fabric'] },
    { intent: 'address_provided',   funnel: 'checkout_initiated',
      keys: ['address','street','phase','block','dha','clifton','gulshan','deliver to','ghar'] },
    { intent: 'order_confirmed',    funnel: 'order_confirmed',
      keys: ['confirm','book karo','place order','proceed','haan','yes confirm','ok confirm'] },
    { intent: 'complaint',          funnel: 'refund_requested',
      keys: ['wrong','missing','damaged','return','refund','exchange','wapas','galat','nahi aaya'] },
    { intent: 'cod_request',        funnel: null,
      keys: ['cod','cash on delivery','cash pay','easypaisa','jazzcash'] },
  ],
  restaurant: [
    { intent: 'order_placement',    funnel: 'checkout_initiated',
      keys: ['order','chahiye','lena hai','send karo','deliver','takeaway','parcel'] },
    { intent: 'menu_inquiry',       funnel: 'product_intent_detected',
      keys: ['menu','price','kya hai','available','special','items','show','list'] },
    { intent: 'complaint',          funnel: null,
      keys: ['late','wrong','cold','missing','thanda','galat','complaint'] },
    { intent: 'order_confirmed',    funnel: 'order_confirmed',
      keys: ['confirm','yes','haan','theek hai','ok order','place karo'] },
  ],
  dental: [
    { intent: 'booking_intent',     funnel: 'booking_intent_detected',
      keys: ['appointment','book','slot','available','scaling','whitening','filling','root canal','checkup','consult'] },
    { intent: 'appointment_confirmed', funnel: 'appointment_confirmed',
      keys: ['confirm','yes','haan','ok book','theek hai','book kar do'] },
    { intent: 'reschedule',         funnel: null,
      keys: ['reschedule','change','postpone','badal','shift','cancel'] },
    { intent: 'clinical_query',     funnel: null,
      keys: ['pain','bleeding','dard','swollen','symptoms','infection','takleef'] },
  ],
  salon: [
    { intent: 'booking_intent',     funnel: 'booking_intent_detected',
      keys: ['appointment','book','slot','hair','facial','nails','bridal','color','cut','bleach','threading','wax'] },
    { intent: 'appointment_confirmed', funnel: 'appointment_confirmed',
      keys: ['confirm','yes','haan','ok book','theek hai'] },
    { intent: 'bridal_inquiry',     funnel: 'product_intent_detected',
      keys: ['bridal','wedding','bride','shadi','barat','nikkah','package'] },
  ],
  clinic: [
    { intent: 'booking_intent',     funnel: 'booking_intent_detected',
      keys: ['doctor','appointment','opd','consultant','specialist','book'] },
    { intent: 'appointment_confirmed', funnel: 'appointment_confirmed',
      keys: ['confirm','yes','haan','ok'] },
    { intent: 'clinical_query',     funnel: null,
      keys: ['symptoms','fever','pain','dard','cough','report','test'] },
  ],
  realestate: [
    { intent: 'property_inquiry',   funnel: 'product_intent_detected',
      keys: ['flat','house','apartment','plot','villa','office','rent','buy','purchase','sale','dha','clifton','gulshan','bahria'] },
    { intent: 'visit_request',      funnel: 'visit_requested',
      keys: ['visit','see','view','site','dekhna','saturday','sunday','kal','this week'] },
    { intent: 'requirement_provided', funnel: 'qualified',
      keys: ['budget','crore','lakh','bedroom','bed','2 bed','3 bed','area'] },
  ],
};

let detectedIntent = 'general_inquiry';
let funnelStage = null;
let requiresHumanReview = false;
let isClinicalQuery = false;

const nicheIntents = intentMap[niche] || [];
for (const { intent, funnel, keys } of nicheIntents) {
  if (keys.some(k => msg.includes(k))) {
    detectedIntent = intent;
    funnelStage = funnel;
    if (intent === 'clinical_query') {
      requiresHumanReview = true;
      isClinicalQuery = true;
    }
    if (intent === 'complaint') requiresHumanReview = true;
    break;
  }
}

// Universal human handoff detection
const handoffKeys = ['human','agent','banda','person','manager','owner','real person','speak to','connect me'];
const needsHandoff = handoffKeys.some(k => msg.includes(k));

return [{
  json: {
    ...data,
    detected_intent: detectedIntent,
    funnel_stage: funnelStage,
    requires_human_review: requiresHumanReview,
    is_clinical_query: isClinicalQuery,
    needs_human_handoff: needsHandoff,
  }
}];
```

---

### NODE 7: Code — Build System Prompt
```javascript
const d = $input.first().json;
const nicheInstructions = {
  ecommerce:  'When customer provides delivery address, confirm the full order summary (items + sizes + address + total) before finalizing. Mention COD if they ask about payment.',
  restaurant: 'When taking food orders, confirm items + quantities + delivery address. Mention estimated delivery time (30-45 minutes).',
  dental:     'NEVER diagnose or prescribe. For medical symptom questions say: "Please consult our doctor directly." When booking, confirm date + time + service.',
  salon:      'When booking, confirm service + stylist preference + date + time. Mention walk-in availability if slots are full.',
  clinic:     'NEVER diagnose or prescribe. Route all medical questions to doctors. When booking, confirm doctor + specialty + date + time.',
  realestate: 'Always qualify: ask budget + area + bedrooms if not mentioned. Only show relevant listings. When scheduling visit, confirm date + time.',
};

const systemPrompt = `You are ${d.agent_config.name}, an AI assistant for ${d.business_name}.

=== YOUR ROLE ===
${d.agent_config.prompt}

=== LIVE BUSINESS DATA (use this to answer questions accurately) ===
${d.live_data_context || 'No live data available.'}

=== KNOWLEDGE BASE ===
${d.knowledge_base_text || 'No knowledge base configured.'}

=== CONVERSATION HISTORY ===
${d.conversation_history_text || 'This is the start of the conversation.'}

=== PREVIOUS CONTEXT ===
${d.existing_context ? JSON.stringify(d.existing_context.context_data) : 'New conversation.'}

=== NICHE-SPECIFIC INSTRUCTIONS ===
${nicheInstructions[d.niche] || 'Be helpful and professional.'}

=== RESPONSE RULES ===
- Reply in the same language the customer used (Urdu, Roman Urdu, or English)
- Keep responses under 200 words
- Never make up information not in your knowledge base or live data
- If asked for a human agent, reply: "Zaroor! Main aapko abhi hamare team se connect kar raha hoon."
- Today is: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'full' })}`;

return [{ json: { ...d, final_system_prompt: systemPrompt } }];
```

---

### NODE 8: If — Skip AI if Human Handoff
```
Condition type: Boolean
  Value 1 (Expression): {{ $json.needs_human_handoff }}
  Operation: Is Equal
  Value 2: false
True output → NODE 9 (OpenAI)
False output → NODE 10b (Handoff message builder)
```

---

### NODE 9: OpenAI Chat
```
Type: OpenAI
Action: Message a model
Credential: your OpenAI API credential (add key in n8n Credentials panel)
Model: GPT-4O (or gpt-4o-mini for lower cost)

Messages:
  Message 1:
    Role: System
    Prompt (Expression): {{ $json.final_system_prompt }}

  Message 2:
    Role: User
    Prompt (Expression): {{ $json.message_text }}

Options (click Add Option):
  Max Tokens: 400
  Temperature: 0.7
```

---

### NODE 10a: Code — Parse AI Reply + Extract Structured Data
```javascript
const aiReply = $input.first().json?.choices?.[0]?.message?.content
  || $input.first().json?.message?.content
  || 'Maafi chahta hoon, main is waqt jawab nahi de sakta. Thodi der baad dobara try karein.';

const d = $('Code — Build System Prompt').first().json;
const niche = d.niche;
const msg = d.message_text.toLowerCase();
const intent = d.detected_intent;

// Determine if n8n should create a DB record
let createRecord = false;
let recordType = null;
let recordData = null;

// eCommerce/Restaurant: create order on first contact or when order intent detected
if (['ecommerce','restaurant'].includes(niche)) {
  if (['product_inquiry','order_placement','address_provided','order_confirmed'].includes(intent)) {
    createRecord = true;
    recordType = 'order';

    // Try to extract items from message (simple heuristic)
    const itemPatterns = [
      /(\d+)\s*(piece|pcs|pc|item|x)\s+([a-zA-Z\s]+)/gi,
      /([a-zA-Z\s]+)\s+(size\s+[smlxl]+)/gi,
    ];
    let extractedItems = [];
    for (const pattern of itemPatterns) {
      const matches = [...msg.matchAll(pattern)];
      if (matches.length > 0) {
        extractedItems = matches.map(m => ({ name: m[0], qty: 1, price: 0 }));
        break;
      }
    }

    recordData = {
      tenant_id: d.tenant_id,
      conversation_id: d.conversation_id,
      customer_phone: d.customer_phone,
      customer_name: d.customer_name,
      niche: niche,
      items: extractedItems.length > 0 ? extractedItems : [{ name: 'Item from chat', qty: 1, price: 0 }],
      status: niche === 'restaurant' ? 'pending' : 'pending_address',
      source: d.platform,
      handled_by: 'bot',
    };

    // If address detected, update status
    if (intent === 'address_provided') {
      recordData.status = 'pending';
      // Try to extract address
      const addressKeywords = ['dha','clifton','gulshan','phase','block','street','road','karachi'];
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

// Appointment niches: create appointment when booking intent detected
if (['dental','salon','clinic'].includes(niche)) {
  if (['booking_intent','appointment_confirmed'].includes(intent)) {
    createRecord = true;
    recordType = 'appointment';

    // Try to extract date/time from message or AI reply
    const timeMatch = (msg + ' ' + aiReply).match(/(\d{1,2})(:\d{2})?\s*(am|pm|AM|PM)/);
    const dayMatch = (msg + ' ' + aiReply).match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|kal|parso)/i);

    let apptDate = null;
    let apptTime = null;

    if (dayMatch) {
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

    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
      apptTime = `${String(hour24).padStart(2,'0')}:00:00`;
    }

    recordData = {
      tenant_id: d.tenant_id,
      conversation_id: d.conversation_id,
      patient_name: d.customer_name,
      patient_phone: d.customer_phone,
      niche: niche,
      service_type: 'Consultation', // default — AI will refine
      appointment_date: apptDate,
      appointment_time: apptTime,
      status: intent === 'appointment_confirmed' ? 'confirmed' : 'pending',
      is_new_patient: !d.existing_context,
    };
  }
}

// Real estate: create lead on first property inquiry
if (niche === 'realestate') {
  if (['property_inquiry','requirement_provided','visit_request'].includes(intent)) {
    createRecord = true;
    recordType = 'lead';

    // Extract budget (simple pattern: number + crore/lakh)
    const budgetMatch = msg.match(/(\d+\.?\d*)\s*(crore|lakh|cr|lac)/i);
    let budgetMax = null;
    if (budgetMatch) {
      const num = parseFloat(budgetMatch[1]);
      const unit = budgetMatch[2].toLowerCase();
      budgetMax = ['crore','cr'].includes(unit) ? num * 10000000 : num * 100000;
    }

    // Extract bedrooms
    const bedMatch = msg.match(/(\d+)\s*(bed|bedroom|br)/i);

    recordData = {
      tenant_id: d.tenant_id,
      conversation_id: d.conversation_id,
      customer_name: d.customer_name,
      customer_phone: d.customer_phone,
      intent: msg.includes('rent') ? 'rent' : msg.includes('sell') ? 'sell' : 'buy',
      bedrooms: bedMatch ? parseInt(bedMatch[1]) : null,
      budget_max: budgetMax,
      stage: intent === 'visit_request' ? 'visit_scheduled' :
             intent === 'requirement_provided' ? 'qualified' : 'new_inquiry',
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

### NODE 10b: Code — Handoff Message Builder (connects from NODE 8 false output)
```javascript
const d = $input.first().json;
return [{
  json: {
    ...d,
    ai_reply: `Zaroor! Main aapko abhi hamare team se connect kar raha hoon. Ek second please. 🙏`,
    create_record: false,
    needs_human_handoff: true,
  }
}];
```

---

### NODE 11: If — Should Create DB Record?
```
Type: If
Condition type: Boolean
  Value 1 (Expression): {{ $json.create_record }}
  Operation: Is Equal
  Value 2: true
True output → NODE 12 (Switch by record type)
False output → NODE 15 (Save AI reply)
```

---

### NODE 12: Switch — Which Table to Write?
```
Value: {{ $json.record_type }}
Output 0: order         → NODE 13a
Output 1: appointment   → NODE 13b
Output 2: lead          → NODE 13c
```

---

### NODE 13a: HTTP Request — Upsert into orders table
```
Type: HTTP Request
Method: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/orders
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: resolution=merge-duplicates,return=representation
Body: {{ JSON.stringify($json.record_data) }}
```

**Why upsert not insert:** If customer sends multiple messages (first "I want red kurti" then "size M" then "address is DHA"), you don't want 3 separate order rows. Use conversation_id as conflict key.

Add unique constraint for this to work:
```sql
ALTER TABLE public.orders ADD CONSTRAINT unique_conversation_order 
UNIQUE (conversation_id);
```

---

### NODE 13b: HTTP Request — Upsert into appointments table
```
Same structure as 13a but URL: .../rest/v1/appointments
Add constraint:
ALTER TABLE public.appointments ADD CONSTRAINT unique_conversation_appointment 
UNIQUE (conversation_id);
```

---

### NODE 13c: HTTP Request — Upsert into leads table
```
Same structure as 13a but URL: .../rest/v1/leads
Add constraint:
ALTER TABLE public.leads ADD CONSTRAINT unique_conversation_lead 
UNIQUE (conversation_id);
```

---

### NODE 14: Code — Merge Record Write Results Back
```javascript
// After all 3 table write branches, collect results
// Connect 13a, 13b, 13c all into here
const result = $input.first().json;
const base = $('Code — Parse AI Reply').first().json;
return [{ json: { ...base, db_record_written: true, written_id: result?.[0]?.id || result?.id } }];
```
→ Connect to NODE 15

---

### NODE 15: HTTP Request — Save AI Reply to messages table
```
Type: HTTP Request
Method: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/messages
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: return=representation
Body:
{
  "conversation_id": "{{ $json.conversation_id }}",
  "sender_type": "bot",
  "content": "{{ $json.ai_reply }}",
  "tenant_id": "{{ $json.tenant_id }}"
}
```

---

### NODE 16: HTTP Request — Update conversation_context
```
Type: HTTP Request
Method: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/conversation_context
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: resolution=merge-duplicates
Body:
{
  "conversation_id": "{{ $json.conversation_id }}",
  "tenant_id": "{{ $json.tenant_id }}",
  "last_intent": "{{ $json.detected_intent }}",
  "funnel_stage": "{{ $json.funnel_stage }}",
  "context_data": {
    "last_message": "{{ $json.message_text }}",
    "last_ai_reply": "{{ $json.ai_reply }}",
    "record_type": "{{ $json.record_type }}",
    "written_id": "{{ $json.written_id }}",
    "updated_at": "{{ new Date().toISOString() }}"
  },
  "updated_at": "{{ new Date().toISOString() }}"
}
```

---

### NODE 17: If — Log Funnel Event?
```
Condition type: String
  Value 1 (Expression): {{ $json.funnel_stage }}
  Operation: Is Not Empty
True → NODE 18 (log event)
False → NODE 19 (platform router)
Both outputs → NODE 19
```

---

### NODE 18: HTTP Request — Insert Funnel Event
```
Type: HTTP Request
Method: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/funnel_events
Headers: (same service role headers)
Body:
{
  "tenant_id": "{{ $json.tenant_id }}",
  "conversation_id": "{{ $json.conversation_id }}",
  "stage": "{{ $json.funnel_stage }}",
  "metadata": { "intent": "{{ $json.detected_intent }}", "niche": "{{ $json.niche }}" }
}
```

---

### NODE 19: If — Human Handoff?
```
Condition type: Boolean
  Value 1 (Expression): {{ $json.needs_human_handoff }}
  Operation: Is Equal
  Value 2: true
True → NODE 20 (update conversation status)
False → NODE 21 (platform router)
Both outputs → NODE 21
```

---

### NODE 20: HTTP Request — Mark Conversation as Pending
```
Type: HTTP Request
Method: PATCH
URL: {{ $env.SUPABASE_URL }}/rest/v1/conversations?id=eq.{{ $json.conversation_id }}
Headers: (same service role headers)
Body: { "status": "pending" }
```

---

### NODE 21: Code — Build Platform-Specific Meta API Request
```javascript
const d = $input.first().json;
const metaToken = d.meta_credentials?.access_token || $env.META_ACCESS_TOKEN;
const phoneNumberId = d.meta_credentials?.phone_number_id || $env.META_PHONE_NUMBER_ID;
const igUserId = d.meta_credentials?.instagram_user_id || $env.INSTAGRAM_USER_ID;

let endpoint, payload;

if (d.platform === 'whatsapp') {
  endpoint = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  payload = {
    messaging_product: 'whatsapp',
    to: d.customer_phone,
    type: 'text',
    text: { body: d.ai_reply, preview_url: false }
  };
} else if (d.platform === 'instagram') {
  endpoint = `https://graph.facebook.com/v19.0/${igUserId}/messages`;
  payload = {
    recipient: { id: d.customer_phone },
    message: { text: d.ai_reply }
  };
} else {
  // messenger
  endpoint = `https://graph.facebook.com/v19.0/me/messages`;
  payload = {
    recipient: { id: d.customer_phone },
    message: { text: d.ai_reply }
  };
}

return [{ json: { ...d, meta_endpoint: endpoint, meta_payload: payload, meta_token: metaToken } }];
```

---

### NODE 22: HTTP Request — Send via Meta API
```
Type: HTTP Request
Method: POST
URL: {{ $json.meta_endpoint }}
Headers:
  Authorization: Bearer {{ $json.meta_token }}
  Content-Type: application/json
Body: {{ JSON.stringify($json.meta_payload) }}
Continue on Fail: true
```

---

## WORKFLOW 2: Status Notifier (Direction 2 — Owner Action → Customer)

**This is entirely new in v2. Does not exist in v1.**

**Trigger webhook path:** `autoflow-status-notifier`

When owner clicks Confirm/Dispatch/Deliver in Orders window → frontend PATCHes Supabase → Supabase DB Webhook → this workflow → WhatsApp to customer.

---

### NODE 1: Webhook Trigger
```
Path: autoflow-status-notifier
Method: POST
Authentication: Header Auth (same x-api-key credential)
```

---

### NODE 2: Code — Unpack Supabase Webhook Payload
```javascript
const body = $input.first().json;
// Supabase DB webhook sends: { type, record, old_record }
const tableType = body.type;   // 'orders' | 'appointments' | 'leads'
const newRecord = body.record;
const oldRecord = body.old_record;

// Only proceed if status actually changed
const statusField = tableType === 'leads' ? 'stage' : 'status';
if (newRecord[statusField] === oldRecord[statusField]) {
  return [{ json: { skip: true, reason: 'Status unchanged' } }];
}

// Avoid duplicate sends
if (newRecord.whatsapp_notified_status === newRecord[statusField]) {
  return [{ json: { skip: true, reason: 'Already notified for this status' } }];
}

return [{
  json: {
    table_type: tableType,
    record: newRecord,
    old_status: oldRecord[statusField],
    new_status: newRecord[statusField],
    customer_phone: newRecord.customer_phone || newRecord.patient_phone,
    tenant_id: newRecord.tenant_id,
    niche: newRecord.niche || tableType,
  }
}];
```

---

### NODE 3: If — Skip if no status change
```
Condition type: Boolean
  Value 1 (Expression): {{ $json.skip }}
  Operation: Is Not Equal
  Value 2: true
True output → NODE 4 (continue)
False output → (no connection — workflow stops)
```

---

### NODE 4: HTTP Request — Get Tenant Meta Credentials
```
Type: HTTP Request
Method: GET
URL: {{ $env.SUPABASE_URL }}/rest/v1/integration_credentials
Query:
  tenant_id: eq.{{ $json.tenant_id }}
  platform: eq.meta
  is_active: eq.true
Headers:
  apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
Continue on Fail: true
```

---

### NODE 5: Code — Build Status WhatsApp Message
```javascript
const d = $input.first().json;
const metaCreds = $('HTTP — Get Meta Credentials').first().json?.[0]?.credentials || {};

const r = d.record;
const status = d.new_status;
const tableType = d.table_type;
const name = r.customer_name || r.patient_name || 'Customer';

// Message templates per table type and status
const messages = {
  orders: {
    pending: `Hi ${name}! ✅ Hum ne aapka order receive kar liya hai. Hum jald confirm karein ge!`,
    confirmed: `Hi ${name}! 🎉 Aapka order confirm ho gaya!\n\nItems: ${JSON.stringify(r.items)}\nTotal: PKR ${r.order_amount || 'TBD'}\nAddress: ${r.delivery_address || 'Will confirm'}\n\nDelivery mein 30-45 minutes lagein ge. Shukriya! 🙏`,
    preparing: `Hi ${name}! 👨‍🍳 Aapka order prepare ho raha hai. Thori der mein ready ho jaega!`,
    dispatched: `Hi ${name}! 🚚 Aapka order dispatch ho gaya!\n\nHamara delivery rider aapke paas aa raha hai. 30 minutes mein pahunch jaega insha'Allah!`,
    delivered: `Hi ${name}! ✅ Aapka order deliver ho gaya!\n\nHumein umeed hai aap ko pasand aaya hoga. Koi issue ho to please humein WhatsApp karein. Shukriya aapke trust ke liye! ❤️`,
    cancelled: `Hi ${name}. Aapka order cancel kar diya gaya hai. Koi sawal ho to please contact karein.`,
  },
  appointments: {
    pending: `Hi ${name}! 📅 Hum ne aapki appointment request receive kar li hai. Hum jald confirm karein ge!`,
    confirmed: `Hi ${name}! ✅ Aapki appointment confirm ho gayi!\n\nService: ${r.service_type}\nDate: ${r.appointment_date}\nTime: ${r.appointment_time}\nDoctor/Stylist: ${r.doctor_name || 'TBD'}\n\nPlease 10 minutes pehle arrive karein. Shukriya! 🙏`,
    completed: `Hi ${name}! Visit karne ka shukriya! 😊 Hum ne aapka record update kar diya hai. Agle appointment ke liye kabhi bhi message karein!`,
    cancelled: `Hi ${name}. Aapki appointment cancel kar di gayi hai. Dobara book karne ke liye message karein.`,
    no_show: `Hi ${name}. Aaj aap appoint appointment pe nahi aaye. Dobara schedule karne ke liye reply karein.`,
  },
  leads: {
    qualified: `Hi ${name}! 🏠 Shukriya apni requirements share karne ka! Hum ne aapke liye matching properties search kar li hain. Main abhi aapko list share karta hoon!`,
    properties_sent: `Hi ${name}! Yeh properties aapki requirements ke mutabiq hain. Koi bhi pasand aaye to bataein — hum site visit arrange kar sakte hain! 🗓️`,
    visit_scheduled: `Hi ${name}! ✅ Aapki site visit confirm ho gayi!\n\nDate: ${r.last_activity_at ? new Date(r.last_activity_at).toLocaleDateString('en-PK') : 'TBD'}\n\nHamara agent aapko lene aajega. Koi sawaal ho to reply karein! 🏡`,
    closed_won: `Congratulations ${name}! 🎉 Deal complete ho gayi! Welcome to your new property. Hum ne aapka record update kar diya hai. Future mein koi zaroorat ho please humein contact karein!`,
    closed_lost: null, // Don't message if lost
  }
};

const msgTemplate = messages[tableType]?.[status];
if (!msgTemplate) {
  return [{ json: { skip: true, reason: `No message template for ${tableType}:${status}` } }];
}

const metaToken = metaCreds.access_token || $env.META_ACCESS_TOKEN;
const phoneNumberId = metaCreds.phone_number_id || $env.META_PHONE_NUMBER_ID;

return [{
  json: {
    ...d,
    whatsapp_message: msgTemplate,
    meta_token: metaToken,
    phone_number_id: phoneNumberId,
  }
}];
```

---

### NODE 6: If — Skip if no message for this status
```
Condition type: Boolean
  Value 1 (Expression): {{ $json.skip }}
  Operation: Is Not Equal
  Value 2: true
True output → NODE 7 (send WhatsApp)
False output → (no connection — workflow stops)
```

---

### NODE 7: HTTP Request — Send WhatsApp Status Message
```
Type: HTTP Request
Method: POST
URL: https://graph.facebook.com/v19.0/{{ $json.phone_number_id }}/messages
Headers:
  Authorization: Bearer {{ $json.meta_token }}
  Content-Type: application/json
Body:
{
  "messaging_product": "whatsapp",
  "to": "{{ $json.customer_phone }}",
  "type": "text",
  "text": { "body": "{{ $json.whatsapp_message }}" }
}
Continue on Fail: true
```

---

### NODE 8: HTTP Request — Update whatsapp_notified_status (prevents duplicates)
```javascript
// Code Node: build PATCH URL
const d = $input.first().json;
const tableMap = { orders: 'orders', appointments: 'appointments', leads: 'leads' };
const table = tableMap[d.table_type];
const statusField = d.table_type === 'leads' ? 'stage' : 'status';

return [{
  json: {
    ...d,
    patch_url: `${$env.SUPABASE_URL}/rest/v1/${table}?id=eq.${d.record.id}`,
    patch_body: { whatsapp_notified_status: d.new_status }
  }
}];
```

Then HTTP Request:
```
Method: PATCH
URL: {{ $json.patch_url }}
Headers: (service role)
Body: {{ JSON.stringify($json.patch_body) }}
```

---

## WORKFLOW 3: Appointment Reminder Cron (Same as v1, minor update)

```
Schedule: Every Hour
  ↓
Fetch appointments:
  - reminder_sent = false
  - status = confirmed
  - appointment_date = tomorrow (Pakistan timezone)
  ↓
Loop per appointment:
  ↓
Build message:
  "Hi [name]! 🔔 Reminder: [service_type] appointment tomorrow at [time] with [doctor_name].
   Please arrive 10 minutes early. Reply CANCEL to reschedule."
  ↓
Send WhatsApp (same NODE 22 structure from Workflow 1)
  ↓
PATCH appointments: reminder_sent = true
```

**Pakistan timezone fix for date comparison:**
```javascript
// In fetch node query params:
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
// Convert to PKT (UTC+5)
const pktOffset = 5 * 60 * 60 * 1000;
const pktTomorrow = new Date(tomorrow.getTime() + pktOffset);
const dateStr = pktTomorrow.toISOString().split('T')[0];
// Use dateStr in query: appointment_date=eq.{dateStr}
```

---

## WORKFLOW 4: Campaign Broadcaster (Same as v1)

```
Webhook: autoflow-campaign (POST from your campaign-service/frontend)
  ↓
Fetch contacts by segment from Supabase conversations table
  ↓
Verify template is APPROVED via Meta API
  ↓
Split In Batches (1 at a time)
  ↓
Send template message via Meta API
  ↓
Wait 50ms (rate limiting)
  ↓
Update campaign delivery stats in Supabase
```

---

## WORKFLOW 5: Lead Follow-up Cron (New in v2)

Automatically re-engages leads that went cold.

```
Schedule: Every 24 Hours (run at 10am PKT)
  ↓
Fetch cold leads:
  temperature = warm
  last_activity_at < 48 hours ago
  stage NOT IN (closed_won, closed_lost)
  ↓
Loop per lead:
  ↓
Build follow-up message:
  "Hi [name]! 👋 Kya aap abhi bhi [intent] properties mein interested hain?
   Hamare paas kuch nayi listings aayi hain. Batayein kya main share karun?"
  ↓
Send WhatsApp
  ↓
Update lead: temperature = cold, last_activity_at = now
```

---

## Part 5: How Orders Window Connects to All This

### What your Orders Window frontend needs to do

When owner clicks a status button (Confirm / Dispatch / Deliver / Cancel), your frontend should:

```typescript
// In your Orders page component
const handleStatusUpdate = async (orderId: string, newStatus: string) => {
  // 1. PATCH Supabase — this triggers DB webhook → n8n automatically
  const { error } = await supabase
    .from('orders')         // or 'appointments' or 'leads'
    .update({ 
      status: newStatus,
      confirmed_at: newStatus === 'confirmed' ? new Date().toISOString() : undefined,
      dispatched_at: newStatus === 'dispatched' ? new Date().toISOString() : undefined,
      delivered_at: newStatus === 'delivered' ? new Date().toISOString() : undefined,
    })
    .eq('id', orderId);

  // 2. Supabase Realtime fires → Orders window updates live for ALL users
  // 3. Supabase DB Webhook fires → n8n Workflow 2 → WhatsApp to customer
  // You do NOT need to call n8n manually from frontend
  
  if (error) console.error('Status update failed:', error);
};
```

### Realtime subscription in Orders Window

```typescript
// Subscribe to your orders/appointments/leads table
useEffect(() => {
  const channel = supabase
    .channel('orders-realtime')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders',
        filter: `tenant_id=eq.${tenantId}` },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        }
        if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => 
            o.id === payload.new.id ? payload.new : o
          ));
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [tenantId]);
```

---

## Part 6: Environment Variables (Complete)

```env
# Supabase
SUPABASE_URL=https://lntlthdcjazpempzltze.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://lntlthdcjazpempzltze.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Meta Cloud API
META_ACCESS_TOKEN=EAAx...permanent_system_user_token
META_PHONE_NUMBER_ID=108253102123984
META_WHATSAPP_BUSINESS_ACCOUNT_ID=109283019238472
META_APP_SECRET=your_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_custom_string
INSTAGRAM_USER_ID=17841474217763898

# n8n (your afaqautomationai.app.n8n.cloud instance)
N8N_WEBHOOK_URL=https://afaqautomationai.app.n8n.cloud/webhook/autoflow-master
N8N_STATUS_WEBHOOK_URL=https://afaqautomationai.app.n8n.cloud/webhook/autoflow-status-notifier
N8N_CAMPAIGN_WEBHOOK_URL=https://afaqautomationai.app.n8n.cloud/webhook/autoflow-campaign
N8N_API_KEY=your_generated_secret_key

# Service URLs (Railway)
AGENT_SERVICE_URL=https://agent-service-production.up.railway.app
WEBHOOK_SERVICE_URL=https://webhook-service-production.up.railway.app

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://afaq-automation-production.up.railway.app/api/oauth/google/callback
```

---

## Part 7: n8n Credentials to Set Up

```
1. Header Auth — for securing your webhooks
   Name: x-api-key
   Value: [your N8N_API_KEY]

2. OpenAI
   API Key: sk-proj-...

3. Google OAuth2 (for Calendar integration)
   Client ID + Secret + Scopes: https://www.googleapis.com/auth/calendar

4. HTTP Request Custom Auth (for Supabase calls)
   — Not needed if you hardcode service role key in HTTP nodes
   — Or set as n8n env variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

To add n8n environment variables:
```
n8n Settings → Environment Variables → Add:
  SUPABASE_URL = https://lntlthdcjazpempzltze.supabase.co
  SUPABASE_SERVICE_ROLE_KEY = eyJ...
  META_ACCESS_TOKEN = EAAx...
  META_PHONE_NUMBER_ID = 108253102123984
```
Then reference in any node as `{{ $env.SUPABASE_URL }}` etc.

---

## Part 8: Complete Testing Checklist

### Test Direction 1 (Customer → Orders Window)

```bash
# Step 1: Test n8n webhook directly
curl -X POST https://afaqautomationai.app.n8n.cloud/webhook/autoflow-master \
  -H "x-api-key: your_n8n_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "d42b0d39-391b-4bb2-bf8c-dd13b5edc2b4",
    "conversation_id": "test-conv-123",
    "message_text": "red kurti size M available hai?",
    "niche": "ecommerce",
    "platform": "whatsapp",
    "customer_phone": "923001234567",
    "customer_name": "Sara Ahmed",
    "agent_config": { "name": "ShopBot", "prompt": "You are a helpful fashion assistant." },
    "knowledge_base": [],
    "conversation_history": [],
    "integrations": {},
    "meta_credentials": {
      "phone_number_id": "YOUR_PHONE_NUMBER_ID",
      "access_token": "YOUR_META_TOKEN"
    }
  }'
```

```
□ n8n workflow runs without error
□ AI reply returned in response body
□ Row created in Supabase orders table with status: pending_address
□ Row created in Supabase funnel_events with stage: product_intent_detected  
□ conversation_context row created/updated
□ Bot message row inserted into messages table
□ WhatsApp delivered to 923001234567 test number
□ Orders window in CRM shows new order card
```

### Test Direction 1 — Appointment Niche

```bash
curl ... -d '{
  "message_text": "scaling karwani hai, kal slot hai?",
  "niche": "dental",
  ...
}'
```
```
□ appointments row created with status: pending
□ date extracted from message if present
□ Appointments window shows new pending card
```

### Test Direction 2 (Orders Window → Customer)

```
□ Open CRM Orders window
□ Find the test order created above
□ Click "Confirm Order" button
□ Supabase orders.status changes to 'confirmed'
□ Supabase DB Webhook fires (check Supabase Webhooks logs)
□ n8n Status Notifier workflow runs
□ WhatsApp confirmation message delivered to customer phone
□ Check orders.whatsapp_notified_status = 'confirmed' in Supabase
□ Click "Dispatch" → customer gets dispatch WhatsApp
□ Click "Delivered" → customer gets delivery confirmation
```

### Test Direction 2 — Appointment

```
□ Open Appointments window
□ Click "Confirm Appointment"
□ appointments.status = 'confirmed'
□ Customer gets: "Aapki appointment confirm ho gayi! Date: ... Time: ..."
```

---

## Part 9: Workflow Summary Map

```
WORKFLOW 1: Master Handler
  trigger: agent-service POST
  fires on: every customer message
  creates: orders / appointments / leads rows
  updates: messages, conversation_context, funnel_events
  sends: AI reply via Meta API

WORKFLOW 2: Status Notifier  ← NEW in v2
  trigger: Supabase DB webhook on UPDATE
  fires on: owner clicks status button in Orders Window
  reads: orders / appointments / leads updated row
  sends: status WhatsApp to customer
  updates: whatsapp_notified_status to prevent duplicates

WORKFLOW 3: Reminder Cron
  trigger: every hour
  fires on: appointments due tomorrow with reminder_sent=false
  sends: reminder WhatsApp
  updates: reminder_sent = true

WORKFLOW 4: Campaign Broadcaster
  trigger: webhook from campaign-service
  fires on: owner launches campaign
  sends: approved template messages to contact segment
  updates: campaign stats

WORKFLOW 5: Lead Follow-up Cron  ← NEW in v2
  trigger: every 24h at 10am PKT
  fires on: warm leads with no activity in 48h
  sends: re-engagement WhatsApp
  updates: lead temperature = cold
```

---

## Common Errors + Fixes (Updated)

| Error | Cause | Fix |
|---|---|---|
| Workflow 2 not firing | Supabase DB webhook not configured | Set up in Supabase Dashboard → Database → Webhooks |
| Duplicate WhatsApp status messages | whatsapp_notified_status not set | Ensure NODE 8 in Workflow 2 runs successfully |
| Orders window not updating live | Realtime subscription missing | Add `useEffect` with `supabase.channel()` in Orders page |
| Upsert failing on duplicate conversation | Unique constraint missing | Run: `ALTER TABLE orders ADD CONSTRAINT unique_conversation_order UNIQUE (conversation_id)` |
| AI reply goes to wrong platform | platform field not set | Check webhook-service sets platform correctly on all channels |
| Calendar slots in wrong timezone | n8n uses UTC | Use `timeZone: 'Asia/Karachi'` in all date formatting |
| n8n webhook 404 | Workflow not activated | Click the Activate toggle (top right of workflow editor) |
| Supabase insert fails 403 | Using anon key not service role | Set `SUPABASE_SERVICE_ROLE_KEY` in n8n env vars — never anon key |
| Meta API 400 "message undeliverable" | Phone number format wrong | Must be international format: `923001234567` not `03001234567` |
