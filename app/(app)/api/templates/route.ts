import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
export async function GET() {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { data: templates, error } = await supabase
    .from('templates')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates });
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
      // IMAGE or DOCUMENT — needs a real media handle for production;
      // placeholder used here so Meta accepts the structure
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

  // ── Call Meta Graph API ──────────────────────────────────────
  const wabaId = process.env.META_WABA_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  let metaTemplateId: string | null = null;
  let finalStatus = 'PENDING';
  let metaError: string | null = null;

  if (!wabaId || !accessToken) {
    metaError = 'META_WABA_ID or META_ACCESS_TOKEN not configured — template saved as PENDING locally.';
    console.warn('[templates] ' + metaError);
  } else {
    try {
      const metaRes = await fetch(
        `https://graph.facebook.com/v19.0/${wabaId}/message_templates`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            category: category.toUpperCase(),
            language,
            components,
          }),
        }
      );
      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        metaError = metaData?.error?.message || 'Meta API error';
        console.error('[templates] Meta error:', JSON.stringify(metaData));
      } else {
        metaTemplateId = metaData.id ?? null;
        finalStatus = metaData.status ?? 'PENDING';
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
