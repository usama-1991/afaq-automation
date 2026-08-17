-- ============================================================
-- Migration: 20260818000000_enhanced_auth_trigger.sql
-- Description: Auto-provision 14-day trial tenant + user profile
-- on Google OAuth & Email Signups
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_tenant_id uuid;
  user_full_name text;
  user_workspace_name text;
begin
  -- 1. Extract metadata (supports Google OAuth, Email/Password, and user_metadata)
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'user_name',
    split_part(new.email, '@', 1)
  );

  user_workspace_name := coalesce(
    new.raw_user_meta_data->>'workspace_name',
    user_full_name || '''s Workspace'
  );

  -- 2. Create the tenant with 14-day trial defaults
  insert into public.tenants (
    name,
    plan,
    plan_status,
    trial_ends_at,
    onboarding_completed,
    meta_connected
  )
  values (
    user_workspace_name,
    'trial',
    'trial',
    now() + interval '14 days',
    false,
    false
  )
  returning id into new_tenant_id;

  -- 3. Create the user profile linked to the newly provisioned tenant
  insert into public.users (
    id,
    tenant_id,
    full_name,
    role
  )
  values (
    new.id,
    new_tenant_id,
    user_full_name,
    'admin' -- Tenant creator is workspace admin
  )
  on conflict (id) do update set
    tenant_id = coalesce(public.users.tenant_id, excluded.tenant_id),
    full_name = coalesce(excluded.full_name, public.users.full_name);

  return new;
end;
$$;

-- Ensure trigger is active
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
