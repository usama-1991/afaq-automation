-- ============================================================================
-- Ittisalo Demo Seed: Cleanup Duplicates
-- Run this if you accidentally ran the seed script multiple times and got duplicates
-- ============================================================================

DELETE FROM public.messages WHERE tenant_id = '00000000-0000-0000-0000-111111111111';
DELETE FROM public.appointments WHERE tenant_id = '00000000-0000-0000-0000-111111111111';
DELETE FROM public.funnel_events WHERE tenant_id = '00000000-0000-0000-0000-111111111111';
DELETE FROM public.reviews WHERE tenant_id = '00000000-0000-0000-0000-111111111111';
DELETE FROM public.conversations WHERE tenant_id = '00000000-0000-0000-0000-111111111111';

-- Now you can run seed_demo_dental.sql one more time to insert a clean set!
