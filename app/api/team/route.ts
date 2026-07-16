import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, name, role, permissions, tenantId } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate random password
    const tempPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2);

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPass,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (authError) {
      // If user exists, we just update them instead
      if (authError.message.includes('already been registered')) {
         return NextResponse.json({ error: 'User already exists in the system.' }, { status: 400 });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // The handle_new_user trigger might have created a tenant and user profile. 
    // We should update the user profile to link to the correct tenant ID and set the permissions.
    await supabaseAdmin
      .from('users')
      .update({
        tenant_id: tenantId,
        full_name: name,
        role: role === 'Team Lead' ? 'admin' : 'agent', // Or keep as Team Lead if your DB supports it
        email: email,
        permissions: permissions
      })
      .eq('id', userId);

    return NextResponse.json({ success: true, tempPass, userId });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
