import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantWhatsAppCredentials } from '@/lib/meta-credentials';

async function getAuthContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', status: 401 };
  const { data: userRecord } = await supabase
    .from('users').select('tenant_id').eq('id', user.id).single();
  if (!userRecord?.tenant_id) return { error: 'No tenant found', status: 400 };
  return { tenantId: userRecord.tenant_id as string };
}

// ── POST /api/flows/test ─────────────────────────────────────
// Dispatches an interactive Flow test message to the merchant's WhatsApp
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json();
  const { flow_id, recipient_phone, cta_text = 'Open Form' } = body;

  if (!flow_id || !recipient_phone) {
    return NextResponse.json({ error: 'Missing flow_id or recipient_phone' }, { status: 400 });
  }

  const cleanPhone = recipient_phone.replace(/\D/g, '');
  if (cleanPhone.length < 7) {
    return NextResponse.json({ error: 'Invalid recipient phone number' }, { status: 400 });
  }

  const { data: flow } = await supabase
    .from('whatsapp_flows')
    .select('*')
    .eq('flow_id', flow_id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();

  if (!flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
  }

  const { phoneNumberId, accessToken } = await getTenantWhatsAppCredentials(supabase, ctx.tenantId);

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ error: 'WhatsApp Business credentials not configured for tenant' }, { status: 400 });
  }

  // Determine initial screen from flow_json
  const firstScreenId = flow.flow_json?.screens?.[0]?.id || 'BOOKING_FORM';

  const flowPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'interactive',
    interactive: {
      type: 'flow',
      header: {
        type: 'text',
        text: flow.name?.slice(0, 60) || 'Interactive Form',
      },
      body: {
        text: 'Please tap the button below to complete the native form directly inside WhatsApp.',
      },
      footer: {
        text: 'Powered by Ittisalo',
      },
      action: {
        name: 'flow',
        parameters: {
          mode: flow.status === 'PUBLISHED' ? 'published' : 'draft',
          flow_message_version: '3',
          flow_token: `test_token_${Date.now()}_${flow_id.slice(-6)}`,
          flow_id: flow_id,
          flow_cta: cta_text.slice(0, 20),
          flow_action: 'navigate',
          flow_action_payload: {
            screen: firstScreenId,
            data: {},
          },
        },
      },
    },
  };

  try {
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flowPayload),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.error(`[Flows Test] Meta send error (${metaRes.status}):`, metaData);
      return NextResponse.json({
        error: metaData.error?.message || `Meta API status ${metaRes.status}`,
        details: metaData,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message_id: metaData.messages?.[0]?.id,
      message: `Flow message sent successfully to +${cleanPhone}!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Network error' }, { status: 500 });
  }
}
