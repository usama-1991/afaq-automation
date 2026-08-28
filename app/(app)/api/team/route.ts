import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: Request) {
  try {
    // 1. Authenticate caller session server-side
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 });
    }

    // 2. Fetch caller's profile & role from the database
    const { data: callerProfile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !callerProfile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant profile not found' }, { status: 404 });
    }

    // 3. Verify user has admin, owner, or super_admin role
    const isAuthorized =
      callerProfile.role === 'admin' ||
      callerProfile.role === 'owner' ||
      callerProfile.role === 'super_admin';

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Owner role required to invite team members' },
        { status: 403 }
      );
    }

    // 4. Derive tenantId strictly from caller's own verified tenant
    const tenantId = callerProfile.tenant_id;

    const { email, name, role, permissions } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Missing required fields: email and name' }, { status: 400 });
    }

    const supabaseAdmin = createServiceClient();

    // Generate random password
    const tempPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2);

    // Create user in auth.users
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPass,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (createError) {
      if (createError.message.includes('already been registered')) {
         return NextResponse.json({ error: 'User already exists in the system.' }, { status: 400 });
      }
      throw createError;
    }

    const userId = authData.user.id;

    // Update the created user's profile to link to the caller's tenant ID
    await supabaseAdmin
      .from('users')
      .update({
        tenant_id: tenantId,
        full_name: name,
        role: role === 'Team Lead' ? 'admin' : (role === 'admin' ? 'admin' : 'agent'),
        email: email,
        permissions: permissions || []
      })
      .eq('id', userId);

    return NextResponse.json({ success: true, tempPass, userId });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
