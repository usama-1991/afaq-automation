-- ============================================================================
-- AutoFlow AI — Phase 1 Foundation Migration
-- Tables: knowledge_base, integration_credentials, conversation_context,
--         orders, funnel_events + metadata column on tenants
-- ============================================================================

-- 0. Add metadata JSONB column to tenants (for Google Maps link, extra config)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- 1. AI Knowledge Base
-- Stores scraped website content, uploaded PDF text, custom instructions, FAQs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  kb_type TEXT NOT NULL DEFAULT 'text',
    -- 'url'             = scraped website page
    -- 'pdf'             = extracted text from uploaded PDF
    -- 'text'            = manually entered instructions / context
    -- 'faq'             = structured FAQ pairs
    -- 'product_catalog' = product catalog data
    -- 'menu'            = restaurant menu content
    -- 'location'        = Google Maps / address data
  title TEXT NOT NULL,
  content TEXT,              -- extracted / entered text content
  file_url TEXT,             -- for uploaded files (Supabase Storage URL)
  source_url TEXT,           -- for scraped website URLs
  metadata JSONB DEFAULT '{}', -- flexible extra data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant knowledge base"
  ON public.knowledge_base FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant knowledge base"
  ON public.knowledge_base FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant knowledge base"
  ON public.knowledge_base FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can delete tenant knowledge base"
  ON public.knowledge_base FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- ============================================================================
-- 2. Integration Credentials
-- Stores encrypted Shopify tokens, WooCommerce keys, Google Calendar OAuth, etc.
-- Distinct from the existing 'integrations' table which routes Meta messaging.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
    -- 'shopify', 'woocommerce', 'google_calendar', 'google_sheets',
    -- 'square', 'fresha', 'meta_pixel'
  credentials JSONB NOT NULL DEFAULT '{}',
    -- Shopify:      { store_url, access_token }
    -- WooCommerce:  { site_url, consumer_key, consumer_secret }
    -- Google Cal:   { client_id, client_secret, refresh_token }
    -- Google Sheets:{ api_key, spreadsheet_id }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, platform)
);

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their integration credentials"
  ON public.integration_credentials FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage their integration credentials"
  ON public.integration_credentials FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- ============================================================================
-- 3. Conversation Context
-- n8n writes here after every message. Dashboard reads to show live sidebar.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
    -- 'last_order', 'cart', 'lead_score', 'appointment',
    -- 'property_match', 'reservation', 'lead_source'
  context_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation context"
  ON public.conversation_context FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM public.conversations
    WHERE tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid())
  ));

CREATE POLICY "Users can insert conversation context"
  ON public.conversation_context FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.conversations
    WHERE tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid())
  ));

-- ============================================================================
-- 4. Orders Table
-- Every WhatsApp / Instagram / Messenger-driven order lives here.
-- Written by n8n when AI agent confirms an order.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  customer_phone TEXT,
  customer_name TEXT,

  -- Order details
  order_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'PKR',
  items JSONB DEFAULT '[]',
    -- [ { name, sku, qty, price } ]

  -- Status tracking
  status TEXT DEFAULT 'pending',
    -- 'pending' | 'confirmed' | 'shipped' | 'delivered'
    -- 'refund_requested' | 'refunded' | 'cancelled'

  -- Source tracking
  source TEXT DEFAULT 'whatsapp',
    -- 'whatsapp' | 'instagram' | 'messenger' | 'website'
  handled_by TEXT DEFAULT 'bot',
    -- 'bot' | 'human'

  -- External platform reference
  shopify_order_id TEXT,
  shopify_order_number TEXT,
  woocommerce_order_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant orders"
  ON public.orders FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant orders"
  ON public.orders FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant orders"
  ON public.orders FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- ============================================================================
-- 5. Funnel Events Table
-- Tracks every step of the conversion funnel (per conversation).
-- Written by n8n intent-detection nodes.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,

  stage TEXT NOT NULL,
    -- 'conversation_started'
    -- 'product_intent_detected'
    -- 'catalog_viewed'
    -- 'checkout_initiated'
    -- 'order_confirmed'
    -- 'refund_requested'
    -- 'refund_resolved'

  metadata JSONB DEFAULT '{}',
    -- { product_name, search_query, order_id, keywords_matched }

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant funnel events"
  ON public.funnel_events FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant funnel events"
  ON public.funnel_events FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- ============================================================================
-- 6. Enable Realtime for live dashboard refresh
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_base;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_context;
