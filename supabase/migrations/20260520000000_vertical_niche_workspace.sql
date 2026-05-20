-- 1. Alter public.tenants table to support industry verticalization
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'general';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS business_name TEXT;

-- 2. Ensure RLS UPDATE policy on public.tenants table
-- This allows authenticated users within a tenant to update their tenant info (e.g. during onboarding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tenants' AND policyname = 'Users can update their own tenant'
  ) THEN
    CREATE POLICY "Users can update their own tenant"
      ON public.tenants FOR UPDATE
      USING (id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;
END
$$;

-- 3. Ensure INSERT/UPDATE policies exist for the public.agents table
-- This allows the user to publish and save customized agents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agents' AND policyname = 'Users can insert tenant agents'
  ) THEN
    CREATE POLICY "Users can insert tenant agents" 
      ON public.agents FOR INSERT 
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agents' AND policyname = 'Users can update tenant agents'
  ) THEN
    CREATE POLICY "Users can update tenant agents" 
      ON public.agents FOR UPDATE 
      USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
  END IF;
END
$$;
