import { decrypt } from './crypto.js';

export async function processCampaign(supabase, campaignId) {
  try {
    console.log(`[campaign] Starting processing for campaign: ${campaignId}`);

    // 1. Fetch Campaign Details
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campErr || !campaign) {
      console.error('[campaign] Campaign not found', campErr);
      return;
    }

    // Mark as In Progress
    await supabase.from('campaigns').update({ status: 'In Progress' }).eq('id', campaignId);

    // 2. Fetch Template Details
    let template = null;
    if (campaign.template_id) {
      const { data: tplData } = await supabase
        .from('templates')
        .select('*')
        .eq('id', campaign.template_id)
        .maybeSingle();
      template = tplData;
    }

    // 3. Fetch Tenant Meta Credentials
    let waPhoneNumberId = '';
    let waAccessToken = '';

    const { data: tenant } = await supabase
      .from('tenants')
      .select('wa_phone_number_id, wa_token_enc')
      .eq('id', campaign.tenant_id)
      .single();

    if (tenant?.wa_phone_number_id && tenant?.wa_token_enc) {
      waPhoneNumberId = tenant.wa_phone_number_id;
      waAccessToken = decrypt(tenant.wa_token_enc);
    } else {
      const { data: integration } = await supabase
        .from('integrations')
        .select('credentials, external_account_id')
        .eq('tenant_id', campaign.tenant_id)
        .eq('platform', 'meta')
        .maybeSingle();

      if (integration?.credentials) {
        waPhoneNumberId = integration.credentials.phone_number_id || integration.external_account_id || '';
        waAccessToken = decrypt(integration.credentials.access_token) || '';
      }
    }

    waPhoneNumberId = waPhoneNumberId || process.env.META_PHONE_NUMBER_ID || '';
    waAccessToken = waAccessToken || process.env.META_ACCESS_TOKEN || '';

    if (!waPhoneNumberId || !waAccessToken) {
      console.error('[campaign] No Meta API credentials found for tenant');
      await supabase.from('campaigns').update({ status: 'Failed' }).eq('id', campaignId);
      return;
    }

    // 4. Fetch Contacts (By Segment Rules or campaign_recipients)
    let recipients = [];
    const { data: seededRecipients } = await supabase
      .from('campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId);

    if (seededRecipients && seededRecipients.length > 0) {
      recipients = seededRecipients.map(r => ({
        id: r.id,
        phone: r.contact_phone,
        name: r.contact_name || 'Valued Customer',
      }));
    } else {
      // Fallback query based on segment_rules
      let query = supabase
        .from('conversations')
        .select('id, external_conversation_id, customer_name, customer_phone, lifecycle_stage, tags, is_opted_out')
        .eq('tenant_id', campaign.tenant_id)
        .eq('platform', 'whatsapp')
        .neq('is_opted_out', true);

      const rules = campaign.segment_rules || {};
      if (Array.isArray(rules.lifecycle_stages) && rules.lifecycle_stages.length > 0) {
        query = query.in('lifecycle_stage', rules.lifecycle_stages);
      }
      if (Array.isArray(rules.tags) && rules.tags.length > 0) {
        query = query.overlaps('tags', rules.tags);
      }

      const { data: convs } = await query;
      const unique = new Map();
      (convs || []).forEach(c => {
        const phone = (c.external_conversation_id || c.customer_phone || '').replace(/\D/g, '');
        if (phone.length >= 7 && !unique.has(phone)) {
          unique.set(phone, {
            phone: phone,
            name: c.customer_name || 'Valued Customer',
          });
        }
      });
      recipients = Array.from(unique.values());
    }

    if (recipients.length === 0) {
      console.log('[campaign] No contacts found for segment.');
      await supabase.from('campaigns').update({ status: 'Completed', total_recipients: 0 }).eq('id', campaignId);
      return;
    }

    await supabase.from('campaigns').update({ total_recipients: recipients.length }).eq('id', campaignId);

    // 5. Batch Sending with Adaptive Token Bucket Pacing
    const ratePerSecond = campaign.rate_per_second || 25;
    const delayMs = Math.max(20, Math.floor(1000 / ratePerSecond));
    const variableMappings = campaign.variable_mappings || {};

    const bodyText = String(template?.body_text || '');
    const bodyParamMatches = bodyText.match(/\{\{\d+\}\}/g) || [];

    const headerText = String(template?.header_text || '');
    const headerParamMatches = headerText.match(/\{\{\d+\}\}/g) || [];

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const toPhone = recipient.phone.replace(/\D/g, '');
      let metaMessageId = null;
      let status = 'sent';
      let errorMessage = null;

      try {
        const templateComponents = [];

        // Header Component
        if (template?.header_type === 'Text' && headerParamMatches.length > 0) {
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

        // Body Component
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

        const metaPayload = {
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'template',
          template: {
            name: campaign.template_name,
            language: { code: template?.language || 'en_US' },
          },
        };

        if (templateComponents.length > 0) {
          metaPayload.template.components = templateComponents;
        }

        const metaUrl = `https://graph.facebook.com/v21.0/${waPhoneNumberId}/messages`;
        const response = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${waAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metaPayload),
        });

        const responseData = await response.json();

        if (response.ok && responseData.messages?.[0]?.id) {
          sentCount++;
          metaMessageId = responseData.messages[0].id;
          status = 'sent';
        } else {
          failedCount++;
          status = 'failed';
          errorMessage = responseData.error?.message || `Meta API status ${response.status}`;
          console.error(`[campaign] Failed sending to ${toPhone}:`, errorMessage);
        }
      } catch (err) {
        failedCount++;
        status = 'failed';
        errorMessage = err.message || 'Network error';
        console.error(`[campaign] Error sending to ${toPhone}:`, err.message);
      }

      // Update or insert recipient status
      if (recipient.id) {
        await supabase
          .from('campaign_recipients')
          .update({
            status,
            meta_message_id: metaMessageId,
            error_message: errorMessage,
            sent_at: status === 'sent' ? new Date().toISOString() : null,
          })
          .eq('id', recipient.id);
      } else {
        await supabase.from('campaign_recipients').insert({
          campaign_id: campaignId,
          tenant_id: campaign.tenant_id,
          contact_phone: toPhone,
          contact_name: recipient.name,
          status,
          meta_message_id: metaMessageId,
          error_message: errorMessage,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        });
      }

      // Token-bucket pacing delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // 6. Finalize Campaign Metrics
    await supabase.from('campaigns').update({
      status: failedCount === recipients.length && recipients.length > 0 ? 'Failed' : 'Completed',
      sent_count: sentCount,
      failed_count: failedCount,
    }).eq('id', campaignId);

    console.log(`[campaign] Completed processing for campaign ${campaignId}. Sent: ${sentCount}, Failed: ${failedCount}`);
  } catch (error) {
    console.error('[campaign] Fatal error:', error);
    await supabase.from('campaigns').update({ status: 'Failed' }).eq('id', campaignId);
  }
}
