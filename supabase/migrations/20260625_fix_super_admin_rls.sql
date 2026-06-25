-- Drop the recursive policies
DROP POLICY IF EXISTS "Super Admins can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super Admins can manage all users" ON public.users;

-- Recreate Super Admin policy for tenants (This is fine, since it queries users table)
CREATE POLICY "Super Admins can manage all tenants" 
  ON public.tenants FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND role = 'super_admin'));

-- Create a SECURITY DEFINER function to check for super_admin role without triggering infinite recursion on the users table
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Use the security definer function for the users table policy to avoid recursion
CREATE POLICY "Super Admins can manage all users" 
  ON public.users FOR ALL 
  USING (public.is_super_admin());
