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

// ── POST /api/flows/[id] (Publish or Deprecate Flow) ──────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: flowId } = await params;
  const body = await request.json();
  const { action } = body; // 'publish' | 'deprecate'

  const { data: flow } = await supabase
    .from('whatsapp_flows')
    .select('*')
    .eq('flow_id', flowId)
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 });

  const { accessToken } = await getTenantWhatsAppCredentials(supabase, ctx.tenantId);

  let newStatus = flow.status;

  if (accessToken && flowId && !flowId.startsWith('flow_local_')) {
    try {
      const endpoint = action === 'publish' ? 'publish' : 'deprecate';
      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${flowId}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const metaData = await metaRes.json();
      if (metaRes.ok && metaData.success) {
        newStatus = action === 'publish' ? 'PUBLISHED' : 'DEPRECATED';
      } else {
        console.warn(`[Flow Action] Meta responded:`, metaData);
      }
    } catch (e: any) {
      console.error(`[Flow Action] Exception:`, e.message);
    }
  } else {
    newStatus = action === 'publish' ? 'PUBLISHED' : 'DEPRECATED';
  }

  const { data: updatedFlow, error } = await supabase
    .from('whatsapp_flows')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('flow_id', flowId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flow: updatedFlow });
}

// ── DELETE /api/flows/[id] ───────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: flowId } = await params;

  const { error } = await supabase
    .from('whatsapp_flows')
    .delete()
    .eq('flow_id', flowId)
    .eq('tenant_id', ctx.tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
