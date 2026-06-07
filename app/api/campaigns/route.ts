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

// ── GET /api/campaigns ───────────────────────────────────────
export async function GET() {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns });
}

// ── POST /api/campaigns ──────────────────────────────────────
// Creates campaign record + immediately fires messages if schedule=immediate
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json();
  const { name, template_id, template_name, segment_name = 'All Contacts', schedule_type = 'immediate', scheduled_at } = body;

  if (!name || !template_id || !template_name) {
    return NextResponse.json({ error: 'Missing required fields: name, template_id, template_name' }, { status: 400 });
  }

  // ── Verify template is APPROVED ──────────────────────────────
  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', template_id)
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  if (template.status !== 'APPROVED') {
    return NextResponse.json({ error: `Template is not APPROVED (current status: ${template.status})` }, { status: 400 });
  }

  // ── Get recipient contacts from conversations table ──────────
  const { data: conversations } = await supabase
    .from('conversations')
    .select('external_conversation_id, customer_name, platform')
    .eq('tenant_id', ctx.tenantId)
    .eq('platform', 'whatsapp'); // only WhatsApp supports template messages

  const recipients = conversations ?? [];

  // ── Create campaign record ───────────────────────────────────
  const isImmediate = schedule_type === 'immediate';
  const { data: campaign, error: campError } = await supabase
    .from('campaigns')
    .insert({
      tenant_id: ctx.tenantId,
      name,
      template_id,
      template_name,
      segment_name,
      status: isImmediate ? 'In Progress' : 'Scheduled',
      scheduled_at: isImmediate ? null : (scheduled_at || null),
      total_recipients: recipients.length,
    })
    .select()
    .single();

  if (campError) return NextResponse.json({ error: campError.message }, { status: 500 });

  // ── Fire immediately if schedule_type === 'immediate' ────────
  if (isImmediate && recipients.length > 0) {
    // Run in background — don't await so the response returns fast
    sendCampaignMessages(campaign.id, ctx.tenantId, template, recipients).catch(err =>
      console.error('[campaigns] Background send error:', err.message)
    );
  }

  return NextResponse.json({ campaign }, { status: 201 });
}

// ── Background: loop contacts and call Meta per recipient ────
async function sendCampaignMessages(
  campaignId: string,
  tenantId: string,
  template: Record<string, unknown>,
  recipients: Array<{ external_conversation_id: string; customer_name: string | null; platform: string }>
) {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  // Use service role client to bypass RLS from this async context
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();

  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    const phone = recipient.external_conversation_id;
    let metaMessageId: string | null = null;
    let status = 'sent';
    let errorMessage: string | null = null;

    if (!phoneNumberId || !accessToken) {
      status = 'failed';
      errorMessage = 'META_PHONE_NUMBER_ID or META_ACCESS_TOKEN not configured';
      failedCount++;
    } else {
      try {
        // Build template components with variables
        const templateComponents: Record<string, unknown>[] = [];
        if (template.header_type && template.header_type !== 'None' && template.header_text) {
          templateComponents.push({
            type: 'header',
            parameters: [{ type: 'text', text: template.header_text }],
          });
        }
        // Body: replace {{1}} etc. with recipient name as default param
        templateComponents.push({
          type: 'body',
          parameters: [{ type: 'text', text: recipient.customer_name || phone }],
        });

        const metaRes = await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone,
              type: 'template',
              template: {
                name: template.name,
                language: { code: template.language || 'en_US' },
                components: templateComponents,
              },
            }),
          }
        );
        const metaData = await metaRes.json();
        if (!metaRes.ok) {
          status = 'failed';
          errorMessage = metaData?.error?.message ?? 'Meta send error';
          failedCount++;
        } else {
          metaMessageId = metaData?.messages?.[0]?.id ?? null;
          sentCount++;
        }
      } catch (err: unknown) {
        status = 'failed';
        errorMessage = err instanceof Error ? err.message : 'Network error';
        failedCount++;
      }
    }

    // Insert per-message record
    await serviceClient.from('campaign_messages').insert({
      campaign_id: campaignId,
      tenant_id: tenantId,
      recipient_phone: phone,
      recipient_name: recipient.customer_name,
      meta_message_id: metaMessageId,
      status,
      error_message: errorMessage,
    });

    // Small delay to respect Meta rate limits (80 msgs/sec for Cloud API)
    await new Promise(r => setTimeout(r, 15));
  }

  // ── Update campaign aggregate stats ─────────────────────────
  await serviceClient
    .from('campaigns')
    .update({
      status: 'Completed',
      sent_count: sentCount,
      failed_count: failedCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
}
