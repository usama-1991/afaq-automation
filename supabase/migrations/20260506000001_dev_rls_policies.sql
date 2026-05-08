-- ============================================================
-- DEV/TESTING: Permissive RLS policies for the frontend
-- These allow the anon key to read conversations and messages
-- (Safe for testing - replace with auth-scoped policies before production)
-- ============================================================

-- Allow anyone to read conversations (for UI testing)
CREATE POLICY "Allow anon read conversations"
  ON public.conversations FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to read messages
CREATE POLICY "Allow anon read messages"
  ON public.messages FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to insert messages (so the chat UI can send replies)
CREATE POLICY "Allow anon insert messages"
  ON public.messages FOR INSERT
  TO anon
  WITH CHECK (true);
