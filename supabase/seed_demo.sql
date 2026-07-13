-- Supabase SQL Script: Create Demo Tenant and Users

-- 1. Create the Demo Tenant
INSERT INTO public.tenants (id, name)
VALUES (
  '00000000-0000-0000-0000-111111111111', 
  'Ittisalo Demo Company'
) ON CONFLICT DO NOTHING;

-- 2. Insert Super Admin into auth.users (Requires superuser access / SQL Editor)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-222222222222',
  'authenticated', 'authenticated', 'admin@ittisalo.ai', 
  crypt('admin123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), 
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-222222222222', 
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-222222222222', 'admin@ittisalo.ai')::jsonb, 
  'email', now(), now(), now()
) ON CONFLICT DO NOTHING;

-- Set public.users role for Super Admin
UPDATE public.users 
SET role = 'super_admin', tenant_id = '00000000-0000-0000-0000-111111111111' 
WHERE id = '00000000-0000-0000-0000-222222222222';


-- 3. Insert Business Owner (Agent) into auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-333333333333',
  'authenticated', 'authenticated', 'demo@business.com', 
  crypt('demo123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), 
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-333333333333', 
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-333333333333', 'demo@business.com')::jsonb, 
  'email', now(), now(), now()
) ON CONFLICT DO NOTHING;

-- Set public.users role for Business Owner
UPDATE public.users 
SET role = 'agent', tenant_id = '00000000-0000-0000-0000-111111111111' 
WHERE id = '00000000-0000-0000-0000-333333333333';
