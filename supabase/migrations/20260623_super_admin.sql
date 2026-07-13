-- ============================================================
-- Ittisalo — Super Admin Privileges
-- Migration: 20260623_super_admin.sql
-- ============================================================

-- 1. Create a policy for Super Admins to manage all tenants
CREATE POLICY "Super Admins can manage all tenants" 
  ON public.tenants FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND role = 'super_admin'));

-- 2. Create a policy for Super Admins to manage all users
CREATE POLICY "Super Admins can manage all users" 
  ON public.users FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND role = 'super_admin'));

-- 3. Modify the handle_new_user trigger to automatically assign super_admin to usamahabib1991@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  assigned_role text := 'admin';
BEGIN
  -- 1. Create a new tenant for the user
  INSERT INTO public.tenants (name)
  VALUES (coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1) || '''s Workspace'))
  RETURNING id INTO new_tenant_id;

  -- 2. Check if this is the super admin email
  IF new.email = 'usamahabib1991@gmail.com' THEN
    assigned_role := 'super_admin';
  END IF;

  -- 3. Create the user profile linked to the tenant
  INSERT INTO public.users (id, tenant_id, full_name, role)
  VALUES (
    new.id,
    new_tenant_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    assigned_role
  );

  RETURN new;
END;
$$;

-- 4. Just in case the user has already registered before running this migration, update them now:
UPDATE public.users 
SET role = 'super_admin' 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'usamahabib1991@gmail.com');
