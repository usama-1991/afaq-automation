-- ============================================================================
-- Ittisalo — Order Platform Sync & Email Migration
-- Adds columns to support pushing orders to Shopify/WooCommerce and
-- sending automated confirmation emails.
-- Safe to run on existing databases (uses ADD COLUMN IF NOT EXISTS).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add platform sync columns to orders table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_email        TEXT,
  ADD COLUMN IF NOT EXISTS platform_source       TEXT,           -- 'shopify' | 'woocommerce' | null (no-website merchant)
  ADD COLUMN IF NOT EXISTS platform_order_id     TEXT,           -- Shopify/WC internal ID
  ADD COLUMN IF NOT EXISTS platform_order_number TEXT,           -- Human-readable "#1042"
  ADD COLUMN IF NOT EXISTS platform_synced_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_sent_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method        TEXT DEFAULT 'cod';

-- Index for quick platform order lookups
CREATE INDEX IF NOT EXISTS idx_orders_platform_order
  ON public.orders(platform_source, platform_order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Expand integrations platform constraint to include e-commerce
-- The original CHECK only allowed whatsapp/instagram/messenger.
-- We drop and recreate to also allow shopify/woocommerce.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Drop the old check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'integrations' AND column_name = 'platform'
  ) THEN
    ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_platform_check;
  END IF;
END $$;

-- Recreate with expanded platform list
ALTER TABLE public.integrations
  ADD CONSTRAINT integrations_platform_check
  CHECK (platform IN ('whatsapp', 'instagram', 'messenger', 'meta', 'shopify', 'woocommerce'));

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Add credentials column to integrations if missing
-- Some tenants store creds in integration_credentials table, but the
-- integrations table also needs a credentials JSONB for platform creds.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}';
