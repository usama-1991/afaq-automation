-- ============================================================
-- Ittisalo — Tenant Settings Columns Migration
-- Fix: Add missing columns to tenants table so each tenant
-- stores their own data instead of sharing defaults.
-- ============================================================

-- 1. Add missing settings columns to tenants table
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS website         TEXT,
  ADD COLUMN IF NOT EXISTS location        TEXT,
  ADD COLUMN IF NOT EXISTS owner_name      TEXT,
  ADD COLUMN IF NOT EXISTS catalog_link    TEXT,
  ADD COLUMN IF NOT EXISTS menu_link       TEXT,
  ADD COLUMN IF NOT EXISTS delivery_days   INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS min_order       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_enabled     BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS niche_settings  JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS admin_notes     TEXT,
  ADD COLUMN IF NOT EXISTS plan_changed_at TIMESTAMPTZ,
  -- Meta / WhatsApp fields (encrypted in production)
  ADD COLUMN IF NOT EXISTS wa_token_enc    TEXT,
  ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS wa_account_id  TEXT,
  ADD COLUMN IF NOT EXISTS meta_connected  BOOLEAN DEFAULT false;

-- 2. Add RLS policy so tenants can update their own row
CREATE POLICY IF NOT EXISTS "Tenants can update own row"
  ON public.tenants FOR UPDATE
  USING (id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- 3. Allow tenants to read their own row  
CREATE POLICY IF NOT EXISTS "Tenants can read own row"
  ON public.tenants FOR SELECT
  USING (id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND role = 'super_admin'));
