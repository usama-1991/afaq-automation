import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantWhatsAppCredentials } from '@/lib/meta-credentials';
import { ALL_FLOW_BLUEPRINTS } from '@/lib/whatsapp/flows-templates';

async function getAuthContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', status: 401 };
  const { data: userRecord } = await supabase
    .from('users').select('tenant_id').eq('id', user.id).single();
  if (!userRecord?.tenant_id) return { error: 'No tenant found', status: 400 };
  return { tenantId: userRecord.tenant_id as string };
}

// ── GET /api/flows ───────────────────────────────────────────
// Returns all Flows registered for this tenant
export async function GET() {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { data: flows, error } = await supabase
    .from('whatsapp_flows')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flows: flows || [] });
}

// ── POST /api/flows ──────────────────────────────────────────
// Deploys a Flow Blueprint or custom JSON to Meta Cloud API and stores in local DB
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json();
  const { blueprint_key, custom_name, custom_flow_json } = body;
  const blueprint = ALL_FLOW_BLUEPRINTS.find(b => b.key === blueprint_key);

  // 1. Fetch Tenant details and Provider roster for tenant customization
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, name, niche')
    .eq('id', ctx.tenantId)
    .single();

  const businessName = tenant?.business_name || tenant?.name || 'Clinic';
  let flowName = custom_name || blueprint?.name || `${businessName} Flow`;
  const flowCategory = blueprint?.category || 'OTHER';
  let flowJson = custom_flow_json || JSON.parse(JSON.stringify(blueprint?.flowJson || {}));

  // If Appointment Booking blueprint, dynamically personalize with this tenant's real doctors
  if (blueprint_key === 'APPOINTMENT_BOOKING' && flowJson?.screens) {
    flowName = `${businessName} Appointment Booking`;

    const { data: providers } = await supabase
      .from('providers')
      .select('id, name, title')
      .eq('tenant_id', ctx.tenantId)
      .eq('is_active', true)
      .order('name');

    if (providers && providers.length > 0) {
      const doctorOptions = [
        { id: 'any_available', title: 'First Available Specialist' },
        ...providers.map(p => ({
          id: p.name,
          title: p.title ? `${p.name} (${p.title})` : p.name
        }))
      ];

      // Update doctor dropdown in screen layout
      const formChildren = flowJson.screens?.[0]?.layout?.children?.[0]?.children;
      if (Array.isArray(formChildren)) {
        const docDropdown = formChildren.find((c: any) => c.name === 'doctor_name');
        if (docDropdown) {
          docDropdown['data-source'] = doctorOptions;
        }
        const heading = formChildren.find((c: any) => c.type === 'TextHeading');
        if (heading) {
          heading.text = `${businessName} Booking`;
        }
      }
    }
  }

  if (!flowJson || !flowJson.screens) {
    return NextResponse.json({ error: 'Missing flow JSON or valid blueprint key' }, { status: 400 });
  }

  // 2. Fetch WABA ID & Access Token
  const { wabaId, accessToken } = await getTenantWhatsAppCredentials(supabase, ctx.tenantId);

  let metaFlowId = `flow_local_${Date.now()}`;
  let metaStatus = 'DRAFT';
  let previewUrl = null;

  if (wabaId && accessToken) {
    try {
      console.log(`[Flows API] Creating Flow on Meta for WABA: ${wabaId}...`);
      
      // Step A: Create Flow Container on Meta
      const createRes = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/flows`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flowName.replace(/[^a-zA-Z0-9_\s-]/g, '').trim().slice(0, 60),
          categories: [flowCategory],
        }),
      });

      const createData = await createRes.json();

      if (createRes.ok && createData.id) {
        metaFlowId = createData.id;
        console.log(`[Flows API] ✅ Meta Flow Container Created! ID: ${metaFlowId}`);

        // Step B: Upload Flow JSON Asset
        const formData = new FormData();
        const jsonBlob = new Blob([JSON.stringify(flowJson)], { type: 'application/json' });
        formData.append('file', jsonBlob, 'flow.json');
        formData.append('name', 'flow.json');
        formData.append('asset_type', 'FLOW_JSON');

        const assetRes = await fetch(`https://graph.facebook.com/v21.0/${metaFlowId}/assets`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        const assetData = await assetRes.json().catch(() => ({}));
        if (!assetRes.ok) {
          console.warn(`[Flows API] Warning uploading flow asset:`, assetData);
        } else {
          console.log(`[Flows API] ✅ Flow JSON asset uploaded successfully`);
        }

        // Step C: Fetch Flow Preview URL
        const flowDetailsRes = await fetch(`https://graph.facebook.com/v21.0/${metaFlowId}?fields=status,preview`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const flowDetails = await flowDetailsRes.json().catch(() => ({}));
        if (flowDetails.status) metaStatus = flowDetails.status;
        if (flowDetails.preview?.preview_url) previewUrl = flowDetails.preview.preview_url;
      } else {
        console.warn(`[Flows API] Meta Flow creation API error:`, createData);
      }
    } catch (metaErr: any) {
      console.error(`[Flows API] Exception communicating with Meta:`, metaErr.message);
    }
  }

  // 2. Upsert Flow to local database
  const { data: flowRow, error: insertError } = await supabase
    .from('whatsapp_flows')
    .upsert(
      {
        tenant_id: ctx.tenantId,
        flow_id: metaFlowId,
        name: flowName,
        category: flowCategory,
        status: metaStatus,
        flow_json: flowJson,
        preview_url: previewUrl,
        metadata: {
          blueprint_key: blueprint_key || 'custom',
          cta_text: blueprint?.ctaText || 'Open Form',
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'flow_id' }
    )
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ flow: flowRow }, { status: 201 });
}
