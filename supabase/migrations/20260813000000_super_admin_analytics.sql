-- ============================================================
-- Ittisalo Super Admin Analytics & Multi-Tenant Performance Schema
-- Migration: 20260813000000_super_admin_analytics.sql
-- ============================================================

-- 1. Ensure token tracking columns exist on public.messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS prompt_tokens INT DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS completion_tokens INT DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'gpt-4o-mini';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS latency_ms INT DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS kb_chunks_used INT DEFAULT 0;

-- 2. Add Super Admin RLS read policies for all core analytics tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Super admin read all orders'
  ) THEN
    CREATE POLICY "Super admin read all orders" ON public.orders
      FOR SELECT USING (public.is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Super admin read all messages'
  ) THEN
    CREATE POLICY "Super admin read all messages" ON public.messages
      FOR SELECT USING (public.is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Super admin read all conversations'
  ) THEN
    CREATE POLICY "Super admin read all conversations" ON public.conversations
      FOR SELECT USING (public.is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage_metrics' AND policyname = 'Super admin read all usage_metrics'
  ) THEN
    CREATE POLICY "Super admin read all usage_metrics" ON public.usage_metrics
      FOR SELECT USING (public.is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'integration_credentials' AND policyname = 'Super admin read all integration_credentials'
  ) THEN
    CREATE POLICY "Super admin read all integration_credentials" ON public.integration_credentials
      FOR SELECT USING (public.is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'funnel_events' AND policyname = 'Super admin read all funnel_events'
  ) THEN
    CREATE POLICY "Super admin read all funnel_events" ON public.funnel_events
      FOR SELECT USING (public.is_super_admin());
  END IF;
END $$;
