-- Create the Audit Logs Table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g. 'login', 'create_tenant', 'send_message'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for normal users to see their own tenant's audit logs
CREATE POLICY "Users can view tenant audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Policy to allow super admins to read everything without recursion
-- We use a SECURITY DEFINER function to bypass RLS when checking roles
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Apply super admin access to core tables
CREATE POLICY "Super admin read all tenants" ON public.tenants FOR ALL USING (public.is_super_admin());
CREATE POLICY "Super admin read all users" ON public.users FOR ALL USING (public.is_super_admin());
CREATE POLICY "Super admin read all audit logs" ON public.audit_logs FOR ALL USING (public.is_super_admin());

-- Create a SECURITY DEFINER function to easily query users with their emails and tenant names for the Admin Panel
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  tenant_name TEXT,
  email VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow super_admin to execute this
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.role,
    u.created_at,
    t.name as tenant_name,
    au.email::VARCHAR
  FROM public.users u
  LEFT JOIN public.tenants t ON u.tenant_id = t.id
  LEFT JOIN auth.users au ON u.id = au.id;
END;
$$;
