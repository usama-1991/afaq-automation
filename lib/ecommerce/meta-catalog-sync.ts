/**
 * Ittisalo — Meta WABA Product Catalog Real-Time Sync
 * 
 * Synchronizes product availability (in stock / out of stock) and pricing
 * directly with Meta Commerce Manager Product Catalogs via Meta Graph API v21.0.
 */

import { decrypt } from '@/lib/crypto';

export interface MetaCatalogProductUpdate {
  retailer_id: string; // SKU or external product ID
  availability: 'in stock' | 'out of stock';
  inventory?: number;
  price?: number;
  currency?: string;
}

export interface MetaCatalogSyncResult {
  success: boolean;
  handles?: string[];
  error?: string;
}

/**
 * Push batch product availability & inventory updates to Meta WABA Catalog
 */
export async function syncInventoryToMetaCatalog(
  catalogId: string,
  accessToken: string,
  updates: MetaCatalogProductUpdate[]
): Promise<MetaCatalogSyncResult> {
  if (!catalogId || !accessToken || !updates || updates.length === 0) {
    return { success: false, error: 'Missing catalogId, accessToken, or updates' };
  }

  try {
    const rawToken = decrypt(accessToken) || accessToken;
    const url = `https://graph.facebook.com/v21.0/${catalogId}/items_batch`;

    // Meta Graph API items_batch payload for catalog product updates
    const requests = updates.map(item => ({
      method: 'UPDATE',
      retailer_id: item.retailer_id,
      data: {
        availability: item.availability,
        ...(item.inventory !== undefined ? { inventory: item.inventory } : {}),
        ...(item.price !== undefined ? { price: Math.round(item.price * 100) } : {}), // Meta expects cents / lowest currency unit if specified
        ...(item.currency ? { currency: item.currency.toUpperCase() } : {}),
      }
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rawToken.trim()}`,
      },
      body: JSON.stringify({
        requests: requests,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[Meta Catalog Sync] ❌ Graph API Error (${response.status}):`, JSON.stringify(result));
      return {
        success: false,
        error: result.error?.message || `Meta Catalog API responded with status ${response.status}`,
      };
    }

    console.log(`[Meta Catalog Sync] ✅ Successfully updated ${updates.length} items in Meta Catalog ${catalogId}`);
    return {
      success: true,
      handles: result.handles || [],
    };
  } catch (err: any) {
    console.error('[Meta Catalog Sync] ❌ Exception during sync:', err.message);
    return {
      success: false,
      error: err.message || 'Unknown network error',
    };
  }
}
