-- Audit Triggers for Automatic Database Logging

-- 1. Tenant Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_tenant_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (tenant_id, action, details)
    VALUES (NEW.id, 'tenant_created', jsonb_build_object('name', NEW.name));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (tenant_id, action, details)
    VALUES (NEW.id, 'tenant_updated', jsonb_build_object('old_name', OLD.name, 'new_name', NEW.name));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_tenants_trigger ON public.tenants;
CREATE TRIGGER audit_tenants_trigger
AFTER INSERT OR UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.audit_tenant_changes();

-- 2. Users Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (tenant_id, user_id, action, details)
    VALUES (NEW.tenant_id, NEW.id, 'user_joined', jsonb_build_object('role', NEW.role));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if role or name changed to prevent noise
    IF OLD.role IS DISTINCT FROM NEW.role OR OLD.full_name IS DISTINCT FROM NEW.full_name THEN
      INSERT INTO public.audit_logs (tenant_id, user_id, action, details)
      VALUES (NEW.tenant_id, NEW.id, 'user_updated', jsonb_build_object(
        'old_role', OLD.role, 'new_role', NEW.role,
        'old_name', OLD.full_name, 'new_name', NEW.full_name
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_users_trigger ON public.users;
CREATE TRIGGER audit_users_trigger
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.audit_user_changes();

-- 3. Subscriptions Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (tenant_id, action, details)
    VALUES (NEW.tenant_id, 'subscription_created', jsonb_build_object('plan_type', NEW.plan_type, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.plan_type IS DISTINCT FROM NEW.plan_type THEN
      INSERT INTO public.audit_logs (tenant_id, action, details)
      VALUES (NEW.tenant_id, 'subscription_updated', jsonb_build_object(
        'old_plan', OLD.plan_type, 'new_plan', NEW.plan_type,
        'old_status', OLD.status, 'new_status', NEW.status
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_subscriptions_trigger ON public.subscriptions;
CREATE TRIGGER audit_subscriptions_trigger
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.audit_subscription_changes();
