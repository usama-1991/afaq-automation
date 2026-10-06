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

// ── POST /api/billing/topup ──────────────────────────────────
// Adds funds to the tenant's Meta Conversation Wallet
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json();
  const { amount_pkr = 5000, payment_method = 'card' } = body;

  const topupAmount = Number(amount_pkr);
  if (isNaN(topupAmount) || topupAmount <= 0) {
    return NextResponse.json({ error: 'Invalid top-up amount' }, { status: 400 });
  }

  // Fetch current subscription
  const { data: sub } = await supabase
    .from('tenant_subscriptions')
    .select('wallet_balance')
    .eq('tenant_id', ctx.tenantId)
    .single();

  const currentBalance = Number(sub?.wallet_balance || 0);
  const newBalance = currentBalance + topupAmount;

  const { data: updatedSub, error: updateError } = await supabase
    .from('tenant_subscriptions')
    .update({
      wallet_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', ctx.tenantId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Successfully added PKR ${topupAmount.toLocaleString()} to Meta Conversation Wallet!`,
    newBalance: updatedSub.wallet_balance,
  });
}
