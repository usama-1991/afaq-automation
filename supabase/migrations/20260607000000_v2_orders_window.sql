-- ============================================================================
-- Ittisalo — Phase 1 Codebase Migration Plan Schema Updates
-- Run this in Supabase SQL Editor or via Supabase CLI
-- Safe to run on existing databases (uses ADD COLUMN IF NOT EXISTS)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add new columns to orders
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'ecommerce';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS handled_by TEXT DEFAULT 'bot';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whatsapp';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS issue_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_notified_status TEXT;

-- Unique constraint: one order row per conversation (enables upsert)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS unique_conversation_order;
ALTER TABLE public.orders ADD CONSTRAINT unique_conversation_order UNIQUE (conversation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Add new columns to appointments
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'dental';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS estimated_revenue DECIMAL(10,2);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS whatsapp_notified_status TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Unique constraint: one appointment row per conversation (enables upsert)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS unique_conversation_appointment;
ALTER TABLE public.appointments ADD CONSTRAINT unique_conversation_appointment UNIQUE (conversation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Add new columns to leads
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_notified_status TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'warm';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS properties_sent JSONB DEFAULT '[]';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();

-- Unique constraint: one lead row per conversation (enables upsert)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS unique_conversation_lead;
ALTER TABLE public.leads ADD CONSTRAINT unique_conversation_lead UNIQUE (conversation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Enable Realtime (so Orders Window gets live updates)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['orders', 'appointments', 'leads', 'funnel_events', 'conversation_context'])
    LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
        END IF;
    END LOOP;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Indexes for performance (cron jobs and orders window queries)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON public.orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date ON public.appointments(tenant_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder ON public.appointments(reminder_sent, status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage ON public.leads(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads(temperature, last_activity_at);
CREATE INDEX IF NOT EXISTS idx_funnel_tenant ON public.funnel_events(tenant_id, stage, created_at);
