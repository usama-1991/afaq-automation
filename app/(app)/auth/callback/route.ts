import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  const supabase = await createClient();
  let user: any = null;

  // 1. Cross-device Token Hash OTP Verification
  if (token_hash && type) {
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!otpError && otpData.user) {
      user = otpData.user;
    } else {
      console.warn('[auth/callback] verifyOtp error:', otpError?.message);
    }
  } 
  // 2. PKCE / OAuth Code Exchange
  else if (code) {
    const { data: authData, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!codeError && authData.user) {
      user = authData.user;
    } else {
      console.warn('[auth/callback] exchangeCodeForSession error:', codeError?.message);
    }
  }

  // If user verified successfully via either strategy
  if (user) {
    const userEmail = user.email || '';

    // If user is designated Super Admin
    if (
      userEmail === 'usamahabib1991@gmail.com' ||
      userEmail === 'admin@ittisalo.io'
    ) {
      return NextResponse.redirect(`${origin}/admin`);
    }

    // If explicit redirect was requested (e.g. password recovery)
    if (next === '/update-password') {
      return NextResponse.redirect(`${origin}/update-password`);
    }

    try {
      const serviceClient = createServiceClient();

      // Check if user record exists in public.users
      let { data: profile } = await serviceClient
        .from('users')
        .select('id, tenant_id, role')
        .eq('id', user.id)
        .maybeSingle();

      // If user record or tenant record is missing (fallback if trigger lagged), bootstrap it
      if (!profile || !profile.tenant_id) {
        const workspaceName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (userEmail.includes('@') ? userEmail.split('@')[0] : 'My') + "'s Workspace";

        // Create tenant
        const { data: newTenant, error: tenantErr } = await serviceClient
          .from('tenants')
          .insert({
            name: workspaceName,
            plan: 'trial',
            plan_status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            onboarding_completed: false,
            meta_connected: false,
          })
          .select('id')
          .single();

        if (!tenantErr && newTenant) {
          // Upsert user profile
          const { data: newProfile } = await serviceClient
            .from('users')
            .upsert({
              id: user.id,
              tenant_id: newTenant.id,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0],
              role: 'admin',
            })
            .select('id, tenant_id, role')
            .single();

          profile = newProfile || { id: user.id, tenant_id: newTenant.id, role: 'admin' };
        }
      }

      // Check tenant onboarding status
      if (profile?.tenant_id) {
        const { data: tenant } = await serviceClient
          .from('tenants')
          .select('onboarding_completed, niche')
          .eq('id', profile.tenant_id)
          .maybeSingle();

        if (!tenant || !tenant.onboarding_completed || tenant.niche === 'general') {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
    } catch (err) {
      console.error('[auth/callback] tenant check error:', err);
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // Fallback: If user already has an active session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return NextResponse.redirect(`${origin}${next || '/onboarding'}`);
  }

  // Verification failed or expired — send back to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
