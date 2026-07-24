-- ============================================================================
-- Ittisalo — Phase 4: Salla & Zid Store Sync Integration
-- Expands the integrations table check constraint to support MENA e-commerce
-- platforms Salla and Zid.
-- ============================================================================

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
  CHECK (platform IN ('whatsapp', 'instagram', 'messenger', 'meta', 'shopify', 'woocommerce', 'salla', 'zid'));
