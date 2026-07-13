-- ============================================================================
-- Ittisalo — Phase 3: Unified Orders Table
-- Adds new columns to `orders` to support all business niches in one place
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'ecommerce',
ADD COLUMN IF NOT EXISTS order_type TEXT,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS service_provider TEXT,
ADD COLUMN IF NOT EXISTS niche_metadata JSONB DEFAULT '{}';
