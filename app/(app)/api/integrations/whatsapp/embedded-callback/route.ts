import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { encrypt } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, wabaId: inputWabaId, phoneNumberId: inputPhoneId, tenantId: requestedTenantId } = body;

    if (!code) {
      return NextResponse.json({ error: 'Missing OAuth authorization code' }, { status: 400 });
    }

    // 1. Authenticate user & verify tenant
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant profile not found' }, { status: 400 });
    }

    const tenantId = requestedTenantId && (userProfile.role === 'admin' || userProfile.role === 'superadmin')
      ? requestedTenantId
      : userProfile.tenant_id;

    // 2. Resolve Meta Credentials
    const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID || '1635701210878081';
    const appSecret = process.env.META_APP_SECRET;

    if (!appSecret) {
      console.error('[Embedded Signup] Missing META_APP_SECRET in server environment');
      return NextResponse.json({ error: 'Meta app secret not configured on server' }, { status: 500 });
    }

    // 3. Exchange OAuth code for permanent User/System Access Token
    console.log(`[Embedded Signup] Exchanging code for tenant ${tenantId}...`);
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[Embedded Signup] Token exchange error:', tokenData.error);
      return NextResponse.json({ 
        error: tokenData.error.message || 'Failed to exchange Meta code for access token' 
      }, { status: 400 });
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token returned from Meta' }, { status: 400 });
    }

    let finalWabaId = inputWabaId;
    let finalPhoneId = inputPhoneId;
    let displayPhoneNumber = '';
    let verifiedName = '';

    // 4. If wabaId wasn't passed via frontend sessionInfoListener, inspect token debug info
    if (!finalWabaId) {
      try {
        const debugRes = await fetch(
          `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
        );
        const debugData = await debugRes.json();
        const scopes = debugData?.data?.granular_scopes || [];
        const waScope = scopes.find((s: any) => 
          s.scope === 'whatsapp_business_management' || s.scope === 'whatsapp_business_messaging'
        );
        if (waScope && waScope.target_ids && waScope.target_ids.length > 0) {
          finalWabaId = waScope.target_ids[0];
          console.log(`[Embedded Signup] Resolved WABA ID from debug_token: ${finalWabaId}`);
        }
      } catch (err: any) {
        console.warn('[Embedded Signup] Failed to inspect debug_token:', err.message);
      }
    }

    // 5. If phone_number_id is missing and we have WABA ID, fetch phone numbers under WABA
    if (finalWabaId) {
      try {
        const phonesRes = await fetch(
          `https://graph.facebook.com/v21.0/${finalWabaId}/phone_numbers?access_token=${accessToken}`
        );
        const phonesData = await phonesRes.json();
        if (phonesData?.data && phonesData.data.length > 0) {
          const firstPhone = phonesData.data[0];
          if (!finalPhoneId) {
            finalPhoneId = firstPhone.id;
          }
          displayPhoneNumber = firstPhone.display_phone_number || '';
          verifiedName = firstPhone.verified_name || '';
          console.log(`[Embedded Signup] Resolved Phone ID: ${finalPhoneId} (${displayPhoneNumber})`);
        }
      } catch (phoneErr: any) {
        console.warn('[Embedded Signup] Error fetching WABA phone numbers:', phoneErr.message);
      }
    }

    if (!finalWabaId || !finalPhoneId) {
      console.error('[Embedded Signup] Missing final IDs:', { finalWabaId, finalPhoneId });
      return NextResponse.json({
        error: 'Could not resolve WhatsApp Business Account or Phone Number ID. Please ensure phone registration completed in Meta popup.',
      }, { status: 400 });
    }

    // 6. CRUCIAL: Subscribe our Tech Provider App to this customer's WABA webhooks!
    console.log(`[Embedded Signup] Subscribing app to WABA ${finalWabaId}...`);
    try {
      const subRes = await fetch(`https://graph.facebook.com/v21.0/${finalWabaId}/subscribed_apps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const subData = await subRes.json();
      console.log('[Embedded Signup] Subscribed apps result:', subData);
    } catch (subErr: any) {
      console.warn('[Embedded Signup] Non-fatal subscription warning:', subErr.message);
    }

    // 7. Store encrypted token & update tenant integration in DB
    const serviceClient = createServiceClient();
    const encryptedToken = encrypt(accessToken);

    // Unbind this phone_number_id from any other tenant to prevent unique collision
    await serviceClient
      .from('tenants')
      .update({ wa_phone_number_id: null, meta_connected: false })
      .eq('wa_phone_number_id', finalPhoneId)
      .neq('id', tenantId);

    // Update public.tenants
    const updateTenantPayload: Record<string, any> = {
      wa_phone_number_id: finalPhoneId,
      wa_account_id: finalWabaId,
      wa_access_token: accessToken,
      wa_token_enc: encryptedToken,
      meta_connected: true,
      onboarding_completed: true,
    };

    if (displayPhoneNumber) {
      updateTenantPayload.business_phone = displayPhoneNumber;
    }

    const { error: updateTenantError } = await serviceClient
      .from('tenants')
      .update(updateTenantPayload)
      .eq('id', tenantId);

    if (updateTenantError) {
      console.error('[Embedded Signup] Error updating tenant record:', updateTenantError);
      return NextResponse.json({ error: updateTenantError.message }, { status: 500 });
    }

    // Upsert public.integrations for webhook-service routing
    const { error: intError } = await serviceClient
      .from('integrations')
      .upsert({
        tenant_id: tenantId,
        platform: 'whatsapp',
        external_account_id: finalPhoneId,
        access_token: encryptedToken,
        is_active: true,
      }, { onConflict: 'platform,external_account_id' });

    if (intError) {
      console.warn('[Embedded Signup] Warning upserting integration:', intError.message);
    }

    // Audit log
    try {
      await serviceClient.from('audit_logs').insert({
        tenant_id: tenantId,
        action: 'meta_whatsapp_embedded_connected',
        details: {
          waba_id: finalWabaId,
          phone_number_id: finalPhoneId,
          display_phone_number: displayPhoneNumber,
          verified_name: verifiedName,
          user_id: user.id,
        },
      });
    } catch {
      // Non-blocking
    }

    console.log(`[Embedded Signup] Successfully connected tenant ${tenantId} to WhatsApp!`);

    return NextResponse.json({
      success: true,
      waba_id: finalWabaId,
      phone_number_id: finalPhoneId,
      display_phone_number: displayPhoneNumber,
      verified_name: verifiedName,
      message: 'Official WhatsApp Business Cloud API successfully connected!',
    });
  } catch (err: any) {
    console.error('[Embedded Signup] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
