-- ============================================================
-- Phase 5: Meta Conversation Wallet & Unified App Usage Billing
-- Migration: 20261007000000_usage_billing.sql
-- ============================================================

-- ── 1. Update Plans Table with New Price Book Matrix ────────
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS price_pkr INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_usd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_phone_numbers INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_voice_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_ai_conversations INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS channels_allowed JSONB DEFAULT '["whatsapp"]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '[]'::jsonb;

-- Seed updated plans (Starter, Growth, Pro, Business)
INSERT INTO public.plans (
  id, label, price_pkr, price_usd, price_monthly, price_yearly, 
  max_phone_numbers, max_team_members, max_ai_conversations, max_voice_minutes,
  channels_allowed, key_features, ai_model, whatsapp_enabled, instagram_enabled, messenger_enabled, analytics_enabled
) VALUES
  (
    'starter', 'Starter Plan', 4999, 19, 4999, 49990,
    1, 2, 1000, 60,
    '["whatsapp"]'::jsonb,
    '["1 Phone Number", "WhatsApp Channel", "2 Team Seats", "1,000 AI Conversations/mo", "60 Voice Transcription Mins", "Knowledge Base & Team Inbox"]'::jsonb,
    'gpt-4o-mini', true, false, false, false
  ),
  (
    'growth', 'Growth Plan', 12999, 49, 12999, 129990,
    2, 3, 3000, 300,
    '["whatsapp", "instagram", "messenger"]'::jsonb,
    '["2 Phone Numbers", "WhatsApp + IG + Messenger", "3 Team Seats", "3,000 AI Conversations/mo", "300 Voice Transcription Mins", "Shopify & WooCommerce 2-Way Sync", "COD Native Flow Forms", "Appointment Booking Engine"]'::jsonb,
    'gpt-4o', true, true, true, true
  ),
  (
    'pro', 'Pro Plan', 27999, 99, 27999, 279990,
    3, 5, 8000, 1000,
    '["whatsapp", "instagram", "messenger", "web_widget"]'::jsonb,
    '["3 Phone Numbers", "All Channels + Web Chat", "5 Team Seats", "8,000 AI Conversations/mo", "1,000 Voice Transcription Mins", "COD Fraud Detection Network", "Sentiment-based Live Handoff", "Developer Webhooks & API"]'::jsonb,
    'gpt-4o', true, true, true, true
  ),
  (
    'business', 'Business Enterprise', 59999, 199, 59999, 599990,
    -1, 15, 20000, 3000,
    '["whatsapp", "instagram", "messenger", "web_widget"]'::jsonb,
    '["Custom Dedicated Numbers", "All Omnichannel Inboxes", "15+ Team Seats", "20,000+ AI Conversations/mo", "3,000+ Voice Transcription Mins", "Enterprise SLA & Dedicated Support", "Custom Multi-Doctor Routing", "Dedicated Onboarding"]'::jsonb,
    'gpt-4o', true, true, true, true
  )
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  price_pkr = EXCLUDED.price_pkr,
  price_usd = EXCLUDED.price_usd,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_phone_numbers = EXCLUDED.max_phone_numbers,
  max_team_members = EXCLUDED.max_team_members,
  max_ai_conversations = EXCLUDED.max_ai_conversations,
  max_voice_minutes = EXCLUDED.max_voice_minutes,
  channels_allowed = EXCLUDED.channels_allowed,
  key_features = EXCLUDED.key_features,
  ai_model = EXCLUDED.ai_model,
  whatsapp_enabled = EXCLUDED.whatsapp_enabled,
  instagram_enabled = EXCLUDED.instagram_enabled,
  messenger_enabled = EXCLUDED.messenger_enabled,
  analytics_enabled = EXCLUDED.analytics_enabled;

-- ── 2. Tenant Subscriptions & Wallet Balance ─────────────────
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL DEFAULT 'growth' REFERENCES public.plans(id) ON UPDATE CASCADE,
    currency TEXT NOT NULL DEFAULT 'PKR' CHECK (currency IN ('PKR', 'USD')),
    billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
    cycle_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    cycle_end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 10000.00, -- Initial simulated wallet balance
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'trial', 'canceled', 'suspended')),
    custom_limits JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_tenant_subscription UNIQUE (tenant_id)
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan ON public.tenant_subscriptions(plan_tier);

-- Enable RLS
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_subscriptions' AND policyname = 'Tenants can view own subscription') THEN
    CREATE POLICY "Tenants can view own subscription" ON public.tenant_subscriptions
      FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_subscriptions' AND policyname = 'Super admin can manage subscriptions') THEN
    CREATE POLICY "Super admin can manage subscriptions" ON public.tenant_subscriptions
      FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_subscriptions' AND policyname = 'Service role can manage subscriptions') THEN
    CREATE POLICY "Service role can manage subscriptions" ON public.tenant_subscriptions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 3. Tenant Live Usage Consumption Table ────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_usage_meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    billing_cycle_id TEXT NOT NULL, -- e.g. '2026-10'
    ai_conversations_count INTEGER NOT NULL DEFAULT 0,
    voice_transcription_seconds INTEGER NOT NULL DEFAULT 0,
    outbound_campaign_messages INTEGER NOT NULL DEFAULT 0,
    meta_conversations_total INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_tenant_cycle_usage UNIQUE (tenant_id, billing_cycle_id)
);

CREATE INDEX IF NOT EXISTS idx_usage_meters_tenant_cycle ON public.tenant_usage_meters(tenant_id, billing_cycle_id);

-- Enable RLS
ALTER TABLE public.tenant_usage_meters ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_usage_meters' AND policyname = 'Tenants can view own usage meters') THEN
    CREATE POLICY "Tenants can view own usage meters" ON public.tenant_usage_meters
      FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_usage_meters' AND policyname = 'Service role can manage usage meters') THEN
    CREATE POLICY "Service role can manage usage meters" ON public.tenant_usage_meters
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 4. Grandfather & Auto-Seed Existing Tenants ───────────────
-- Ensure all existing tenants have an active 'growth' subscription and meter row
INSERT INTO public.tenant_subscriptions (tenant_id, plan_tier, currency, wallet_balance, status)
SELECT 
  t.id, 
  'growth', 
  COALESCE(t.default_currency, 'PKR'), 
  15000.00, 
  'active'
FROM public.tenants t
ON CONFLICT (tenant_id) DO NOTHING;

-- Seed current month usage meter
INSERT INTO public.tenant_usage_meters (tenant_id, billing_cycle_id, ai_conversations_count, voice_transcription_seconds)
SELECT 
  t.id, 
  to_char(now(), 'YYYY-MM'),
  1240, -- Initial simulated realistic usage
  6720  -- 112 minutes
FROM public.tenants t
ON CONFLICT (tenant_id, billing_cycle_id) DO NOTHING;
