# Implementation Plan — Step-by-Step Build Sequence
## Ittisalo — AI-Powered Omnichannel WhatsApp CRM

**Version:** 1.0 | **Date:** July 12, 2026  
**Reference:** [PRD.md](./PRD.md) · [TRD.md](./TRD.md) · [BACKEND_SCHEMA.md](./BACKEND_SCHEMA.md)

---

## Build Philosophy

> **Foundation first. Never skip a layer.**  
> Each phase depends on the one before it. The AI agent cannot reply if the webhook service doesn't exist. The dashboard can't show orders if the orders table doesn't exist. Follow the sequence.

---

## Phase 1 — Foundation: Database, Auth & Project Scaffold

**Goal:** A working Next.js app with Supabase auth, multi-tenant schema, and login.

| Step | Task | Files/Tables | Depends On |
|------|------|-------------|------------|
| 1.1 | Initialize Next.js 16 project with TailwindCSS v4, TypeScript | `package.json`, `tsconfig.json`, `next.config.ts` | — |
| 1.2 | Set up Supabase project (hosted) — get URL + keys | `.env.local`, `.env.example` | — |
| 1.3 | Create Supabase client files (browser, server, service, middleware) | `lib/supabase/client.ts`, `server.ts`, `service.ts`, `middleware.ts` | 1.2 |
| 1.4 | Run initial schema migration — tenants, users, conversations, messages, agents, subscriptions | `supabase/migrations/20260505000000_initial_schema.sql` | 1.2 |
| 1.5 | Create auth trigger — auto-create tenant + user on signup | `supabase/migrations/20260505000001_auth_trigger.sql` | 1.4 |
| 1.6 | Create integrations table (platform → tenant routing) | `supabase/migrations/20260505000002_integrations_table.sql` | 1.4 |
| 1.7 | Enable RLS on all tables with tenant isolation policies | Included in 1.4 | 1.4 |
| 1.8 | Build login page (`/login`) — email/password + forgot password | `app/login/page.tsx` | 1.3 |
| 1.9 | Build auth callback route for password reset (PKCE) | `app/auth/callback/route.ts` | 1.3 |
| 1.10 | Build update-password page | `app/update-password/page.tsx` | 1.9 |

**✅ Verification:** User can sign up, log in, reset password. Tenant + user row created automatically.

---

## Phase 2 — App Shell: Layout, Sidebar, Onboarding

**Goal:** Authenticated users see a sidebar layout and complete onboarding.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 2.1 | Create NicheContext (stores selected niche in localStorage) | `context/NicheContext.tsx` | Phase 1 |
| 2.2 | Define niche configurations (6 verticals with AI config, stats, quick replies) | `lib/niches.ts` | — |
| 2.3 | Build AppShell (session check, route guards, header, profile dropdown) | `components/AppShell.tsx` | 2.1 |
| 2.4 | Build Sidebar (desktop icon rail + mobile bottom nav + mobile overlay) | `components/Sidebar.tsx` | 2.3 |
| 2.5 | Build TopBanner and MetaGateBanner | `components/TopBanner.tsx`, `MetaGateBanner.tsx` | 2.3 |
| 2.6 | Build root layout with providers | `app/layout.tsx` | 2.1, 2.3 |
| 2.7 | Build onboarding page (2-step: niche selection → business details) | `app/onboarding/page.tsx` | 2.1, 2.2 |
| 2.8 | Add niche column to tenants, update tenant on onboarding complete | Migration `20260520000000` | Phase 1 |

**✅ Verification:** New user → login → onboarding → selects niche → enters business info → sees dashboard shell.

---

## Phase 3 — Dashboard: Niche-Specific Metrics

**Goal:** A full dashboard with live stats, charts, and niche-specific widgets.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 3.1 | Create PlanContext (fetches tenant plan, limits, usage) | `context/PlanContext.tsx` | Phase 2 |
| 3.2 | Build Action Center dashboard (shown when Meta not connected) | `app/dashboard/page.tsx` | 3.1 |
| 3.3 | Build full niche-specific dashboard (stat cards, charts, live data) | `app/dashboard/page.tsx` | 3.1, Phase 2 |
| 3.4 | Implement Recharts charts (AreaChart for volume, PieChart for channels) | Dashboard page | — |
| 3.5 | Add Supabase Realtime subscriptions for live dashboard updates | Dashboard page | Phase 1 |
| 3.6 | Add WooCommerce live orders integration (eCommerce niche) | Dashboard page | Phase 1 |

**✅ Verification:** Dashboard shows real conversation/message counts from Supabase, charts render, real-time updates work.

---

## Phase 4 — Webhook Service: Meta Integration

**Goal:** Incoming WhatsApp/Instagram/Messenger messages are received, stored, and forwarded to n8n.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 4.1 | Scaffold Fastify webhook service with Dockerfile | `services/webhook-service/` | Phase 1 |
| 4.2 | Implement GET /webhook (Meta verification) | `server.js` | 4.1 |
| 4.3 | Implement POST /webhook (message receiver) | `server.js` | 4.1 |
| 4.4 | Build `processIncomingMessage()` — dedup, tenant lookup, conversation upsert, message insert | `server.js` | Phase 1 DB |
| 4.5 | Build n8n payload enrichment — KB, history, agent config, context, integrations | `server.js` | 4.4 |
| 4.6 | Implement human handoff gate (skip AI if status=pending) | `server.js` | 4.4 |
| 4.7 | Implement campaign delivery status tracking (`processMessageStatus`) | `server.js` | Phase 1 DB |
| 4.8 | Handle WhatsApp, Instagram, and Messenger message formats | `server.js` | 4.3 |
| 4.9 | Deploy webhook service to Railway, configure Meta webhook URL | Railway + Meta Dev Console | 4.1 |
| 4.10 | Register webhook in Meta Developer Console, verify | Meta Console | 4.9 |

**✅ Verification:** Send WhatsApp message → appears in Supabase messages table → n8n webhook fires.

---

## Phase 5 — AI Agent: n8n Workflow

**Goal:** AI agent receives messages, detects intent, generates responses, and replies on WhatsApp.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 5.1 | Create n8n Master Message Handler workflow | `docs/afaq_v4_complete_workflow.json` | Phase 4 |
| 5.2 | Configure webhook trigger node to receive enriched payload | n8n | 5.1 |
| 5.3 | Build intent detection node (order, appointment, lead, faq, escalation) | n8n | 5.2 |
| 5.4 | Build LLM call node (OpenAI GPT-4o with KB + history context) | n8n | 5.3 |
| 5.5 | Build entity extraction (items, prices, dates, addresses) | n8n | 5.4 |
| 5.6 | Build DB write nodes (orders, appointments, leads, conversation_context) | n8n | 5.5 |
| 5.7 | Build WhatsApp reply node (send via Meta Cloud API) | n8n | 5.6 |
| 5.8 | Build bot reply save node (insert into messages table as sender_type='agent') | n8n | 5.7 |
| 5.9 | Test end-to-end: customer message → AI response → saved in DB | — | 5.8 |

**✅ Verification:** Customer sends WhatsApp message → AI responds intelligently → order/appointment saved in DB.

---

## Phase 6 — Conversations Inbox

**Goal:** Unified chat inbox with real-time messages, quick replies, and human handoff.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 6.1 | Build conversations list (left panel) with search, filter, platform badges | `app/conversations/page.tsx` | Phase 4 |
| 6.2 | Build chat panel (right side) with message history | `app/conversations/page.tsx` | 6.1 |
| 6.3 | Implement message sending via Meta API (Next.js API route) | `app/api/chat/route.ts` | Phase 4 |
| 6.4 | Add Supabase Realtime for live message updates | Conversations page | Phase 1 |
| 6.5 | Implement quick replies from niche config | Conversations page | Phase 2 |
| 6.6 | Implement human handoff (assign to agent, set status=pending) | Conversations page | 4.6 |
| 6.7 | Add unread count badges and conversation status indicators | Conversations page | 6.1 |

**✅ Verification:** Open conversations → see real chats → type reply → customer receives on WhatsApp → new messages appear in real-time.

---

## Phase 7 — Orders, Appointments & Leads

**Goal:** Kanban boards for managing orders, appointments, and leads per niche.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 7.1 | Run v2 orders schema migration (orders, appointments, leads with niche support) | `supabase/migrations/20260607000000_v2_orders_window.sql` | Phase 1 |
| 7.2 | Build Orders page with niche-aware Kanban columns | `app/orders/page.tsx` | 7.1 |
| 7.3 | Implement status transitions (drag or button click) | Orders page | 7.2 |
| 7.4 | Add Supabase Realtime for live order/appointment updates | Orders page | 7.1 |
| 7.5 | Build order detail view with customer info, items, timeline | Orders page | 7.2 |

**✅ Verification:** AI creates order via n8n → appears on Kanban board → admin confirms → status updates.

---

## Phase 8 — Contacts, Templates & Media

**Goal:** Customer management, WhatsApp template management, and media library.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 8.1 | Build Contacts page (auto-created from conversations) | `app/contacts/page.tsx` | Phase 6 |
| 8.2 | Build Templates page (CRUD for WhatsApp message templates) | `app/templates/page.tsx` | Phase 1 |
| 8.3 | Build Templates API route (Meta template submission) | `app/api/templates/route.ts` | 8.2 |
| 8.4 | Build Media page (file upload and management) | `app/media/page.tsx` | Phase 1 |

**✅ Verification:** Contacts auto-populate from chats → templates submitted to Meta → media files uploadable.

---

## Phase 9 — Campaigns & Broadcasting

**Goal:** Send WhatsApp template campaigns to contact segments.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 9.1 | Run campaigns schema migration | `supabase/migrations/20260607100000_campaigns_and_messages.sql` | Phase 1 |
| 9.2 | Build Campaigns list page | `app/campaigns/page.tsx` | 9.1 |
| 9.3 | Build New Campaign page (template selection, contact segment, send) | `app/campaigns/new/page.tsx` | 9.2, 8.2 |
| 9.4 | Build Campaigns API route (broadcast logic) | `app/api/campaigns/route.ts` | 9.3 |
| 9.5 | Implement delivery status tracking via webhook service | `server.js` (processMessageStatus) | 4.7 |

**✅ Verification:** Create campaign → select template + contacts → send → see delivery stats update in real-time.

---

## Phase 10 — Plans, Billing & Super Admin

**Goal:** Subscription tiers with limits, usage tracking, and platform admin panel.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 10.1 | Run plans and limits migration | `supabase/migrations/20260622_plans_and_limits.sql` | Phase 1 |
| 10.2 | Run super admin migration | `supabase/migrations/20260623_super_admin.sql` | 10.1 |
| 10.3 | Build Pricing page (plan comparison, selection) | `app/pricing/page.tsx` | 10.1 |
| 10.4 | Build PlanContext with limit enforcement | `context/PlanContext.tsx` | 10.1 |
| 10.5 | Build Super Admin page (tenant list, plan management, suspend) | `app/admin/page.tsx` | 10.2 |
| 10.6 | Build SuperAdminGuard component | `components/SuperAdminGuard.tsx` | 10.2 |

**✅ Verification:** Tenant sees plan limits → super admin can view all tenants → can change plans and suspend.

---

## Phase 11 — Settings, Team & Reports

**Goal:** Business configuration, team management, and analytics.

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 11.1 | Run tenant settings migration | `supabase/migrations/20260626_tenant_settings_columns.sql` | Phase 1 |
| 11.2 | Build Settings page (tabbed: Business, Channels, Platform, Plan) | `app/settings/page.tsx` | 11.1 |
| 11.3 | Build Team page (invite members, assign roles) | `app/team/page.tsx` | Phase 1 |
| 11.4 | Build AI Agents page (agent config, KB management) | `app/agents/page.tsx` | Phase 1 |
| 11.5 | Build Reports page (analytics, charts, exports) | `app/reports/page.tsx` | Phase 3 |

**✅ Verification:** Update business settings → saved to DB → team members manageable → reports display analytics.

---

## Phase 12 — Production Hardening

**Goal:** Bug fixes, performance optimization, security audit, and polish.

| Step | Task | Depends On |
|------|------|------------|
| 12.1 | Fix Supabase RLS infinite recursion issues | Phase 10 |
| 12.2 | Add conversation deduplication and race-condition handling | Phase 4 |
| 12.3 | Add missing conversation columns (status, unread, assigned_to) | Phase 6 |
| 12.4 | Optimize database queries with proper indexes | Phase 7 |
| 12.5 | Mobile responsiveness testing and fixes | Phase 2 |
| 12.6 | Error boundary and graceful degradation for missing env vars | Phase 1 |
| 12.7 | Security audit: ensure no service_role_key exposure in client | All phases |
| 12.8 | Performance: lazy load heavy pages, optimize Realtime subscriptions | All phases |
| 12.9 | Deploy to production Railway with proper env vars | All phases |
| 12.10 | Meta webhook verification in production | Phase 4 |

**✅ Verification:** All pages load < 2s, no console errors, RLS enforced, mobile works, production stable.

---

## Dependency Graph

```
Phase 1 (Foundation)
  ├── Phase 2 (App Shell)
  │     ├── Phase 3 (Dashboard)
  │     ├── Phase 6 (Conversations)
  │     │     └── Phase 8 (Contacts, Templates)
  │     │           └── Phase 9 (Campaigns)
  │     └── Phase 11 (Settings, Team, Reports)
  ├── Phase 4 (Webhook Service)
  │     └── Phase 5 (AI Agent / n8n)
  │           └── Phase 7 (Orders, Appointments, Leads)
  └── Phase 10 (Plans, Billing, Admin)
        └── Phase 12 (Production Hardening)
```

---

## Current Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | ✅ Complete | Schema, auth, login all working |
| Phase 2 | ✅ Complete | AppShell, sidebar, onboarding deployed |
| Phase 3 | ✅ Complete | Full niche dashboards with real-time |
| Phase 4 | ✅ Complete | Webhook service production-ready on Railway |
| Phase 5 | ✅ Complete | n8n v4 workflow handling orders, appointments, leads |
| Phase 6 | ✅ Complete | Conversations inbox with real-time |
| Phase 7 | ✅ Complete | Orders Kanban with niche-specific pipelines |
| Phase 8 | ✅ Complete | Contacts, templates, media pages |
| Phase 9 | ✅ Complete | Campaign broadcasting with delivery tracking |
| Phase 10 | ✅ Complete | Plans, pricing, super admin panel |
| Phase 11 | ✅ Complete | Settings, team, agents, reports |
| Phase 12 | 🔄 In Progress | Ongoing bug fixes and optimization |
