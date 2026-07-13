# Technical Requirements Document (TRD)
## Ittisalo — AI-Powered Omnichannel WhatsApp CRM

**Version:** 1.0  
**Date:** July 12, 2026  
**Reference:** [PRD.md](./PRD.md)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Browser                              │
│                    Next.js 16 (React 19) SPA                        │
│          ┌──────────────────────────────────────────┐               │
│          │  AppShell → Sidebar + TopBanner + Pages  │               │
│          │  Contexts: NicheContext, PlanContext      │               │
│          │  Supabase Browser Client (SSR)            │               │
│          └───────────────────┬──────────────────────┘               │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        HOSTING: Railway                              │
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────────────────────────┐   │
│  │  Next.js App      │    │  Webhook Service (Fastify :3003)     │   │
│  │  (Frontend :3000) │    │  - Meta webhook verification         │   │
│  │  - SSR pages      │    │  - Message deduplication             │   │
│  │  - API routes     │    │  - Tenant resolution                 │   │
│  │    /api/campaigns │    │  - Conversation upsert               │   │
│  │    /api/orders    │    │  - n8n payload enrichment            │   │
│  │    /api/templates │    │  - Campaign status tracking          │   │
│  │    /api/chat      │    │  - Human handoff gate                │   │
│  └──────────────────┘    └──────────┬───────────────────────────┘   │
│                                     │                                │
│                                     │ POST (webhook payload)         │
│                                     ▼                                │
│                          ┌──────────────────┐                        │
│                          │  n8n Cloud        │                        │
│                          │  AI Workflow       │                        │
│                          │  - Intent detect   │                        │
│                          │  - LLM call        │                        │
│                          │  - DB writes        │                        │
│                          │  - WhatsApp reply   │                        │
│                          └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (Hosted)                             │
│                                                                      │
│  ┌────────────────┐  ┌────────────┐  ┌────────────────────────┐    │
│  │  PostgreSQL DB  │  │  Auth       │  │  Realtime              │    │
│  │  (RLS-enabled)  │  │  (Email +   │  │  (WebSocket channels)  │    │
│  │  20+ tables     │  │   Magic)    │  │  orders, messages,     │    │
│  └────────────────┘  └────────────┘  │  conversations           │    │
│                                      └────────────────────────┘    │
│  ┌────────────────┐                                                 │
│  │  Storage        │                                                 │
│  │  (KB files,     │                                                 │
│  │   media assets) │                                                 │
│  └────────────────┘                                                 │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIs                                     │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│  │  Meta Graph API   │  │  OpenAI API       │  │  WooCommerce    │   │
│  │  - WhatsApp       │  │  - GPT-4o         │  │  REST API       │   │
│  │  - Instagram      │  │  - GPT-4o-mini    │  │  - Orders       │   │
│  │  - Messenger      │  │                    │  │  - Products     │   │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.2.4 | SSR, routing, API routes |
| UI Library | React | 19.2.4 | Component rendering |
| Styling | TailwindCSS | 4.x | Utility-first CSS (via PostCSS) |
| Icons | Lucide React | 1.14.0 | Icon library (tree-shakeable) |
| Charts | Recharts | 3.8.1 | Dashboard charts (Area, Pie, Bar) |
| Font | Inter (Google Fonts) | — | Primary typeface |
| State | React Context | — | `NicheContext`, `PlanContext` |
| Auth Client | @supabase/ssr | 0.10.2 | Browser + server Supabase client |
| DB Client | @supabase/supabase-js | 2.105.3 | Supabase JavaScript SDK |

### 2.2 Backend Services

| Service | Technology | Port | Responsibility |
|---------|-----------|------|----------------|
| **Frontend** | Next.js | 3000 | SSR, static pages, API routes |
| **Webhook Service** | Fastify (Node.js) | 3003 | Meta webhook receiver, message processing, n8n trigger |
| **Auth Service** | Fastify (Node.js) | 3001 | User authentication (placeholder — uses Supabase Auth) |
| **Chat Service** | Fastify (Node.js) | 3004 | Message sending via Meta API |
| **Tenant Service** | Fastify (Node.js) | 3002 | Tenant provisioning (placeholder) |
| **Agent Service** | Fastify (Node.js) | 3005 | AI agent management (placeholder) |
| **Billing Service** | Fastify (Node.js) | 3006 | Subscription management (placeholder) |

> **Note:** The primary active services are the **Next.js frontend** and **Webhook Service**. Other services are scaffolded but currently handled through Supabase + Next.js API routes.

### 2.3 Database

| Component | Technology | Details |
|-----------|-----------|---------|
| Database | PostgreSQL (Supabase-managed) | Hosted, auto-scaling |
| ORM/Client | @supabase/supabase-js | Direct SQL queries via SDK |
| Auth | Supabase Auth | Email/password, magic link, password reset |
| Realtime | Supabase Realtime | WebSocket subscriptions on tables |
| Storage | Supabase Storage | File uploads (KB PDFs, media) |
| Security | Row-Level Security (RLS) | Tenant isolation on all tables |

### 2.4 AI / Automation

| Component | Technology | Details |
|-----------|-----------|---------|
| Workflow Engine | n8n (Cloud) | Visual workflow automation |
| LLM | OpenAI GPT-4o / GPT-4o-mini | AI responses (configurable per plan) |
| Intent Detection | n8n Code Node | Regex + LLM-based classification |
| Entity Extraction | n8n + LLM | Items, prices, dates, addresses |

### 2.5 Infrastructure

| Component | Technology | Details |
|-----------|-----------|---------|
| Hosting | Railway | Docker-based deployment |
| Containerization | Docker + Docker Compose | Multi-service orchestration |
| CI/CD | Git push → Railway auto-deploy | Automatic on push |
| Monitoring | Railway Logs + Fastify Logger | Application logging |

---

## 3. Authentication & Authorization

### 3.1 Auth Flow

```
User → /login → Supabase Auth (email/password)
  ↓
Supabase → returns JWT session
  ↓
AppShell → getSession() → check session
  ↓
If new user → /onboarding (select niche, enter business name)
If returning → /dashboard
If super_admin → /admin
If no session → /login
```

### 3.2 Auth Clients

| Client | File | Usage |
|--------|------|-------|
| **Browser Client** | `lib/supabase/client.ts` | Client-side queries (respects RLS) |
| **Server Client** | `lib/supabase/server.ts` | Server-side queries (SSR/API routes) |
| **Service Client** | `lib/supabase/service.ts` | Service-role key (bypasses RLS) |
| **Middleware** | `lib/supabase/middleware.ts` | Session refresh on navigation |

### 3.3 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| `admin` | Full access to their tenant's data. Manage team, settings, AI config. |
| `agent` | View conversations, respond to chats. Limited settings access. |
| `super_admin` | View ALL tenants. Manage plans, suspend accounts. Full platform control. |

### 3.4 Row-Level Security (RLS) Strategy

Every table with tenant data has RLS policies following this pattern:

```sql
-- Standard tenant isolation
CREATE POLICY "tenant_[table_name]" ON public.[table_name] FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));

-- Super admin override
CREATE POLICY "Super admin can view all [table_name]"
  ON public.[table_name] FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  ));
```

---

## 4. API Architecture

### 4.1 Next.js API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/campaigns` | GET/POST | List/create campaigns, broadcast messages |
| `/api/orders` | GET/POST/PUT | Manage orders |
| `/api/templates` | GET/POST/DELETE | Manage WhatsApp templates |
| `/api/chat` | POST | Send messages via Meta API |

### 4.2 Webhook Service Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /webhook` | GET | Meta webhook verification (hub.challenge) |
| `POST /webhook` | POST | Receive incoming messages from Meta |
| `GET /health` | GET | Health check |

### 4.3 n8n Webhook

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /webhook/ittisalo-master` | POST | Master message handler — receives enriched payload from webhook service |

---

## 5. Message Processing Pipeline

```
Meta Cloud API → POST /webhook
  ↓
1. Webhook Verification (GET /webhook — hub.challenge)
2. Parse webhook body:
   - WhatsApp: body.entry[].changes[].value.messages[]
   - Instagram: body.entry[].messaging[]
   - Messenger: body.entry[].messaging[]
  ↓
3. Deduplication Check (external_message_id uniqueness)
  ↓
4. Tenant Resolution (integrations table lookup by platform + account_id)
  ↓
5. Conversation Upsert (find or create by tenant_id + customer_phone)
  ↓
6. Message Insert (messages table)
  ↓
7. Human Handoff Gate (if status === 'pending', skip AI)
  ↓
8. Enrichment (parallel fetch):
   - Knowledge base entries (active, for this tenant)
   - Conversation history (last 10 messages, chronological)
   - Integration credentials (WooCommerce, etc.)
   - Agent config (name, prompt, tone, language)
   - Existing conversation context (intent, funnel stage)
  ↓
9. Fire n8n Webhook (POST /webhook/ittisalo-master) with full payload:
   {
     tenant_id, conversation_id, customer_phone, customer_name,
     platform, message, niche, business_name,
     wa_phone_number_id, wa_access_token,
     knowledge_base[], conversation_history[],
     existing_context, agent_config, integrations{}
   }
  ↓
10. n8n Workflow:
    - Detect intent (order, appointment, lead, faq, escalation)
    - Call LLM with knowledge base + history context
    - Extract entities (items, dates, amounts)
    - Save to DB (orders, appointments, leads, conversation_context)
    - Send reply via WhatsApp Cloud API
    - Save bot reply to messages table
```

---

## 6. Real-Time Data Flow

### 6.1 Supabase Realtime Subscriptions

The following tables have Supabase Realtime enabled:

| Table | Events | Consumer |
|-------|--------|----------|
| `conversations` | INSERT, UPDATE | Conversations page, Dashboard |
| `messages` | INSERT | Chat window (live message updates) |
| `orders` | INSERT, UPDATE | Orders page, Dashboard stat cards |
| `appointments` | INSERT, UPDATE | Dashboard, Orders page |
| `leads` | INSERT, UPDATE | Dashboard, Orders page |
| `funnel_events` | INSERT | Dashboard funnel analytics |
| `campaigns` | UPDATE | Campaign status tracking |
| `campaign_messages` | UPDATE | Per-message delivery tracking |

### 6.2 Client-Side Subscription Pattern

```typescript
const channel = supabase
  .channel('orders_realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
    fetchOrders(); // re-fetch on any change
  })
  .subscribe();

// Cleanup on unmount
return () => supabase.removeChannel(channel);
```

---

## 7. Environment Variables

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `SUPABASE_URL` | ✅ | Server | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Client | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server | Service role key (bypasses RLS) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Client | Aliased for browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Client | Aliased for browser |
| `META_APP_SECRET` | ✅ | Webhook | Meta app secret for verification |
| `META_WEBHOOK_VERIFY_TOKEN` | ✅ | Webhook | Custom verify token |
| `META_ACCESS_TOKEN` | ✅ | Webhook | Meta system user access token |
| `N8N_WEBHOOK_URL` | ✅ | Webhook | n8n master webhook endpoint |
| `N8N_API_KEY` | ⚪ | Webhook | n8n API key for auth |
| `STRIPE_SECRET_KEY` | ⚪ | Billing | Stripe key (future) |
| `STRIPE_WEBHOOK_SECRET` | ⚪ | Billing | Stripe webhook secret (future) |

---

## 8. Deployment Architecture

### 8.1 Docker Compose Services

```yaml
services:
  frontend:       # Next.js app (:3000)
  webhook-service: # Fastify webhook receiver (:3003)
  auth-service:    # Auth service (:3001) — placeholder
  tenant-service:  # Tenant service (:3002) — placeholder
  chat-service:    # Chat/messaging service (:3004)
  agent-service:   # Agent management (:3005) — placeholder
  billing-service: # Billing service (:3006) — placeholder
```

### 8.2 Railway Deployment

| Service | Railway Config |
|---------|---------------|
| Frontend | Dockerfile-based, port 3000 |
| Webhook Service | Dockerfile-based, port 3003, public URL for Meta webhooks |

---

## 9. Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| **Supabase Client** | Graceful null fallback if env vars missing (returns `null` client) |
| **Auth** | 2.5s fail-safe timeout on session check to prevent infinite loading |
| **Webhook** | Deduplication via `external_message_id` unique constraint |
| **n8n Trigger** | Try enriched payload first; fallback to minimal payload on error |
| **UI** | Loading spinners, error banners, empty state messages |
| **RLS** | All queries scoped to tenant; super_admin bypasses with explicit policies |

---

## 10. Performance Considerations

| Area | Implementation |
|------|---------------|
| **Database Indexes** | Composite indexes on `(tenant_id, status)`, `(tenant_id, stage)`, `(customer_phone)` |
| **Query Optimization** | Select only needed columns, `.maybeSingle()` for optional lookups |
| **Realtime Efficiency** | Subscribe to specific tables, unsubscribe on unmount |
| **Bundle Size** | Tree-shakeable Lucide icons, Recharts lazy loading |
| **Caching** | `PlanContext` caches tenant/plan data for the session |
| **N8n** | Fire-and-forget (non-blocking) webhook trigger to n8n |

---

## 11. Security Requirements

| Requirement | Implementation |
|-------------|---------------|
| Authentication | Supabase Auth (bcrypt password hashing, JWT tokens) |
| Authorization | RLS policies on all 20+ tables |
| Tenant Isolation | All data queries scoped via `tenant_id IN (SELECT ...)` |
| API Security | Service role key server-side only; anon key for browser |
| Webhook Security | Meta webhook verify token validation |
| Password Reset | Email-based reset via Supabase Auth + PKCE code exchange |
| Session Management | Supabase session with auto-refresh middleware |
| Super Admin | Hardcoded email check + DB role for elevated access |
