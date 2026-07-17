-- ============================================================================
-- Ittisalo — Conversational Commerce V2
-- RPC: search_products
-- Purpose: Allows n8n to quickly query products based on customer messages.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_products(
    p_tenant_id UUID,
    p_query TEXT,
    p_limit INT DEFAULT 10
)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.products
    WHERE tenant_id = p_tenant_id
      AND is_active = true
      AND (
          name ILIKE '%' || p_query || '%'
          OR category ILIKE '%' || p_query || '%'
          OR description ILIKE '%' || p_query || '%'
      )
    ORDER BY created_at DESC
    LIMIT p_limit;
    
    -- Fallback: if no exact keyword match, just return top recent products
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT *
        FROM public.products
        WHERE tenant_id = p_tenant_id
          AND is_active = true
        ORDER BY created_at DESC
        LIMIT p_limit;
    END IF;
END;
$$;
