-- ==============================================================================
-- Migration: 20260912_team_inbox_collaboration.sql
-- Description: Team Inbox, Shared Queues, Internal Notes, Lifecycle Stages, & Canned Snippets
-- ==============================================================================

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(30) DEFAULT '#dc2626',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast tenant lookup
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON public.teams(tenant_id);

-- 2. Create Team Members Junction Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- 3. Enhance Conversations Table for Lifecycle & Team Queues
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(50) DEFAULT 'new_lead',
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS first_response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS resolution_time_ms INTEGER;

-- Index for fast queue filtering
CREATE INDEX IF NOT EXISTS idx_conversations_lifecycle ON public.conversations(tenant_id, lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_conversations_team ON public.conversations(tenant_id, team_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON public.conversations(tenant_id, assigned_to);

-- 4. Create Canned Responses / Snippets Table
CREATE TABLE IF NOT EXISTS public.canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  shortcut VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, shortcut)
);

CREATE INDEX IF NOT EXISTS idx_canned_responses_tenant ON public.canned_responses(tenant_id);

-- 5. Update Messages Table for Internal Notes and System Audit Events
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_type_check 
  CHECK (sender_type IN ('customer', 'agent', 'bot', 'internal_note', 'system_event'));

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 6. Insert Default Teams & Canned Snippets for Existing Tenants
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT id FROM public.tenants LOOP
    -- Insert Default Teams if none exist
    IF NOT EXISTS (SELECT 1 FROM public.teams WHERE tenant_id = t.id) THEN
      INSERT INTO public.teams (tenant_id, name, description, color) VALUES
        (t.id, 'Sales & Inquiries', 'Handles new customer inquiries, lead qualification, and product queries', '#dc2626'),
        (t.id, 'Support & Service', 'Customer support, order assistance, and post-sales inquiries', '#2563eb'),
        (t.id, 'VIP Accounts', 'High-value customer retention and direct account management', '#eab308');
    END IF;

    -- Insert Default Canned Snippets if none exist
    IF NOT EXISTS (SELECT 1 FROM public.canned_responses WHERE tenant_id = t.id) THEN
      INSERT INTO public.canned_responses (tenant_id, shortcut, title, content, category) VALUES
        (t.id, 'hello', 'Warm Welcome', 'Hello $customer.name! 👋 Thank you for reaching out to $business.name. How may I assist you today?', 'Greetings'),
        (t.id, 'order', 'Order Status Check', 'Could you please provide your 4-digit Order ID so I can quickly check the real-time shipping status for you?', 'Orders'),
        (t.id, 'hours', 'Business Hours', 'Our official operating hours are Monday to Saturday, 9:00 AM – 8:00 PM. Messages received after hours will be answered first thing in the morning!', 'General'),
        (t.id, 'agent', 'Agent Introduction', 'My name is $agent.name. I will be handling your inquiry today. Please let me know the details so I can assist you directly.', 'Support'),
        (t.id, 'transfer', 'Team Transfer', 'I am transferring your conversation to our specialized $team.name who can best assist you with this. Please stay connected!', 'Support');
    END IF;
  END LOOP;
END $$;
