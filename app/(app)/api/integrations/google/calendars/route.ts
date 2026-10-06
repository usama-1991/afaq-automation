import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { decrypt, encrypt } from '@/lib/crypto';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const serviceSupabase = createServiceClient();
    const { data: gcal, error: gcalErr } = await serviceSupabase
      .from('calendar_integrations')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .eq('provider', 'google')
      .maybeSingle();

    if (gcalErr || !gcal) {
      return NextResponse.json({ 
        connected: false, 
        calendars: [], 
        message: 'Google Calendar is not connected for this business.' 
      });
    }

    let token = decrypt(gcal.access_token);
    const expiresAtMs = new Date(gcal.token_expires_at).getTime();

    // Check if token expired or about to expire in the next 60 seconds
    if (expiresAtMs < Date.now() + 60000 && gcal.refresh_token) {
      const refreshToken = decrypt(gcal.refresh_token);
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken!,
          grant_type: 'refresh_token',
        }),
      });

      if (tokenRes.ok) {
        const tData = await tokenRes.json();
        token = tData.access_token;
        const newExpires = new Date(Date.now() + tData.expires_in * 1000).toISOString();
        await serviceSupabase.from('calendar_integrations').update({
          access_token: encrypt(token),
          token_expires_at: newExpires,
        }).eq('id', gcal.id);
      } else {
        console.error('[Google-Calendars] Refresh token exchange failed:', await tokenRes.text());
        return NextResponse.json({ 
          connected: false, 
          calendars: [], 
          error: 'Google authentication expired. Please reconnect Google Calendar.' 
        }, { status: 401 });
      }
    }

    // Call Google Calendar API to list all calendars
    const calListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!calListRes.ok) {
      const errText = await calListRes.text();
      console.error('[Google-Calendars] List error:', errText);
      return NextResponse.json({ 
        connected: true, 
        calendars: [
          { id: 'primary', summary: gcal.external_user_id || 'Primary Calendar', primary: true }
        ] 
      });
    }

    const calData = await calListRes.json();
    const items = calData.items || [];

    // Filter out holiday/read-only calendars where possible and sort primary first
    const calendars = items
      .filter((c: any) => !c.id.includes('#holiday@group.v.calendar.google.com'))
      .map((c: any) => ({
        id: c.id,
        summary: c.summaryOverride || c.summary || c.id,
        description: c.description || '',
        primary: c.primary || c.id === 'primary' || c.id === gcal.external_user_id,
        timeZone: c.timeZone || 'Asia/Karachi',
        backgroundColor: c.backgroundColor || '#dc2626'
      }))
      .sort((a: any, b: any) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0));

    return NextResponse.json({
      connected: true,
      email: gcal.external_user_id,
      calendars
    });
  } catch (err: any) {
    console.error('[Google-Calendars API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
