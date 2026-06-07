-- ============================================================
-- Campaigns + Campaign Messages Tables
-- ============================================================

-- Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  segment_name TEXT NOT NULL DEFAULT 'All Contacts',
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'In Progress', 'Completed', 'Scheduled', 'Failed')),
  scheduled_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign Messages (per-contact delivery tracking)
CREATE TABLE IF NOT EXISTS public.campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  meta_message_id TEXT UNIQUE,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Enable RLS ────────────────────────────────────────────────
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

-- ── Templates RLS (table already exists from your manual creation) ─
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select tenant templates"
  ON public.templates FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant templates"
  ON public.templates FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant templates"
  ON public.templates FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can delete tenant templates"
  ON public.templates FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- ── Campaigns RLS ─────────────────────────────────────────────
CREATE POLICY "Users can select tenant campaigns"
  ON public.campaigns FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant campaigns"
  ON public.campaigns FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can delete tenant campaigns"
  ON public.campaigns FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- ── Campaign Messages RLS ─────────────────────────────────────
CREATE POLICY "Users can select tenant campaign_messages"
  ON public.campaign_messages FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant campaign_messages"
  ON public.campaign_messages FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant campaign_messages"
  ON public.campaign_messages FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- ── Realtime ──────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_messages;
