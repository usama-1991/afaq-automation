-- ============================================================
-- Critical Fix: Add missing columns to conversations table
-- Error: "column conversations.status does not exist" (code: 42703)
-- These columns are required by the webhook service and UI.
-- ============================================================

-- Add status column (open / resolved / pending)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'
  CHECK (status IN ('open', 'resolved', 'pending'));

-- Add unread_count column (incremented by webhook, reset by UI on read)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Add assigned_to column (FK to users for human handoff)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add assigned_at column (timestamp of last assignment)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Add last_message_preview column (for conversation list preview text)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Backfill: all existing conversations get status='open' and unread_count=0 if null
UPDATE public.conversations
  SET status = 'open' WHERE status IS NULL;

UPDATE public.conversations
  SET unread_count = 0 WHERE unread_count IS NULL;

-- Add unique constraint so webhook upsert works correctly
-- (one conversation per tenant + customer phone/id per platform)
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS unique_tenant_conversation;

ALTER TABLE public.conversations
  ADD CONSTRAINT unique_tenant_conversation
  UNIQUE (tenant_id, external_conversation_id);

-- Add external_message_id unique constraint on messages to prevent duplicates
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS unique_external_message_id;

ALTER TABLE public.messages
  ADD CONSTRAINT unique_external_message_id
  UNIQUE (external_message_id);
