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
  if (template.status?.toUpperCase() !== 'APPROVED') {
    return NextResponse.json({ error: `Template is not APPROVED (current status: ${template.status})` }, { status: 400 });
  }

  // ── Get recipient contacts from conversations table filtered by segment ──
  let query = supabase
    .from('conversations')
    .select('id, external_conversation_id, customer_name, customer_phone, platform, lifecycle_stage, tags')
    .eq('tenant_id', ctx.tenantId)
    .eq('platform', 'whatsapp'); // only WhatsApp supports template messages

  // Segment Filtering
  const cleanSeg = segment_name.toLowerCase().replace(/[\s_-]+/g, '');
  if (cleanSeg.includes('hotlead')) {
    query = query.in('lifecycle_stage', ['hot_lead', 'Hot Lead', 'hotlead']);
  } else if (cleanSeg.includes('newlead')) {
    query = query.in('lifecycle_stage', ['new_lead', 'New Lead', 'newlead']);
  } else if (cleanSeg.includes('appt') || cleanSeg.includes('booked')) {
    query = query.in('lifecycle_stage', ['appointment_booked', 'Appt Booked']);
  } else if (cleanSeg.includes('won') || cleanSeg.includes('customer')) {
    query = query.in('lifecycle_stage', ['won', 'Customer / Won']);
  }

  const { data: conversations } = await query;

  const recipients = (conversations ?? []).map(c => ({
    conversation_id: c.id,
    external_conversation_id: c.external_conversation_id || c.customer_phone || '',
    customer_name: c.customer_name,
    platform: c.platform,
  })).filter(r => r.external_conversation_id.length > 0);

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
      status: isImmediate ? (recipients.length > 0 ? 'In Progress' : 'Completed') : 'Scheduled',
      scheduled_at: isImmediate ? null : (scheduled_at || null),
      total_recipients: recipients.length,
      sent_count: 0,
      failed_count: 0,
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
  recipients: Array<{ conversation_id?: string; external_conversation_id: string; customer_name: string | null; platform: string }>
) {
  // Use service role client to bypass RLS from this async context
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();

  const { phoneNumberId, accessToken } = await getTenantWhatsAppCredentials(serviceClient, tenantId);

  let sentCount = 0;
  let failedCount = 0;

  // Inspect variable counts in header and body
  const bodyText = String(template.body_text || '');
  const bodyParamMatches = bodyText.match(/\{\{\d+\}\}/g) || [];
  const bodyParamCount = bodyParamMatches.length;

  const headerText = String(template.header_text || '');
  const headerParamMatches = headerText.match(/\{\{\d+\}\}/g) || [];
  const headerParamCount = headerParamMatches.length;

  for (const recipient of recipients) {
    const phone = recipient.external_conversation_id.replace(/\D/g, ''); // Digits only
    let metaMessageId: string | null = null;
    let status = 'sent';
    let errorMessage: string | null = null;
    let bodyParams: Array<{ type: string; text: string }> = [];

    if (!phoneNumberId || !accessToken) {
      status = 'failed';
      errorMessage = 'WhatsApp Phone Number ID or Access Token not configured';
      failedCount++;
    } else {
      try {
        const templateComponents: Record<string, unknown>[] = [];

        // 1. Header component (ONLY if header text contains variables like {{1}})
        if (template.header_type === 'Text' && headerParamCount > 0) {
          templateComponents.push({
            type: 'header',
            parameters: headerParamMatches.map((_, i) => ({
              type: 'text',
              text: i === 0 ? (recipient.customer_name || 'Valued Customer') : `Info ${i + 1}`,
            })),
          });
        }

        // 2. Body component with exact number of required parameter slots
        if (bodyParamCount > 0) {
          bodyParams = bodyParamMatches.map((_, i) => {
            if (i === 0) return { type: 'text', text: recipient.customer_name || 'Valued Customer' };
            if (i === 1) return { type: 'text', text: `ORD${Math.floor(1000 + Math.random() * 9000)}` };
            if (i === 2) return { type: 'text', text: '149' };
            return { type: 'text', text: `Sample ${i + 1}` };
          });

          templateComponents.push({
            type: 'body',
            parameters: bodyParams,
          });
        }

        const metaPayload: Record<string, unknown> = {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: template.name,
            language: { code: template.language || 'en_US' },
          },
        };

        if (templateComponents.length > 0) {
          (metaPayload.template as Record<string, unknown>).components = templateComponents;
        }

        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metaPayload),
          }
        );
        const metaData = await metaRes.json();
        if (!metaRes.ok) {
          status = 'failed';
          errorMessage = metaData?.error?.message ?? 'Meta send error';
          console.error(`[campaigns] Failed to send to ${phone}:`, JSON.stringify(metaData));
          failedCount++;
        } else {
          metaMessageId = metaData?.messages?.[0]?.id ?? null;
          sentCount++;
          console.log(`[campaigns] Successfully sent template message to ${phone}, Meta ID: ${metaMessageId}`);

          // ── Reconstruct and record outbound template message in Inbox ──
          if (recipient.conversation_id) {
            let renderedBody = bodyText;
            bodyParams.forEach((param, idx) => {
              renderedBody = renderedBody.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), param.text);
            });

            let fullContent = '';
            if (template.header_text) fullContent += `*${template.header_text}*\n\n`;
            fullContent += renderedBody;
            if (template.footer_text) fullContent += `\n\n_${template.footer_text}_`;

            await serviceClient.from('messages').insert({
              conversation_id: recipient.conversation_id,
              tenant_id: tenantId,
              sender_type: 'bot',
              content: fullContent,
              external_message_id: metaMessageId,
              is_read: true,
              metadata: {
                is_campaign: true,
                campaign_id: campaignId,
                template_name: template.name,
              },
            });

            await serviceClient.from('conversations').update({
              last_message_preview: renderedBody,
              last_message_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('id', recipient.conversation_id);
          }
        }
      } catch (err: unknown) {
        status = 'failed';
        errorMessage = err instanceof Error ? err.message : 'Network error';
        console.error(`[campaigns] Network error sending to ${phone}:`, errorMessage);
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

    // Small delay to respect Meta rate limits
    await new Promise(r => setTimeout(r, 20));
  }

  // ── Update campaign aggregate stats ─────────────────────────
  await serviceClient
    .from('campaigns')
    .update({
      status: 'Completed',
      sent_count: sentCount,
      failed_count: failedCount,
      delivered_count: sentCount, // initial optimistic delivered count
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
}
