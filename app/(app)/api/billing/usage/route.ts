import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantUsageSummary } from '@/lib/plans';

async function getAuthContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', status: 401 };
  const { data: userRecord } = await supabase
    .from('users').select('tenant_id').eq('id', user.id).single();
  if (!userRecord?.tenant_id) return { error: 'No tenant found', status: 400 };
  return { tenantId: userRecord.tenant_id as string };
}

// ── GET /api/billing/usage ───────────────────────────────────
// Returns live usage metrics, entitlements, limits, and Meta wallet stats
export async function GET() {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const summary = await getTenantUsageSummary(supabase, ctx.tenantId);
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('[Billing API] Error fetching usage summary:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch billing metrics' }, { status: 500 });
  }
}
