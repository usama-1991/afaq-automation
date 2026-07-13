-- ============================================================
-- Ittisalo — Plans, Limits & Meta Connection Schema
-- Migration: 20260622_plans_and_limits.sql
-- ============================================================

-- ── 1. Extend tenants table ─────────────────────────────────
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS business_name    TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS business_phone   TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS niche            TEXT DEFAULT 'general';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS website          TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS location         TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url         TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan             TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_status      TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS trial_ends_at    TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days');
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS meta_connected   BOOLEAN DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS wa_access_token  TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS wa_account_id    TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ig_page_id       TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS fb_page_id       TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS admin_notes      TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_changed_at  TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_changed_by  TEXT;

-- GRANDFATHER LOGIC: Upgrade all existing tenants (before this migration) to Enterprise so they aren't blocked.
UPDATE public.tenants
SET plan = 'enterprise',
    plan_status = 'active',
    onboarding_completed = true,
    meta_connected = true
WHERE plan IS NULL;

-- Now add defaults for future tenants
ALTER TABLE public.tenants ALTER COLUMN plan SET DEFAULT 'trial';
ALTER TABLE public.tenants ALTER COLUMN plan_status SET DEFAULT 'trial';

-- Add check constraints
ALTER TABLE public.tenants ADD CONSTRAINT plan_check CHECK (plan IN ('starter','growth','enterprise','trial'));
ALTER TABLE public.tenants ADD CONSTRAINT plan_status_check CHECK (plan_status IN ('active','suspended','trial','cancelled'));


-- ── 2. Plans config table (source of truth for limits) ──────
CREATE TABLE IF NOT EXISTS public.plans (
  id                   TEXT PRIMARY KEY,
  label                TEXT NOT NULL,
  price_monthly        INTEGER NOT NULL DEFAULT 0,
  price_yearly         INTEGER NOT NULL DEFAULT 0,
  max_conversations    INTEGER DEFAULT 500,   -- -1 = unlimited
  max_agents           INTEGER DEFAULT 1,
  max_team_members     INTEGER DEFAULT 2,
  max_templates        INTEGER DEFAULT 5,
  max_campaigns        INTEGER DEFAULT 2,
  max_kb_entries       INTEGER DEFAULT 10,
  ai_model             TEXT DEFAULT 'gpt-4o-mini',
  whatsapp_enabled     BOOLEAN DEFAULT true,
  instagram_enabled    BOOLEAN DEFAULT false,
  messenger_enabled    BOOLEAN DEFAULT false,
  analytics_enabled    BOOLEAN DEFAULT false,
  priority_support     BOOLEAN DEFAULT false,
  custom_branding      BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Seed plan tiers (upsert safe)
INSERT INTO public.plans (id,label,price_monthly,price_yearly,max_conversations,max_agents,max_team_members,max_templates,max_campaigns,max_kb_entries,ai_model,whatsapp_enabled,instagram_enabled,messenger_enabled,analytics_enabled,priority_support,custom_branding)
VALUES
  ('trial',      'Free Trial',  0,      0,       2000, 3,  5,  20,  10, 50,  'gpt-4o',      true,  true,  true,  true,  false, false),
  ('starter',    'Starter',     4999,   49999,   500,  1,  2,  5,   2,  10,  'gpt-4o-mini', true,  false, false, false, false, false),
  ('growth',     'Growth',      9999,   99999,   2000, 3,  5,  20,  10, 50,  'gpt-4o',      true,  true,  true,  true,  false, false),
  ('enterprise', 'Enterprise',  24999,  249999,  -1,   10, 25, 100, 50, 200, 'gpt-4o',      true,  true,  true,  true,  true,  true)
ON CONFLICT (id) DO UPDATE SET
  label             = EXCLUDED.label,
  price_monthly     = EXCLUDED.price_monthly,
  price_yearly      = EXCLUDED.price_yearly,
  max_conversations = EXCLUDED.max_conversations,
  max_agents        = EXCLUDED.max_agents,
  max_team_members  = EXCLUDED.max_team_members,
  max_templates     = EXCLUDED.max_templates,
  max_campaigns     = EXCLUDED.max_campaigns,
  max_kb_entries    = EXCLUDED.max_kb_entries,
  ai_model          = EXCLUDED.ai_model,
  whatsapp_enabled  = EXCLUDED.whatsapp_enabled,
  instagram_enabled = EXCLUDED.instagram_enabled,
  messenger_enabled = EXCLUDED.messenger_enabled,
  analytics_enabled = EXCLUDED.analytics_enabled,
  priority_support  = EXCLUDED.priority_support,
  custom_branding   = EXCLUDED.custom_branding;

-- ── 3. Usage metrics table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  month                  TEXT NOT NULL,         -- 'YYYY-MM'
  conversations_count    INTEGER DEFAULT 0,
  messages_sent          INTEGER DEFAULT 0,
  campaigns_sent         INTEGER DEFAULT 0,
  templates_submitted    INTEGER DEFAULT 0,
  kb_entries_count       INTEGER DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, month)
);

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant can view own usage"
  ON public.usage_metrics FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Super admin can read all plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read plans"
  ON public.plans FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Super admin can modify plans"
  ON public.plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- Super admin RLS for tenants: read ALL tenants
CREATE POLICY "Super admin can view all tenants"
  ON public.tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can update all tenants"
  ON public.tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- Super admin RLS for users: read ALL users
CREATE POLICY "Super admin can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u2
      WHERE u2.id = auth.uid() AND u2.role = 'super_admin'
    )
  );

-- ── 4. Helper: get current month usage for a tenant ─────────
CREATE OR REPLACE FUNCTION public.get_or_create_usage(p_tenant_id UUID)
RETURNS public.usage_metrics AS $$
DECLARE
  v_month TEXT := to_char(now(), 'YYYY-MM');
  v_row   public.usage_metrics;
BEGIN
  INSERT INTO public.usage_metrics (tenant_id, month)
  VALUES (p_tenant_id, v_month)
  ON CONFLICT (tenant_id, month) DO NOTHING;

  SELECT * INTO v_row FROM public.usage_metrics
  WHERE tenant_id = p_tenant_id AND month = v_month;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Trigger: expire trials automatically ──────────────────
-- (Run this as a scheduled pg_cron job or call from your service)
-- Moves expired trial tenants to 'starter' plan
CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS void AS $$
BEGIN
  UPDATE public.tenants
  SET plan = 'starter', plan_status = 'active'
  WHERE plan = 'trial'
    AND plan_status = 'trial'
    AND trial_ends_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
