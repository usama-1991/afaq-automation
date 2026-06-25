-- ============================================================
-- Fix Infinite Recursion in RLS Policies
-- ============================================================

-- 1. Drop ALL existing policies on public.users to clean up the recursion
DROP POLICY IF EXISTS "Users can view members of their tenant" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Super Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Super admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admin read all users" ON public.users;

-- 2. Create Security Definer functions to safely bypass RLS during policy checks
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- 3. Recreate public.users policies safely without recursion

-- Users can read their own profile
CREATE POLICY "Users can read own profile" 
  ON public.users FOR SELECT 
  USING (id = auth.uid());

-- Users can read their team members
CREATE POLICY "Users can read team members" 
  ON public.users FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (id = auth.uid());

-- Super Admins can manage all users
CREATE POLICY "Super Admins can manage users" 
  ON public.users FOR ALL 
  USING (public.is_super_admin());

-- 4. Fix recursive policies on tenants table
DROP POLICY IF EXISTS "Super Admins can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admin can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admin can update all tenants" ON public.tenants;

CREATE POLICY "Super Admins can manage tenants" 
  ON public.tenants FOR ALL 
  USING (public.is_super_admin());
