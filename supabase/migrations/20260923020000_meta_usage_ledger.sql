-- ============================================================
-- Meta WhatsApp Paid Usage & Conversation Billing Ledger
-- Tracks Marketing, Utility, Authentication, and Service (Oct 1+)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meta_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number_id TEXT,
  waba_id TEXT,
  meta_message_id TEXT,
  meta_conversation_id TEXT,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication', 'service', 'unknown')),
  origin_type TEXT,
  billable BOOLEAN DEFAULT true,
  pricing_model TEXT DEFAULT 'CBP',
  recipient_phone TEXT,
  country_code TEXT DEFAULT 'PK',
  estimated_cost_usd NUMERIC(10, 5) DEFAULT 0,
  estimated_cost_pkr NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'delivered',
  timestamp TIMESTAMPTZ DEFAULT now(),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for lightning fast back office queries & tenant aggregation
CREATE INDEX IF NOT EXISTS idx_meta_ledger_tenant ON public.meta_usage_ledger(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_meta_ledger_cat ON public.meta_usage_ledger(category);
CREATE INDEX IF NOT EXISTS idx_meta_ledger_conv ON public.meta_usage_ledger(meta_conversation_id);
CREATE INDEX IF NOT EXISTS idx_meta_ledger_phone ON public.meta_usage_ledger(phone_number_id);

-- Enable RLS
ALTER TABLE public.meta_usage_ledger ENABLE ROW LEVEL SECURITY;

-- Super Admin can see all ledger entries
CREATE POLICY "Super admin can view all meta ledger entries"
  ON public.meta_usage_ledger FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- Tenants can view only their own billable usage
CREATE POLICY "Tenants can view own meta ledger"
  ON public.meta_usage_ledger FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Service role can insert/update ledger entries from webhook service
CREATE POLICY "Service role can manage meta ledger"
  ON public.meta_usage_ledger FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add category breakdown columns to usage_metrics if not already present
ALTER TABLE public.usage_metrics 
  ADD COLUMN IF NOT EXISTS meta_marketing_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_utility_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_auth_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_service_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_total_cost_usd NUMERIC(10, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_total_cost_pkr NUMERIC(10, 2) DEFAULT 0;
