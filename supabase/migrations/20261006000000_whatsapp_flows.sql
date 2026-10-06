-- ============================================================================
-- Phase 3: Native Meta WhatsApp Flows (In-Chat Forms & Booking Engine)
-- ============================================================================

-- 1. WhatsApp Flows Table
CREATE TABLE IF NOT EXISTS public.whatsapp_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    flow_id TEXT NOT NULL UNIQUE, -- Meta Flow ID (e.g. 123456789)
    name TEXT NOT NULL,
    category TEXT DEFAULT 'OTHER', -- 'APPOINTMENT_BOOKING', 'LEAD_GENERATION', 'CUSTOMER_SUPPORT', 'ORDER_STATUS'
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'DEPRECATED', 'BLOCKED'
    flow_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    endpoint_uri TEXT,
    preview_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for whatsapp_flows
ALTER TABLE public.whatsapp_flows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_flows' AND policyname = 'Users can manage tenant flows') THEN
    CREATE POLICY "Users can manage tenant flows" ON public.whatsapp_flows
      FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
  END IF;
END $$;

-- 2. WhatsApp Flow Submissions Log
CREATE TABLE IF NOT EXISTS public.flow_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    flow_id TEXT NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    customer_phone TEXT NOT NULL,
    flow_token TEXT,
    response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_status TEXT DEFAULT 'completed', -- 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for flow_submissions
ALTER TABLE public.flow_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flow_submissions' AND policyname = 'Users can view tenant flow submissions') THEN
    CREATE POLICY "Users can view tenant flow submissions" ON public.flow_submissions
      FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_whatsapp_flows_tenant ON public.whatsapp_flows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_flows_status ON public.whatsapp_flows(status);
CREATE INDEX IF NOT EXISTS idx_flow_submissions_phone ON public.flow_submissions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_flow_submissions_flow ON public.flow_submissions(flow_id);
