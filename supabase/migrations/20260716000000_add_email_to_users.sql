-- Add email and permissions to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Populate existing emails from auth.users
UPDATE public.users 
SET email = auth.users.email 
FROM auth.users 
WHERE public.users.id = auth.users.id;

-- Update the handle_new_user trigger to include email
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
  INSERT INTO public.users (id, tenant_id, full_name, role, email)
  VALUES (
    new.id,
    new_tenant_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    assigned_role,
    new.email
  );

  RETURN new;
END;
$$;
