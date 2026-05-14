-- Find the tenant ID for the demo user
DO $$
DECLARE
  v_demo_tenant_id UUID;
BEGIN
  -- Get the tenant ID associated with the demo user
  SELECT tenant_id INTO v_demo_tenant_id 
  FROM public.users 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'demo@business.com' LIMIT 1);

  -- If demo user exists, map all existing WhatsApp integrations to this tenant
  -- This ensures any incoming webhook from the test number routes to the demo dashboard
  IF v_demo_tenant_id IS NOT NULL THEN
    UPDATE public.integrations
    SET tenant_id = v_demo_tenant_id
    WHERE platform = 'whatsapp';
  END IF;
END $$;
