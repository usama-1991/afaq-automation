import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, max-age=60, s-maxage=120',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: tenantId' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenantId format' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createServiceClient();
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, business_name, business_phone, ig_page_id, logo_url, widget_settings, niche')
      .eq('id', tenantId)
      .maybeSingle();

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant workspace not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const ws = tenant.widget_settings || {};
    const isEnabled = ws.enabled !== false;

    // Build clean WhatsApp link parameter
    const rawPhone = tenant.business_phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');

    const config = {
      enabled: isEnabled,
      tenantId: tenant.id,
      businessName: tenant.business_name || 'Ittisalo Assistant',
      avatarUrl: ws.avatar_url || tenant.logo_url || '',
      primaryColor: ws.primary_color || '#dc2626',
      headerTitle: ws.header_title || 'Chat with us',
      subheading: ws.subheading || 'Typically replies in minutes',
      welcomeMessage: ws.welcome_message || 'Hi there! How can we help you today?',
      position: ws.position === 'bottom-left' ? 'bottom-left' : 'bottom-right',
      showWhatsappButton: ws.show_whatsapp_button !== false && cleanPhone.length > 0,
      whatsappNumber: cleanPhone,
      showInstagramButton: ws.show_instagram_button !== false && !!tenant.ig_page_id,
      instagramHandle: tenant.ig_page_id || '',
      requireLeadForm: ws.require_lead_form !== false,
      leadFields: Array.isArray(ws.lead_fields) ? ws.lead_fields : ['name', 'phone'],
      allowedDomains: Array.isArray(ws.allowed_domains) ? ws.allowed_domains : [],
      niche: tenant.niche || 'general'
    };

    return NextResponse.json(config, {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    console.error('[Widget Config API Error]:', err);
    return NextResponse.json(
      { error: 'Internal server error fetching widget configuration' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
