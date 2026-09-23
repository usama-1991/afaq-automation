import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantWhatsAppCredentials } from '@/lib/meta-credentials';

// ── Helper: get authed user + tenant_id ──────────────────────
async function getAuthContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', status: 401 };

  const { data: userRecord } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userRecord?.tenant_id) return { error: 'No tenant found', status: 400 };
  return { tenantId: userRecord.tenant_id as string };
}

// ── GET /api/templates ───────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  // Optional: check if caller wants to force-sync with Meta
  const url = new URL(request.url);
  const syncWithMeta = url.searchParams.get('sync') === 'true';

  // 1. Fetch DB templates
  const { data: dbTemplates, error } = await supabase
    .from('templates')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. If sync requested OR there are pending templates, sync live status with Meta
  const hasPending = (dbTemplates || []).some(t => t.status === 'PENDING' || t.status === 'Pending');
  if (syncWithMeta || hasPending) {
    try {
      const { wabaId, accessToken } = await getTenantWhatsAppCredentials(supabase, ctx.tenantId);
      if (wabaId && accessToken) {
        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${wabaId}/message_templates?limit=100`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          const metaTemplates: Array<{ name: string; status: string; id: string }> = metaJson.data || [];

          for (const mt of metaTemplates) {
            const match = (dbTemplates || []).find(t => t.name === mt.name || t.meta_template_id === mt.id);
            if (match && match.status !== mt.status) {
              await supabase
                .from('templates')
                .update({ status: mt.status, meta_template_id: mt.id })
                .eq('id', match.id);
              match.status = mt.status;
              match.meta_template_id = mt.id;
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn('[templates GET] Status sync with Meta skipped:', syncErr);
    }
  }

  return NextResponse.json({ templates: dbTemplates });
}

// ── POST /api/templates ──────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json();
  const { name, category, language = 'en_US', header_type, header_text, body_text, footer_text, buttons = [] } = body;

  if (!name || !category || !body_text) {
    return NextResponse.json({ error: 'Missing required fields: name, category, body_text' }, { status: 400 });
  }

  // ── Build Meta API components array ─────────────────────────
  const components: Record<string, unknown>[] = [];

  if (header_type && header_type !== 'None') {
    const format = header_type.toUpperCase();
    if (header_type === 'Text') {
      components.push({ type: 'HEADER', format: 'TEXT', text: header_text });
    } else {
      // IMAGE or DOCUMENT
      components.push({ type: 'HEADER', format, example: { header_handle: ['PLACEHOLDER'] } });
    }
  }

  const bodyComponent: Record<string, unknown> = { type: 'BODY', text: body_text };
  const paramMatches = body_text.match(/\{\{\d+\}\}/g);
  if (paramMatches?.length) {
    bodyComponent.example = { body_text: [paramMatches.map(() => 'Example')] };
  }
  components.push(bodyComponent);

  if (footer_text) components.push({ type: 'FOOTER', text: footer_text });

  if (buttons.length > 0) {
    const metaButtons = buttons.map((btn: { type: string; text: string; urlOrPhone?: string }) => {
      if (btn.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: btn.text };
      if (btn.type === 'URL') return { type: 'URL', text: btn.text, url: btn.urlOrPhone };
      return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.urlOrPhone };
    });
    components.push({ type: 'BUTTONS', buttons: metaButtons });
  }

  // ── Retrieve Tenant WhatsApp credentials ────────────────────
  const { wabaId, accessToken } = await getTenantWhatsAppCredentials(supabase, ctx.tenantId);

  let metaTemplateId: string | null = null;
  let finalStatus = 'PENDING';
  let metaError: string | null = null;

  if (!wabaId || !accessToken) {
    metaError = 'WhatsApp Account (WABA) not connected. Template saved locally.';
    console.warn(`[templates] Tenant ${ctx.tenantId}: ` + metaError);
  } else {
    try {
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const metaRes = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}/message_templates`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: sanitizedName,
            category: category.toUpperCase(),
            language,
            components,
          }),
        }
      );
      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        metaError = metaData?.error?.message || 'Meta API error';
        console.error('[templates] Meta error response:', JSON.stringify(metaData));
      } else {
        metaTemplateId = metaData.id ?? null;
        finalStatus = metaData.status ?? 'PENDING';
        console.log(`[templates] Meta template submitted successfully! ID: ${metaTemplateId}, Status: ${finalStatus}`);
      }
    } catch (err: unknown) {
      metaError = err instanceof Error ? err.message : 'Network error';
      console.error('[templates] Meta API call failed:', metaError);
    }
  }

  // ── Save to Supabase ─────────────────────────────────────────
  const { data: newTemplate, error: dbError } = await supabase
    .from('templates')
    .insert({
      tenant_id: ctx.tenantId,
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category,
      language,
      status: finalStatus,
      meta_template_id: metaTemplateId,
      header_type: header_type || 'None',
      header_text: header_type === 'Text' ? (header_text || null) : null,
      body_text,
      footer_text: footer_text || null,
      buttons: buttons.length > 0 ? buttons : null,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(
    { template: newTemplate, warning: metaError },
    { status: 201 }
  );
}
