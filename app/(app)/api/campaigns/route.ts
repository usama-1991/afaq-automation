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
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const ctx = await getAuthContext(supabase);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json();
  const { 
    name, 
    template_id, 
    template_name, 
    segment_name = 'All Contacts', 
    schedule_type = 'immediate', 
    scheduled_at,
    variable_mappings = {},
    segment_rules = {},
    rate_per_second = 25,
  } = body;

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

  // ── Query recipient contacts based on dynamic segment rules ──
  let query = supabase
    .from('conversations')
    .select('id, external_conversation_id, customer_name, customer_phone, platform, lifecycle_stage, tags, is_opted_out, updated_at')
    .eq('tenant_id', ctx.tenantId)
    .eq('platform', 'whatsapp');

  // Opt-out guard
  query = query.neq('is_opted_out', true);

  const { lifecycle_stages, tags, engagement_days } = segment_rules;

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

  const { data: conversations, error: convError } = await query;
  if (convError) return NextResponse.json({ error: convError.message }, { status: 500 });

  // Deduplicate by phone
  const uniqueRecipients = new Map<string, any>();
  (conversations || []).forEach(c => {
    const rawPhone = (c.external_conversation_id || c.customer_phone || '').replace(/\D/g, '');
    if (rawPhone.length >= 7 && !uniqueRecipients.has(rawPhone)) {
      uniqueRecipients.set(rawPhone, {
        conversation_id: c.id,
        phone: rawPhone,
        name: c.customer_name || 'Valued Customer',
      });
    }
  });

  const recipientsList = Array.from(uniqueRecipients.values());
  const isImmediate = schedule_type === 'immediate';

  // ── Create campaign record ───────────────────────────────────
  const { data: campaign, error: campError } = await supabase
    .from('campaigns')
    .insert({
      tenant_id: ctx.tenantId,
      name,
      template_id,
      template_name,
      segment_name,
      segment_rules,
      variable_mappings,
      rate_per_second: Math.max(5, Math.min(rate_per_second || 25, 80)),
      status: isImmediate ? (recipientsList.length > 0 ? 'In Progress' : 'Completed') : 'Scheduled',
      scheduled_at: isImmediate ? null : (scheduled_at || null),
      total_recipients: recipientsList.length,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      failed_count: 0,
    })
    .select()
    .single();

  if (campError) return NextResponse.json({ error: campError.message }, { status: 500 });

  // ── Seed recipient logs into public.campaign_recipients ───────
  if (recipientsList.length > 0) {
    const recipientRows = recipientsList.map(r => ({
      campaign_id: campaign.id,
      tenant_id: ctx.tenantId,
      contact_phone: r.phone,
      contact_name: r.name,
      status: 'pending',
    }));

    // Insert in chunks of 500
    for (let i = 0; i < recipientRows.length; i += 500) {
      const chunk = recipientRows.slice(i, i + 500);
      await supabase.from('campaign_recipients').insert(chunk);
    }
  }

  // ── Trigger background dispatcher if immediate ───────────────
  if (isImmediate && recipientsList.length > 0) {
    sendCampaignMessagesPaced(
      campaign.id,
      ctx.tenantId,
      template,
      recipientsList,
      variable_mappings,
      campaign.rate_per_second || 25
    ).catch(err => console.error('[campaigns] Background send error:', err.message));
  }

  return NextResponse.json({ campaign }, { status: 201 });
}

// ── Background Paced Dispatcher ──────────────────────────────
async function sendCampaignMessagesPaced(
  campaignId: string,
  tenantId: string,
  template: Record<string, unknown>,
  recipients: Array<{ conversation_id?: string; phone: string; name: string }>,
  variableMappings: Record<string, string>,
  ratePerSecond: number
) {
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();

  const { phoneNumberId, accessToken } = await getTenantWhatsAppCredentials(serviceClient, tenantId);

  let sentCount = 0;
  let failedCount = 0;

  const bodyText = String(template.body_text || '');
  const bodyParamMatches = bodyText.match(/\{\{\d+\}\}/g) || [];

  const headerText = String(template.header_text || '');
  const headerParamMatches = headerText.match(/\{\{\d+\}\}/g) || [];

  const delayMs = Math.max(20, Math.floor(1000 / (ratePerSecond || 25)));

  for (const recipient of recipients) {
    const phone = recipient.phone;
    let metaMessageId: string | null = null;
    let sendStatus = 'sent';
    let errorMessage: string | null = null;

    if (!phoneNumberId || !accessToken) {
      sendStatus = 'failed';
      errorMessage = 'WhatsApp credentials not configured for tenant';
      failedCount++;
    } else {
      try {
        const templateComponents: Record<string, unknown>[] = [];

        // 1. Header Component
        if (template.header_type === 'Text' && headerParamMatches.length > 0) {
          templateComponents.push({
            type: 'header',
            parameters: headerParamMatches.map((_, i) => {
              const varKey = `h_${i + 1}`;
              const mapping = variableMappings[varKey] || variableMappings[String(i + 1)];
              let val = recipient.name || 'Customer';
              if (mapping?.startsWith('custom_text:')) val = mapping.replace('custom_text:', '');
              return { type: 'text', text: val };
            }),
          });
        }

        // 2. Body Component with Variable Mapping
        if (bodyParamMatches.length > 0) {
          const bodyParams = bodyParamMatches.map((_, i) => {
            const varNum = i + 1;
            const mapping = variableMappings[String(varNum)];
            let paramValue = recipient.name || 'Valued Customer';

            if (mapping === 'first_name') {
              paramValue = recipient.name.split(' ')[0] || 'Customer';
            } else if (mapping === 'phone') {
              paramValue = recipient.phone;
            } else if (mapping?.startsWith('custom_text:')) {
              paramValue = mapping.replace('custom_text:', '');
            } else if (!mapping) {
              if (i === 0) paramValue = recipient.name;
              else if (i === 1) paramValue = 'PROMO2026';
              else paramValue = `Info ${i + 1}`;
            }

            return { type: 'text', text: String(paramValue).substring(0, 100) };
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
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(metaPayload),
          }
        );

        const metaData = await metaRes.json().catch(() => ({}));

        if (metaRes.ok && metaData.messages?.[0]?.id) {
          metaMessageId = metaData.messages[0].id;
          sentCount++;
          sendStatus = 'sent';
        } else {
          sendStatus = 'failed';
          errorMessage = metaData.error?.message || `Meta API status ${metaRes.status}`;
          failedCount++;
        }
      } catch (err: any) {
        sendStatus = 'failed';
        errorMessage = err.message || 'Network error';
        failedCount++;
      }
    }

    // Update recipient log
    await serviceClient
      .from('campaign_recipients')
      .update({
        status: sendStatus,
        meta_message_id: metaMessageId,
        error_message: errorMessage,
        sent_at: sendStatus === 'sent' ? new Date().toISOString() : null,
      })
      .eq('campaign_id', campaignId)
      .eq('contact_phone', phone);

    // Rate pacing delay
    await new Promise(r => setTimeout(r, delayMs));
  }

  // Update final campaign metrics
  await serviceClient
    .from('campaigns')
    .update({
      sent_count: sentCount,
      failed_count: failedCount,
      status: failedCount === recipients.length && recipients.length > 0 ? 'Failed' : 'Completed',
    })
    .eq('id', campaignId);
}
