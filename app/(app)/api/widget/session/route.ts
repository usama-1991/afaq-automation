import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import crypto from 'crypto';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tenantId, lead, metadata } = body;
    let { visitorId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Auto-generate visitor ID if missing
    if (!visitorId || typeof visitorId !== 'string') {
      visitorId = `ittisalo_vid_${crypto.randomUUID()}`;
    }

    const supabase = createServiceClient();

    // Verify tenant exists
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('id, business_name')
      .eq('id', tenantId)
      .maybeSingle();

    if (tErr || !tenant) {
      return NextResponse.json(
        { error: 'Tenant workspace not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Check for existing conversation with this visitor ID
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id, customer_name, status, visitor_metadata')
      .eq('tenant_id', tenantId)
      .eq('platform', 'web_widget')
      .eq('external_conversation_id', visitorId)
      .maybeSingle();

    if (existingConv) {
      // If lead submitted during active session, update customer name & metadata
      if (lead?.name || lead?.phone || lead?.email) {
        const updatedMeta = {
          ...(existingConv.visitor_metadata || {}),
          ...(metadata || {}),
          lead: {
            ...((existingConv.visitor_metadata as any)?.lead || {}),
            ...(lead || {}),
          },
          last_active_at: new Date().toISOString()
        };

        await supabase
          .from('conversations')
          .update({
            customer_name: lead.name || existingConv.customer_name,
            visitor_metadata: updatedMeta,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConv.id);
      }

      return NextResponse.json({
        conversationId: existingConv.id,
        visitorId,
        customerName: lead?.name || existingConv.customer_name || 'Website Visitor',
        status: existingConv.status || 'open',
        isNew: false
      }, { status: 200, headers: CORS_HEADERS });
    }

    // Create a new conversation row
    const customerName = lead?.name || 'Website Visitor';
    const convPayload: any = {
      tenant_id: tenantId,
      platform: 'web_widget',
      external_conversation_id: visitorId,
      customer_name: customerName,
      status: 'open',
      unread_count: 0,
      visitor_metadata: {
        ...(metadata || {}),
        lead: lead || null,
        created_at: new Date().toISOString()
      },
      last_message_preview: 'Started web chat session',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newConv, error: insertErr } = await supabase
      .from('conversations')
      .insert(convPayload)
      .select('id, customer_name, status')
      .single();

    if (insertErr) {
      console.error('[Widget Session Create Error]:', insertErr);
      return NextResponse.json(
        { 
          error: 'Failed to initialize conversation session',
          details: insertErr.message
        },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({
      conversationId: newConv.id,
      visitorId,
      customerName: newConv.customer_name,
      status: newConv.status,
      isNew: true
    }, { status: 201, headers: CORS_HEADERS });

  } catch (err: any) {
    console.error('[Widget Session API Error]:', err);
    return NextResponse.json(
      { error: 'Internal server error initializing session' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
