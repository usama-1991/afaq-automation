# Product Requirements Document (PRD)
## Ittisalo — AI-Powered Omnichannel WhatsApp CRM

**Version:** 1.0  
**Date:** July 12, 2026  
**Product Name:** Ittisalo  
**Author:** Usama Habib  

---

## 1. Product Vision

Ittisalo is a **multi-tenant, AI-powered omnichannel CRM** that enables small and medium businesses across Pakistan (and beyond) to automate customer conversations on **WhatsApp, Instagram, and Facebook Messenger** — from a single dashboard. An AI agent (powered by n8n + LLMs) handles inquiries, takes orders, books appointments, qualifies leads, and escalates to human agents when needed.

> **One-liner:** "An AI receptionist for every business on WhatsApp — that actually works."

---

## 2. Problem Statement

Small businesses in Pakistan (restaurants, dental clinics, salons, e-commerce stores, real estate agencies, medical clinics) handle hundreds of customer messages daily across WhatsApp and social media. They:

1. **Lose sales** because responses are slow or inconsistent.
2. **Cannot scale** — hiring agents is expensive and training takes time.
3. **Have no CRM** — conversations, orders, and leads live in personal WhatsApp.
4. **Lack analytics** — no visibility into conversion funnels, response times, or customer behavior.

---

## 3. Target Users

| Persona | Description | Pain Point |
|---------|-------------|------------|
| **Business Owner** | Runs a restaurant, shop, clinic, or agency. 1–20 staff. | Can't manage 200+ daily WhatsApp messages. Lost orders. |
| **Marketing Manager** | Handles broadcast campaigns, template messages. | No way to send approved WhatsApp template campaigns at scale. |
| **Support Agent** | Front-line agent handling customer chat manually. | Repetitive FAQ queries burn time; no unified inbox. |
| **Super Admin** | Platform operator (Ittisalo team). | Needs to onboard, monitor, and manage all tenants centrally. |

**Primary Market:** Pakistan (PKR currency, Urdu/English bilingual, WhatsApp-dominant)  
**Secondary Markets:** Middle East, Southeast Asia

---

## 4. Core Features

### 4.1 Multi-Tenant Architecture
- Each business (tenant) gets an isolated workspace with its own data, users, conversations, orders, and AI configuration.
- Tenant isolation enforced via Supabase Row-Level Security (RLS).
- Roles: `admin` (tenant owner), `agent` (team member), `super_admin` (platform operator).

### 4.2 Niche-Specific AI Agents
The platform ships with **6 pre-configured industry verticals** (niches), each with a tailored AI personality, knowledge base templates, dashboard metrics, and quick replies:

| Niche | AI Agent | Primary Function |
|-------|----------|------------------|
| 🍽️ Restaurant / Food | FoodBot | Take orders, manage reservations, handle menu queries |
| 🛍️ eCommerce / Fashion | ShopBot | Process orders, track deliveries, upsell products |
| 🦷 Dental Clinic | DentalBot | Book appointments, share pricing, send reminders |
| 🏠 Real Estate | PropBot | Qualify leads, match properties, schedule viewings |
| 💅 Salon / Spa | GlowBot | Book beauty appointments, manage stylist schedules |
| 🏥 Medical Clinic | MediBot | Schedule OPD appointments, share doctor availability |

### 4.3 Omnichannel Unified Inbox
- **WhatsApp Business API** — primary channel
- **Instagram Business** — DM inbox
- **Facebook Messenger** — page inbox
- Single conversation view with real-time message sync (Supabase Realtime)
- Human handoff: AI pauses when conversation status is set to `pending`
- Quick replies, message preview, unread count badges

### 4.4 AI Conversation Engine (n8n + LLM)
- **Webhook-driven pipeline**: Meta → Webhook Service → Supabase → n8n → LLM → WhatsApp reply
- Intent detection: Order, Appointment, Lead, FAQ, Escalation
- Knowledge base context injection (scraped URLs, PDFs, manual entries)
- Conversation history (last 10 messages) passed to LLM for context
- Auto-save detected entities (order items, appointment dates, lead details) to respective tables

### 4.5 Orders & Pipeline Management
- **Kanban board** for order lifecycle tracking (per niche):
  - eCommerce: `pending_address → confirmed → dispatched → delivered → cancelled`
  - Restaurant: `pending → confirmed → preparing → delivered → cancelled`
- Appointment scheduling for clinics, dental, salons
- Lead pipeline for real estate: `new_inquiry → qualified → properties_sent → visit_scheduled → closed_won/lost`
- WooCommerce live order sync (pull orders via REST API)

### 4.6 Campaign Broadcasting
- Create campaigns using approved WhatsApp message templates
- Segment contacts, broadcast at scale
- Track delivery metrics: `queued → sent → delivered → read → failed`
- Real-time status updates via webhook delivery receipts

### 4.7 Knowledge Base (AI Training Data)
- Upload PDFs, scrape URLs, enter FAQs manually
- Types: `url`, `pdf`, `text`, `faq`, `product_catalog`, `menu`, `location`
- Active/inactive toggle per KB entry
- Injected into n8n AI agent context on every message

### 4.8 Template Management
- Create and manage WhatsApp message templates
- Submit to Meta for approval
- Track approval status: `APPROVED`, `REJECTED`, `PENDING`
- Use in campaigns and quick replies

### 4.9 Contact Management
- Auto-create contacts from incoming conversations
- View per-contact: visit count, total spend, tags, last activity
- Manual contact creation with phone, email, tags

### 4.10 Team Management
- Invite team members via email
- Role assignment: `admin` or `agent`
- Conversation assignment for human handoff

### 4.11 Reports & Analytics Dashboard
- Niche-specific stat cards (orders, appointments, leads, revenue)
- Chat volume chart (7-day inbound vs outbound)
- Channel distribution pie chart (WhatsApp / Instagram / Messenger)
- AI Agent performance metrics (resolution %, escalation %, messages today)
- WooCommerce revenue sync for eCommerce niche

### 4.12 Settings & Configuration
- **Business Profile**: Name, phone, website, location, niche settings
- **Channels & APIs**: Meta connection status, WA phone number ID, access token
- **eCommerce Platform**: WooCommerce integration credentials
- **Plan Management**: Current plan, usage, upgrade options

### 4.13 Subscription & Billing
- 4 plan tiers: **Trial** (free, 14 days) → **Starter** → **Growth** → **Enterprise**
- Per-plan limits: conversations, agents, team members, templates, campaigns, KB entries
- Usage tracking per month with `usage_metrics` table
- Plan enforcement via `PlanContext` (React context)
- Pricing page for plan selection

### 4.14 Super Admin Panel
- Platform-wide tenant management
- View all tenants, users, and usage
- Change tenant plans, suspend/unsuspend
- Admin notes and audit trail

### 4.15 Onboarding Flow
- 2-step wizard:
  1. Select business niche (6 options)
  2. Enter business name and WhatsApp number
- Auto-provisions: tenant niche, AI agent config, trial plan

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Performance** | Dashboard loads in < 2 seconds |
| **Availability** | 99.5% uptime (Railway + Supabase hosted) |
| **Scalability** | Support 500+ concurrent tenants |
| **Security** | RLS on all tables, service_role_key server-side only, token encryption |
| **Responsiveness** | Mobile-first sidebar, bottom nav on mobile, desktop sidebar |
| **Real-time** | Supabase Realtime subscriptions for messages, orders, conversations |
| **Latency** | AI response to customer < 5 seconds (n8n → LLM → WhatsApp) |

---

## 6. Success Metrics (KPIs)

| Metric | Target |
|--------|--------|
| Tenant onboarding completion rate | > 80% |
| AI auto-resolution rate | > 60% |
| Average response time (AI) | < 3 seconds |
| Monthly active tenants | 50+ within 6 months |
| Order conversion rate (AI-assisted) | > 40% |
| Campaign delivery rate | > 95% |

---

## 7. Out of Scope (v1)

- Native mobile app (iOS / Android)
- Multi-language AI (beyond English/Urdu)
- Payment processing inside chat (Stripe integration planned but deferred)
- Voice/video call handling
- Custom workflow builder (n8n is the workflow engine, not exposed to tenants)
- Email channel support
- WhatsApp Flows (interactive forms)

---

## 8. Dependencies

| Dependency | Purpose |
|------------|---------|
| **Supabase** | Database (Postgres), Auth, Realtime, Storage |
| **Meta Business API** | WhatsApp, Instagram, Messenger messaging |
| **n8n** | AI workflow orchestration (cloud-hosted) |
| **OpenAI (GPT-4o / GPT-4o-mini)** | LLM for AI agent responses |
| **Railway** | Hosting (Next.js frontend + Fastify webhook service) |
| **WooCommerce REST API** | eCommerce order sync |
| **TailwindCSS v4** | UI styling |
| **Recharts** | Dashboard charts and analytics |

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Meta API rate limits | Messages dropped | Implement queuing, respect rate limits |
| LLM hallucination | Incorrect orders/appointments | Knowledge base grounding, human handoff gate |
| Supabase RLS misconfiguration | Data leak between tenants | Comprehensive RLS policies on all tables |
| n8n downtime | AI stops responding | Fallback: store messages, retry queue |
| Trial abuse | Free riders | 14-day trial with automatic downgrade |

---

## 10. Release Milestones

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Core schema, auth, onboarding, sidebar, dashboard | ✅ Done |
| **Phase 2** | Conversations inbox, real-time messages, AI agent | ✅ Done |
| **Phase 3** | Orders window, niche-specific pipelines | ✅ Done |
| **Phase 4** | Campaigns, templates, Meta template API | ✅ Done |
| **Phase 5** | Plans, billing, super admin panel | ✅ Done |
| **Phase 6** | Settings, team management, reports | ✅ Done |
| **Phase 7** | Polish, bug fixes, production hardening | 🔄 In Progress |
| **Phase 8** | Mobile optimization, advanced analytics | 📋 Planned |
