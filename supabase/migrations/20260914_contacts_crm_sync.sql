-- ==============================================================================
-- Migration: 20260914_contacts_crm_sync.sql
-- Description: Add tags, custom_fields, and is_opted_out directly to conversations table
-- ==============================================================================

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_opted_out BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversations_tags ON public.conversations USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_conversations_opted_out ON public.conversations(is_opted_out);
