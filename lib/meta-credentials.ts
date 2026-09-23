import { SupabaseClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/crypto';

export interface WhatsAppCredentials {
  wabaId: string | null;
  phoneNumberId: string | null;
  accessToken: string | null;
}

/**
 * Resolves WhatsApp credentials for a given tenant.
 * Priority: integrations table -> tenants table -> process.env fallback
 */
export async function getTenantWhatsAppCredentials(
  supabase: SupabaseClient,
  tenantId: string
): Promise<WhatsAppCredentials> {
  // 1. Fetch from integrations table (preferred)
  const { data: integ } = await supabase
    .from('integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('platform', 'whatsapp')
    .maybeSingle();

  // 2. Fetch from tenants table (legacy / fallback)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('wa_phone_number_id, wa_account_id, wa_token_enc')
    .eq('id', tenantId)
    .maybeSingle();

  // WABA ID
  const wabaId =
    (integ?.credentials as Record<string, any>)?.waba_id ||
    tenant?.wa_account_id ||
    process.env.META_WABA_ID ||
    null;

  // Phone Number ID
  const phoneNumberId =
    (integ?.credentials as Record<string, any>)?.phone_number_id ||
    integ?.external_account_id ||
    tenant?.wa_phone_number_id ||
    process.env.META_PHONE_NUMBER_ID ||
    null;

  // Access Token
  const rawToken =
    (integ?.credentials as Record<string, any>)?.access_token ||
    integ?.access_token ||
    tenant?.wa_token_enc ||
    process.env.META_ACCESS_TOKEN ||
    null;

  const accessToken = rawToken ? (decrypt(rawToken) || rawToken).trim() : null;

  return {
    wabaId: wabaId ? String(wabaId).trim() : null,
    phoneNumberId: phoneNumberId ? String(phoneNumberId).trim() : null,
    accessToken,
  };
}
