// Meta WhatsApp Official Conversation Rate Card & Billing Engine (Node.js ESM)

export const USD_TO_PKR_RATE = 280.0;

export const META_COUNTRY_RATES = {
  PK: { marketing: 0.0280, utility: 0.0055, authentication: 0.0055, service: 0.0040 },
  AE: { marketing: 0.0380, utility: 0.0150, authentication: 0.0150, service: 0.0120 },
  SA: { marketing: 0.0400, utility: 0.0160, authentication: 0.0160, service: 0.0130 },
  US: { marketing: 0.0250, utility: 0.0150, authentication: 0.0130, service: 0.0080 },
  GB: { marketing: 0.0550, utility: 0.0250, authentication: 0.0200, service: 0.0180 },
  GLOBAL: { marketing: 0.0300, utility: 0.0100, authentication: 0.0100, service: 0.0060 }
};

export function detectCountryFromPhone(phone) {
  if (!phone) return { countryCode: 'PK', countryName: 'Pakistan' };
  const clean = String(phone).replace(/\D/g, '');

  if (clean.startsWith('92'))  return { countryCode: 'PK', countryName: 'Pakistan' };
  if (clean.startsWith('971')) return { countryCode: 'AE', countryName: 'UAE' };
  if (clean.startsWith('966')) return { countryCode: 'SA', countryName: 'Saudi Arabia' };
  if (clean.startsWith('1'))   return { countryCode: 'US', countryName: 'North America' };
  if (clean.startsWith('44'))  return { countryCode: 'GB', countryName: 'United Kingdom' };

  return { countryCode: 'GLOBAL', countryName: 'International' };
}

export function calculateMetaFee(category, recipientPhone, pkrRate = USD_TO_PKR_RATE) {
  let normCat = (category || 'utility').toLowerCase().trim();
  if (!['marketing', 'utility', 'authentication', 'service'].includes(normCat)) {
    normCat = 'utility';
  }

  const { countryCode, countryName } = detectCountryFromPhone(recipientPhone);
  const rateCard = META_COUNTRY_RATES[countryCode] || META_COUNTRY_RATES.GLOBAL;

  const costUsd = rateCard[normCat] || 0.01;
  const costPkr = Number((costUsd * pkrRate).toFixed(2));

  return {
    usd: costUsd,
    pkr: costPkr,
    countryCode,
    countryName,
    category: normCat,
  };
}
