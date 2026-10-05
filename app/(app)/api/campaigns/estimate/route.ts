import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getAuthContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', status: 401 };
  const { data: userRecord } = await supabase
    .from('users').select('tenant_id').eq('id', user.id).single();
  if (!userRecord?.tenant_id) return { error: 'No tenant found', status: 400 };
  return { tenantId: userRecord.tenant_id as string };
}

// ── POST /api/campaigns/estimate ─────────────────────────────
// Returns the estimated recipient count & sample preview contacts based on dynamic segment rules
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json();
  const { 
    lifecycle_stages = [], 
    tags = [], 
    exclude_opted_out = true, 
    engagement_days = null,
    segment_name = 'All Contacts'
  } = body;

  let query = supabase
    .from('conversations')
    .select('id, external_conversation_id, customer_name, customer_phone, lifecycle_stage, tags, is_opted_out, updated_at')
    .eq('tenant_id', ctx.tenantId)
    .eq('platform', 'whatsapp');

  if (exclude_opted_out) {
    query = query.neq('is_opted_out', true);
  }

  if (Array.isArray(lifecycle_stages) && lifecycle_stages.length > 0) {
    query = query.in('lifecycle_stage', lifecycle_stages);
  }

  if (Array.isArray(tags) && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  if (engagement_days && typeof engagement_days === 'number') {
    const cutoff = new Date(Date.now() - engagement_days * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('updated_at', cutoff);
  }

  const { data: conversations, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate by phone number
  const uniquePhones = new Map<string, any>();
  (conversations || []).forEach(c => {
    const rawPhone = (c.external_conversation_id || c.customer_phone || '').replace(/\D/g, '');
    if (rawPhone.length >= 7 && !uniquePhones.has(rawPhone)) {
      uniquePhones.set(rawPhone, {
        id: c.id,
        phone: rawPhone,
        name: c.customer_name || 'Customer',
        lifecycle_stage: c.lifecycle_stage,
        tags: c.tags || [],
      });
    }
  });

  const matchingContacts = Array.from(uniquePhones.values());

  return NextResponse.json({
    total_count: matchingContacts.length,
    sample_contacts: matchingContacts.slice(0, 5),
  });
}
