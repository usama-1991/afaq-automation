-- ============================================================================
-- Ittisalo — Add customer_email to conversations
-- Allows contact card to display email captured during chat order flow.
-- Safe to run on existing databases (uses ADD COLUMN IF NOT EXISTS).
-- ============================================================================

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS customer_email TEXT;
