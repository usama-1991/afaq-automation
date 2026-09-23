-- ============================================================
-- Ittisalo Super Admin v2: AI Master Killswitch & Multi-Tenant Ops
-- Migration: 20260923010000_super_admin_v2_ai_toggle.sql
-- ============================================================

-- 1. Add ai_enabled, is_internal, and default_currency to public.tenants
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'PKR',
  ADD COLUMN IF NOT EXISTS ai_disabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_disabled_reason TEXT;

-- 2. Mark Ittisalo internal workspaces if present
UPDATE public.tenants
SET is_internal = true
WHERE LOWER(name) LIKE '%ittisalo%' OR LOWER(business_name) LIKE '%ittisalo%';

-- 3. Create index on tenants for fast super admin queries
CREATE INDEX IF NOT EXISTS idx_tenants_plan_status ON public.tenants (plan_status);
CREATE INDEX IF NOT EXISTS idx_tenants_ai_enabled ON public.tenants (ai_enabled);
CREATE INDEX IF NOT EXISTS idx_tenants_is_internal ON public.tenants (is_internal);

-- 4. Secure RPC function for Super Admin to toggle AI for a tenant
CREATE OR REPLACE FUNCTION public.toggle_tenant_ai(
  p_tenant_id UUID,
  p_enabled BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_tenant_name TEXT;
BEGIN
  -- Verify caller is super_admin
  SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();
  IF v_caller_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Super Admin privileges required.';
  END IF;

  -- Update tenant
  UPDATE public.tenants
  SET 
    ai_enabled = p_enabled,
    ai_disabled_at = CASE WHEN p_enabled THEN NULL ELSE now() END,
    ai_disabled_reason = CASE WHEN p_enabled THEN NULL ELSE p_reason END
  WHERE id = p_tenant_id
  RETURNING name INTO v_tenant_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found.';
  END IF;

  -- Log in audit_logs
  INSERT INTO public.audit_logs (tenant_id, user_id, action, details)
  VALUES (
    p_tenant_id,
    auth.uid(),
    CASE WHEN p_enabled THEN 'ai_resumed' ELSE 'ai_paused' END,
    jsonb_build_object(
      'tenant_id', p_tenant_id,
      'tenant_name', v_tenant_name,
      'ai_enabled', p_enabled,
      'reason', p_reason,
      'timestamp', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', p_tenant_id,
    'ai_enabled', p_enabled,
    'message', CASE WHEN p_enabled THEN 'AI bot resumed for tenant' ELSE 'AI bot paused for tenant' END
  );
END;
$$;

-- 5. Grant execute to authenticated users (function self-checks is_super_admin)
GRANT EXECUTE ON FUNCTION public.toggle_tenant_ai(UUID, BOOLEAN, TEXT) TO authenticated;
