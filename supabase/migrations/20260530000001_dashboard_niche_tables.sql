-- ============================================================================
-- AutoFlow — Phase 2 Industry Custom Niche Tables
-- Tables: restaurant_orders, appointments, price_list, leads, listings
-- ============================================================================

-- 1. Restaurant Orders Table
CREATE TABLE IF NOT EXISTS public.restaurant_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  customer_phone TEXT,
  customer_name TEXT,
  items JSONB DEFAULT '[]',         -- [{name, qty, price}]
  total_amount DECIMAL(12,2) DEFAULT 0,
  order_type TEXT DEFAULT 'delivery',     -- 'delivery' | 'takeaway' | 'dine_in' | 'bulk_event'
  status TEXT DEFAULT 'pending',         -- 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled'
  delivery_address TEXT,
  issue_type TEXT,     -- 'wrong_order' | 'late' | 'missing_item' | null
  order_placed_at TIMESTAMPTZ DEFAULT now(),
  order_confirmed_at TIMESTAMPTZ,
  order_delivered_at TIMESTAMPTZ
);

ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant restaurant_orders" ON public.restaurant_orders
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant restaurant_orders" ON public.restaurant_orders
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant restaurant_orders" ON public.restaurant_orders
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));


-- 2. Clinic & Salon Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  patient_name TEXT,
  patient_phone TEXT,
  doctor_name TEXT,     -- Or stylist name for Salons
  treatment_type TEXT,  -- Or service type for Salons
  appointment_date DATE,
  appointment_time TIME,
  status TEXT DEFAULT 'pending', -- 'pending'|'confirmed'|'completed'|'cancelled'|'no_show'
  is_new_patient BOOLEAN DEFAULT false,
  estimated_revenue DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant appointments" ON public.appointments
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant appointments" ON public.appointments
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant appointments" ON public.appointments
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));


-- 3. Price List Table (For estimating revenue)
CREATE TABLE IF NOT EXISTS public.price_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  treatment_name TEXT NOT NULL,
  price_min DECIMAL(12,2) DEFAULT 0,
  price_max DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.price_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant price_list" ON public.price_list
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage tenant price_list" ON public.price_list
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));


-- 4. Real Estate Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Requirement details (extracted by AI)
  intent TEXT,            -- 'buy' | 'rent' | 'sell'
  property_type TEXT,     -- 'apartment' | 'house' | 'plot' | 'commercial'
  area_preference TEXT,
  bedrooms INTEGER,
  budget_min DECIMAL(15,2) DEFAULT 0,
  budget_max DECIMAL(15,2) DEFAULT 0,
  
  -- Pipeline stage
  stage TEXT DEFAULT 'new_inquiry',
  -- 'new_inquiry' | 'qualified' | 'properties_sent' | 'visit_scheduled' | 'closed_won' | 'closed_lost'
  
  temperature TEXT DEFAULT 'warm', -- 'hot' | 'warm' | 'cold'
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant leads" ON public.leads
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant leads" ON public.leads
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant leads" ON public.leads
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));


-- 5. Real Estate Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  area TEXT,
  type TEXT,
  bedrooms INTEGER,
  price DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'available', -- 'available' | 'under_offer' | 'sold'
  photos_urls JSONB DEFAULT '[]',
  description TEXT,
  inquiry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant listings" ON public.listings
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage tenant listings" ON public.listings
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));


-- 6. Add the new tables to real-time replication if publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  END IF;
END $$;
