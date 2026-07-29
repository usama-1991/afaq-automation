-- Add tenant_id to messages to support multi-tenant isolation and composite uniqueness
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Backfill tenant_id on messages from conversations
UPDATE public.messages m
SET tenant_id = c.tenant_id
FROM public.conversations c
WHERE m.conversation_id = c.id AND m.tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfilling
ALTER TABLE public.messages ALTER COLUMN tenant_id SET NOT NULL;

-- Drop the old global uniqueness constraint on external_message_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'messages' AND constraint_name = 'unique_external_message_id'
    ) THEN
        ALTER TABLE public.messages DROP CONSTRAINT unique_external_message_id;
    END IF;
END $$;

-- Add the new composite constraint for multi-tenant idempotency
ALTER TABLE public.messages ADD CONSTRAINT unique_external_msg_per_tenant UNIQUE (tenant_id, external_message_id);
