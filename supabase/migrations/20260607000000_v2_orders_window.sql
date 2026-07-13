-- ============================================================================
-- Ittisalo — v2 Migration: Orders Window Full Schema
-- Run this in Supabase SQL Editor
-- Safe to run on existing databases (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Create knowledge_base table (if it doesn't exist)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_base (
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

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Create conversation_context table (if it doesn't exist)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_context (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  context_type TEXT,
  context_data JSONB,
  last_intent TEXT,
  funnel_stage TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Create orders table (if it doesn't exist)
-- Supports both eCommerce and Restaurant niches
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
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

  -- Status maps to Orders window Kanban columns:
  -- ecommerce:  pending_address → confirmed → dispatched → delivered → cancelled
  -- restaurant: pending → confirmed → preparing → delivered → cancelled
  status TEXT DEFAULT 'pending_address',

  -- Who handles it
  handled_by TEXT DEFAULT 'bot',      -- 'bot' | 'human'
  source TEXT DEFAULT 'whatsapp',     -- 'whatsapp' | 'instagram' | 'messenger'
  issue_type TEXT,                    -- 'wrong_order' | 'late' | 'missing_item'

  -- Timestamps (Orders window uses these for display)
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Direction 2: prevents duplicate WhatsApp sends if DB webhook fires twice
  whatsapp_notified_status TEXT
);

-- Add new columns to orders if they don't exist (for existing tables)
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
-- STEP 4: Create funnel_events table (if it doesn't exist)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  conversation_id UUID REFERENCES public.conversations(id),
  stage TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Create appointments table (Dental, Salon, Clinic)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
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

-- Add new columns to appointments if they don't exist (for existing tables)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'dental';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS estimated_revenue DECIMAL(10,2);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS whatsapp_notified_status TEXT;

-- Unique constraint: one appointment row per conversation (enables upsert)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS unique_conversation_appointment;
ALTER TABLE public.appointments ADD CONSTRAINT unique_conversation_appointment UNIQUE (conversation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: Create leads table (Real Estate)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
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
  properties_sent JSONB DEFAULT '[]',
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Direction 2
  whatsapp_notified_status TEXT
);

-- Add new columns to leads if they don't exist (for existing tables)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_notified_status TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'warm';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS properties_sent JSONB DEFAULT '[]';

-- Unique constraint: one lead row per conversation (enables upsert)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS unique_conversation_lead;
ALTER TABLE public.leads ADD CONSTRAINT unique_conversation_lead UNIQUE (conversation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Create integration_credentials table (if it doesn't exist)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  platform TEXT,
  credentials JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, platform)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8: Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "tenant_knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "tenant_conv_context" ON public.conversation_context;
DROP POLICY IF EXISTS "tenant_orders" ON public.orders;
DROP POLICY IF EXISTS "tenant_funnel" ON public.funnel_events;
DROP POLICY IF EXISTS "tenant_appointments" ON public.appointments;
DROP POLICY IF EXISTS "tenant_leads" ON public.leads;
DROP POLICY IF EXISTS "tenant_integration_creds" ON public.integration_credentials;

-- Recreate policies
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

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 9: Enable Realtime (so Orders Window gets live updates)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_context;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 10: Indexes for performance (Orders window queries)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON public.orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date ON public.appointments(tenant_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder ON public.appointments(reminder_sent, status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage ON public.leads(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads(temperature, last_activity_at);
CREATE INDEX IF NOT EXISTS idx_funnel_tenant ON public.funnel_events(tenant_id, stage, created_at);
