-- Function to handle new user signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  -- 1. Create a new tenant for the user
  insert into public.tenants (name)
  values (coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1) || '''s Workspace'))
  returning id into new_tenant_id;

  -- 2. Create the user profile linked to the tenant
  insert into public.users (id, tenant_id, full_name, role)
  values (
    new.id,
    new_tenant_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin' -- The creator of the tenant is the admin
  );

  return new;
end;
$$;

-- Trigger to call the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
