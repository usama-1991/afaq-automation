-- Migration: 20260902_website_chat_widget.sql
-- Enables Ittisalo Website Live Chat Widget support

-- 1. Ensure widget_settings exists on tenants (if not already added)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS widget_settings JSONB DEFAULT '{
  "enabled": true,
  "primary_color": "#dc2626",
  "header_title": "Chat with us",
  "welcome_message": "Hi there! How can we help you today?",
  "subheading": "Typically replies in a few minutes",
  "avatar_url": "",
  "position": "bottom-right",
  "show_whatsapp_button": true,
  "show_instagram_button": true,
  "require_lead_form": true,
  "lead_fields": ["name", "phone"],
  "allowed_domains": []
}'::jsonb;

-- 2. Expand conversations platform check constraint to include 'web_widget'
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_platform_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_platform_check 
  CHECK (platform IN ('whatsapp', 'instagram', 'messenger', 'web_widget'));

-- 3. Add visitor_metadata to conversations for IP, URL, Referrer, User-Agent tracking
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS visitor_metadata JSONB DEFAULT '{}'::jsonb;
