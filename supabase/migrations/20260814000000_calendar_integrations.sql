-- 1. ENUM FOR CALENDAR PROVIDERS
DO $$ BEGIN
    CREATE TYPE calendar_provider AS ENUM ('google', 'calendly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CALENDAR INTEGRATIONS TABLE (Tokens & Webhook Channels)
CREATE TABLE public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  
  -- OAuth Credentials (Must be stored securely / encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- External Account Identifiers
  external_user_id TEXT, -- Google email or Calendly user URI
  primary_calendar_id TEXT DEFAULT 'primary', -- Google Calendar ID
  webhook_subscription_id TEXT, -- Calendly Webhook UUID or Google Channel ID
  webhook_resource_id TEXT, -- Google Channel Resource ID
  webhook_expires_at TIMESTAMPTZ, -- Google Watch expiration date
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, provider)
);

-- 3. ADD MISSING COLUMNS TO EXISTING APPOINTMENTS TABLE
-- (The appointments table already exists from earlier migrations)
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS calendly_event_uri TEXT,
  ADD COLUMN IF NOT EXISTS calendly_invitee_uri TEXT,
  ADD COLUMN IF NOT EXISTS google_meet_link TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. CALENDAR SYNC LOGS (For Idempotency & Debugging)
CREATE TABLE public.calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  event_type TEXT NOT NULL, -- e.g., 'google.watch', 'calendly.invitee.created'
  external_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'error', 'skipped'
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS POLICIES
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant integrations" 
  ON public.calendar_integrations FOR ALL 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage their tenant sync logs" 
  ON public.calendar_sync_logs FOR ALL 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Indexing for high-performance free/busy queries
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments (tenant_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_google_event ON public.appointments (google_event_id);
CREATE INDEX IF NOT EXISTS idx_appointments_calendly_invitee ON public.appointments (calendly_invitee_uri);
