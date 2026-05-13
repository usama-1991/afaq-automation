-- 1. Change the default role for any newly created user from 'agent' to 'admin'
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'admin';

-- 2. Update all existing users in the database to 'admin' (excluding super_admin)
UPDATE public.users 
SET role = 'admin' 
WHERE role != 'super_admin';
