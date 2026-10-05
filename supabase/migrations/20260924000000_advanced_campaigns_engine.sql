-- ============================================================================
-- Phase 4: Advanced Broadcast Audience Segmentation, Pacing & Analytics
-- ============================================================================

-- 1. Table for Saved Audience Segments
CREATE TABLE IF NOT EXISTS public.audience_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for audience_segments
ALTER TABLE public.audience_segments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audience_segments' AND policyname = 'Users can view tenant segments') THEN
    CREATE POLICY "Users can view tenant segments" ON public.audience_segments
      FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
  END IF;
END $$;

-- 2. Enhance campaigns table with variable mappings, pacing & analytics
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS variable_mappings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS segment_rules JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS rate_per_second INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS read_rate DECIMAL(5,2) DEFAULT 0.00;

-- 3. Granular Recipient Delivery Log
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    contact_phone TEXT NOT NULL,
    contact_name TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    meta_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON public.campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_meta_id ON public.campaign_recipients(meta_message_id);
