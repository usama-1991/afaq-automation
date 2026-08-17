import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && authData.user) {
      const user = authData.user;
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

    console.error('[auth/callback] exchangeCodeForSession error:', error?.message);
  }

  // Code missing or exchange failed — send back to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
