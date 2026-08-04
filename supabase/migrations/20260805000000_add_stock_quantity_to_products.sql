-- ============================================================================
-- Ittisalo — Add stock_quantity to products table
-- Purpose: Allows tracking exact item inventory quantities so AI bot stops selling when out of stock.
-- ============================================================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 10;
