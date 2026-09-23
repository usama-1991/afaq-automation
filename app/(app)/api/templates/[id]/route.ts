import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantWhatsAppCredentials } from '@/lib/meta-credentials';

// ── DELETE /api/templates/[id] ───────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify template belongs to this user's tenant before deleting
  const { data: tpl } = await supabase
    .from('templates')
    .select('id, name, meta_template_id, tenant_id')
    .eq('id', id)
    .single();

  if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  // Optional: also delete from Meta if we have meta_template_id and template name
  if (tpl.name) {
    try {
      const { wabaId, accessToken } = await getTenantWhatsAppCredentials(supabase, tpl.tenant_id);
      if (wabaId && accessToken) {
        await fetch(
          `https://graph.facebook.com/v21.0/${wabaId}/message_templates?name=${encodeURIComponent(tpl.name)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }
    } catch (e) {
      console.warn('[templates] Could not delete from Meta:', e);
    }
  }

  const { error: deleteError } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
