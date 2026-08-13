import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');
  const tenantId = searchParams.get('tenant_id');

  if (!dateStr || !tenantId) {
    return NextResponse.json({ error: 'date and tenant_id are required' }, { status: 400 });
  }

  // 1. Fetch appointments for this date
  const supabase = createServiceClient();
  const startOfDay = new Date(`${dateStr}T00:00:00Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59Z`);

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('start_time, end_time, appointment_date, appointment_time, status')
    .eq('tenant_id', tenantId)
    .neq('status', 'canceled');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Fetch Tenant Business Hours
  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_hours_start, business_hours_end')
    .eq('id', tenantId)
    .single();

  const parseTime = (timeStr: string | null, defaultHour: number) => {
    if (!timeStr) return defaultHour;
    const [h] = timeStr.split(':');
    return parseInt(h, 10) || defaultHour;
  };

  const workingHourStart = parseTime(tenant?.business_hours_start, 9);
  const workingHourEnd = parseTime(tenant?.business_hours_end, 18);
  const slotDurationMinutes = 30;

  const availableSlots: string[] = [];

  // 3. Generate all possible slots for the day
  for (let hour = workingHourStart; hour < workingHourEnd; hour++) {
    for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
      const slotTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      
      // Create a Date object for this slot in UTC (assuming dateStr is YYYY-MM-DD local, treating as UTC for simplicity)
      const slotStart = new Date(`${dateStr}T${slotTimeStr}Z`);
      const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60000);

      // 4. Check against all appointments
      let isAvailable = true;

      for (const appt of appointments) {
        // If appointment uses start_time and end_time (Google/Calendly)
        if (appt.start_time && appt.end_time) {
          const apptStart = new Date(appt.start_time);
          const apptEnd = new Date(appt.end_time);

          // Check overlap
          if (slotStart < apptEnd && slotEnd > apptStart) {
            isAvailable = false;
            break;
          }
        } 
        // If appointment uses appointment_date and appointment_time (Manual/Chatbot)
        else if (appt.appointment_date === dateStr && appt.appointment_time) {
          const apptStart = new Date(`${appt.appointment_date}T${appt.appointment_time}Z`);
          // Assume manual appointments take 30 mins
          const apptEnd = new Date(apptStart.getTime() + 30 * 60000);
          
          if (slotStart < apptEnd && slotEnd > apptStart) {
            isAvailable = false;
            break;
          }
        }
      }

      if (isAvailable) {
        // Just return the HH:MM format
        availableSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
  }

  return NextResponse.json({
    date: dateStr,
    available_slots: availableSlots,
    total_slots: availableSlots.length
  });
}
