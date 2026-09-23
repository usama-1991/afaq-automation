/**
 * Meta WhatsApp Business API Official Conversation Rate Card & Billing Engine
 * Supports Conversation-Based Pricing (CBP) across:
 * - Marketing (Promotions, campaigns, announcements)
 * - Utility (Order receipts, account confirmations, alerts)
 * - Authentication (One-time passcodes, verification codes)
 * - Service (Customer care / AI copilot replies, subject to Oct 1+ policy update)
 */

export interface MetaRateRecord {
  marketing: number;      // USD per conversation
  utility: number;        // USD per conversation
  authentication: number; // USD per conversation
  service: number;        // USD per conversation
}

export const USD_TO_PKR_RATE = 280.0;

// Official Meta WhatsApp Rate Card by Destination Country (USD)
export const META_COUNTRY_RATES: Record<string, MetaRateRecord> = {
  PK: { // Pakistan (+92)
    marketing: 0.0280,
    utility: 0.0055,
    authentication: 0.0055,
    service: 0.0040,
  },
  AE: { // United Arab Emirates (+971)
    marketing: 0.0380,
    utility: 0.0150,
    authentication: 0.0150,
    service: 0.0120,
  },
  SA: { // Saudi Arabia (+966)
    marketing: 0.0400,
    utility: 0.0160,
    authentication: 0.0160,
    service: 0.0130,
  },
  US: { // United States / Canada (+1)
    marketing: 0.0250,
    utility: 0.0150,
    authentication: 0.0130,
    service: 0.0080,
  },
  GB: { // United Kingdom (+44)
    marketing: 0.0550,
    utility: 0.0250,
    authentication: 0.0200,
    service: 0.0180,
  },
  GLOBAL: { // Rest of the World (Average Global Baseline)
    marketing: 0.0300,
    utility: 0.0100,
    authentication: 0.0100,
    service: 0.0060,
  }
};

/**
 * Detect country code from international phone format
 */
export function detectCountryFromPhone(phone?: string): { countryCode: string; countryName: string } {
  if (!phone) return { countryCode: 'PK', countryName: 'Pakistan' };
  const clean = phone.replace(/\D/g, '');

  if (clean.startsWith('92'))  return { countryCode: 'PK', countryName: 'Pakistan' };
  if (clean.startsWith('971')) return { countryCode: 'AE', countryName: 'UAE' };
  if (clean.startsWith('966')) return { countryCode: 'SA', countryName: 'Saudi Arabia' };
  if (clean.startsWith('1'))   return { countryCode: 'US', countryName: 'North America' };
  if (clean.startsWith('44'))  return { countryCode: 'GB', countryName: 'United Kingdom' };

  return { countryCode: 'GLOBAL', countryName: 'International' };
}

export type MetaCategory = 'marketing' | 'utility' | 'authentication' | 'service';

/**
 * Calculate Meta Billed Cost in USD and PKR
 */
export function calculateMetaFee(
  category: string,
  recipientPhone?: string,
  pkrRate: number = USD_TO_PKR_RATE
): { usd: number; pkr: number; countryCode: string; countryName: string; category: MetaCategory } {
  const normCat = (category || 'utility').toLowerCase().trim() as MetaCategory;
  const safeCat: MetaCategory = ['marketing', 'utility', 'authentication', 'service'].includes(normCat)
    ? normCat
    : 'utility';

  const { countryCode, countryName } = detectCountryFromPhone(recipientPhone);
  const rateCard = META_COUNTRY_RATES[countryCode] || META_COUNTRY_RATES.GLOBAL;

  const costUsd = rateCard[safeCat] ?? 0.01;
  const costPkr = Number((costUsd * pkrRate).toFixed(2));

  return {
    usd: costUsd,
    pkr: costPkr,
    countryCode,
    countryName,
    category: safeCat,
  };
}
