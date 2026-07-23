CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews for their tenant" 
  ON public.reviews FOR SELECT 
  USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage reviews for their tenant" 
  ON public.reviews FOR ALL 
  USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));
