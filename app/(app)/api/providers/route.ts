import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const DEFAULT_DENTAL_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Hassan Ahmed',
    title: 'General Dentistry & Implants',
    email: 'dr.hassan@smilecare.com',
    phone: '+92 300 1234567',
    google_calendar_id: 'primary',
    working_days: [1, 2, 3, 4, 5, 6],
    shift_start: '10:00:00',
    shift_end: '18:00:00',
    slot_duration_minutes: 30,
    is_active: true,
  },
  {
    id: 'doc-2',
    name: 'Dr. Fatima Zahra',
    title: 'Endodontics & Oral Surgery',
    email: 'dr.fatima@smilecare.com',
    phone: '+92 301 9876543',
    google_calendar_id: 'primary',
    working_days: [1, 2, 3, 4, 5],
    shift_start: '10:30:00',
    shift_end: '19:00:00',
    slot_duration_minutes: 30,
    is_active: true,
  },
  {
    id: 'doc-3',
    name: 'Dr. Usman Ali',
    title: 'Orthodontics & Braces',
    email: 'dr.usman@smilecare.com',
    phone: '+92 302 5551234',
    google_calendar_id: 'primary',
    working_days: [2, 4, 6],
    shift_start: '12:00:00',
    shift_end: '20:00:00',
    slot_duration_minutes: 45,
    is_active: true,
  },
  {
    id: 'doc-4',
    name: 'Dr. Ayesha Syed',
    title: 'Pediatric Dentist',
    email: 'dr.ayesha@smilecare.com',
    phone: '+92 303 7778899',
    google_calendar_id: 'primary',
    working_days: [1, 3, 5, 6],
    shift_start: '09:00:00',
    shift_end: '15:00:00',
    slot_duration_minutes: 30,
    is_active: true,
  }
];

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenantId = userData.tenant_id;
    const serviceSupabase = createServiceClient();

    // 1. Try reading from public.providers table
    const { data: dbProviders, error: dbErr } = await serviceSupabase
      .from('providers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (!dbErr && dbProviders && dbProviders.length > 0) {
      return NextResponse.json({ providers: dbProviders, source: 'table' });
    }

    // 2. Fallback to tenant niche_settings
    const { data: tenant } = await serviceSupabase
      .from('tenants')
      .select('niche, niche_settings')
      .eq('id', tenantId)
      .single();

    const ns = tenant?.niche_settings || {};
    let providers = ns.providers || [];

    if (providers.length === 0 && (tenant?.niche === 'dental' || tenant?.niche === 'clinic')) {
      providers = DEFAULT_DENTAL_DOCTORS;
      // Persist defaults to tenant settings so changes persist
      await serviceSupabase
        .from('tenants')
        .update({
          niche_settings: {
            ...ns,
            providers: DEFAULT_DENTAL_DOCTORS
          }
        })
        .eq('id', tenantId);
    }

    return NextResponse.json({ providers, source: 'settings' });
  } catch (err: any) {
    console.error('[Providers GET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
    if (!userData?.tenant_id) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenantId = userData.tenant_id;
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Doctor/Provider name is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    const providerPayload = {
      tenant_id: tenantId,
      name: body.name.trim(),
      title: body.title?.trim() || 'General Practitioner',
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      google_calendar_id: body.google_calendar_id || 'primary',
      working_days: Array.isArray(body.working_days) ? body.working_days : [1, 2, 3, 4, 5, 6],
      shift_start: body.shift_start || '09:00:00',
      shift_end: body.shift_end || '18:00:00',
      slot_duration_minutes: parseInt(body.slot_duration_minutes, 10) || 30,
      is_active: body.is_active !== undefined ? !!body.is_active : true,
    };

    // Try inserting into public.providers
    const { data: inserted, error: insertErr } = await serviceSupabase
      .from('providers')
      .insert([providerPayload])
      .select()
      .maybeSingle();

    if (!insertErr && inserted) {
      return NextResponse.json({ provider: inserted });
    }

    // Fallback: Store into niche_settings.providers
    const { data: tenant } = await serviceSupabase
      .from('tenants')
      .select('niche_settings')
      .eq('id', tenantId)
      .single();

    const ns = tenant?.niche_settings || {};
    const existing = ns.providers || (tenantId === '00000000-0000-0000-0000-111111111111' ? DEFAULT_DENTAL_DOCTORS : []);
    const newDoc = {
      ...providerPayload,
      id: `doc-${Date.now()}`
    };

    const updatedList = [...existing, newDoc];
    await serviceSupabase
      .from('tenants')
      .update({
        niche_settings: {
          ...ns,
          providers: updatedList
        }
      })
      .eq('id', tenantId);

    return NextResponse.json({ provider: newDoc });
  } catch (err: any) {
    console.error('[Providers POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
    if (!userData?.tenant_id) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenantId = userData.tenant_id;
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Try updating public.providers table
    const { data: updated, error: updateErr } = await serviceSupabase
      .from('providers')
      .update({
        name: body.name?.trim(),
        title: body.title?.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        google_calendar_id: body.google_calendar_id || 'primary',
        working_days: body.working_days,
        shift_start: body.shift_start,
        shift_end: body.shift_end,
        slot_duration_minutes: body.slot_duration_minutes,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('tenant_id', tenantId)
      .select()
      .maybeSingle();

    if (!updateErr && updated) {
      return NextResponse.json({ provider: updated });
    }

    // Fallback: Update in niche_settings
    const { data: tenant } = await serviceSupabase
      .from('tenants')
      .select('niche_settings')
      .eq('id', tenantId)
      .single();

    const ns = tenant?.niche_settings || {};
    const existing = ns.providers || DEFAULT_DENTAL_DOCTORS;
    const updatedList = existing.map((p: any) => p.id === body.id ? { ...p, ...body } : p);

    await serviceSupabase
      .from('tenants')
      .update({
        niche_settings: {
          ...ns,
          providers: updatedList
        }
      })
      .eq('id', tenantId);

    return NextResponse.json({ provider: { ...body } });
  } catch (err: any) {
    console.error('[Providers PUT] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
    if (!userData?.tenant_id) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenantId = userData.tenant_id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Try deleting from public.providers
    await serviceSupabase
      .from('providers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    // Also remove from niche_settings if present
    const { data: tenant } = await serviceSupabase
      .from('tenants')
      .select('niche_settings')
      .eq('id', tenantId)
      .single();

    if (tenant?.niche_settings?.providers) {
      const updatedList = tenant.niche_settings.providers.filter((p: any) => p.id !== id);
      await serviceSupabase
        .from('tenants')
        .update({
          niche_settings: {
            ...tenant.niche_settings,
            providers: updatedList
          }
        })
        .eq('id', tenantId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Providers DELETE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
