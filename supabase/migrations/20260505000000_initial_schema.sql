-- Initial Supabase Schema for Microservices CRM

-- 1. Tenants Table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users Profile Table (Extends Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  full_name TEXT,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Agents (AI bots)
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('whatsapp', 'instagram', 'messenger')),
  external_conversation_id TEXT, -- e.g., customer phone number
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('customer', 'agent', 'bot')),
  content TEXT,
  external_message_id TEXT, -- to track exact message ID from Meta
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Realtime Setup
-- Enable realtime for conversations and messages
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

-- RLS Policies (Simplified for the prototype: users can read/write their tenant's data)

-- Tenants: user can view their own tenant
CREATE POLICY "Users can view their own tenant" 
  ON public.tenants FOR SELECT 
  USING (id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Users: user can view users in same tenant
CREATE POLICY "Users can view members of their tenant" 
  ON public.users FOR SELECT 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (id = auth.uid());

-- Conversations: users can view/update conversations in their tenant
CREATE POLICY "Users can view tenant conversations" 
  ON public.conversations FOR SELECT 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert tenant conversations" 
  ON public.conversations FOR INSERT 
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update tenant conversations" 
  ON public.conversations FOR UPDATE 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Messages: users can view/update messages in their tenant's conversations
CREATE POLICY "Users can view tenant messages" 
  ON public.messages FOR SELECT 
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid())));

CREATE POLICY "Users can insert tenant messages" 
  ON public.messages FOR INSERT 
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid())));

-- Agents & Subscriptions (Read-only for agents, managed by admin/billing service)
CREATE POLICY "Users can view tenant agents" 
  ON public.agents FOR SELECT 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can view tenant subscriptions" 
  ON public.subscriptions FOR SELECT 
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Note: Services (Fastify) will use service_role_key which bypasses RLS.
