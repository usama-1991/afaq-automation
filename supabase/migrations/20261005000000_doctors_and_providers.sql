-- ============================================================
-- Ittisalo — Doctors & Healthcare/Salon Providers Table
-- Supports multi-doctor sub-calendar mapping and shift scheduling
-- ============================================================

CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,                         -- e.g. "Orthodontics & Implants"
  email TEXT,
  phone TEXT,
  google_calendar_id TEXT DEFAULT 'primary', -- specific Google sub-calendar ID or 'primary'
  working_days INTEGER[] DEFAULT '{1,2,3,4,5,6}', -- 0=Sun, 1=Mon, ..., 6=Sat
  shift_start TIME DEFAULT '09:00:00',
  shift_end TIME DEFAULT '18:00:00',
  slot_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_providers_tenant_id ON public.providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_providers_active ON public.providers(tenant_id, is_active);

-- Enable Row Level Security
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'Users can view tenant providers'
  ) THEN
    CREATE POLICY "Users can view tenant providers" ON public.providers
      FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'Users can insert tenant providers'
  ) THEN
    CREATE POLICY "Users can insert tenant providers" ON public.providers
      FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'Users can update tenant providers'
  ) THEN
    CREATE POLICY "Users can update tenant providers" ON public.providers
      FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'Users can delete tenant providers'
  ) THEN
    CREATE POLICY "Users can delete tenant providers" ON public.providers
      FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;
END $$;

-- Add provider_id foreign key to appointments
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_provider ON public.appointments(provider_id);
