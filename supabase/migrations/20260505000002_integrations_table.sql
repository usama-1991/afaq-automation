-- Phase 3: Integrations Table for Meta Routing

CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('whatsapp', 'instagram', 'messenger')),
  external_account_id TEXT NOT NULL, -- The WhatsApp Business Phone Number ID, IG Account ID, etc.
  access_token TEXT, -- Optional: If each tenant provides their own Meta System User Token
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, external_account_id)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant integrations" 
  ON public.integrations FOR SELECT 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage tenant integrations" 
  ON public.integrations FOR ALL 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
