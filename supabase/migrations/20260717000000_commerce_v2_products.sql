-- ============================================================================
-- Ittisalo — Conversational Commerce V2
-- Tables: products
-- Alterations: tenants (default_currency)
-- ============================================================================

-- 1. Add default_currency to tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'PKR';

-- 2. Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    external_product_id TEXT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'PKR',
    image_url TEXT,
    product_url TEXT,
    stock_status TEXT DEFAULT 'instock',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, external_product_id)
);

-- 3. RLS Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant products"
  ON public.products FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant products"
  ON public.products FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant products"
  ON public.products FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can delete tenant products"
  ON public.products FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Super admin policies
CREATE POLICY "Super admin can view all products" ON public.products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  ));
CREATE POLICY "Super admin can manage all products" ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  ));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON public.products(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_products_tenant_active ON public.products(tenant_id, is_active);

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
