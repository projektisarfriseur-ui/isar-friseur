import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../lib/supabase';
import { computeSlots } from '../../../lib/dates';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const duration = parseInt(searchParams.get('duration') || '30', 10);
  const stylistIdRaw = searchParams.get('stylistId');
  const stylistId = stylistIdRaw && stylistIdRaw !== 'any' ? parseInt(stylistIdRaw, 10) : null;

  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

  if (!supaConfigured()) {
    return NextResponse.json({
      slots: ['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'],
      fallback: true,
    });
  }

  const weekday = new Date(date + 'T12:00:00').getDay();

  // closures (whole salon or for stylist)
  const closuresQ = await supa().from('closures').select('*').eq('date', date);
  const closed = (closuresQ.data || []).some(c => c.stylist_id === null || c.stylist_id === stylistId);
  if (closed) return NextResponse.json({ slots: [], closed: true });

  // hours
  const hrs = await supa().from('weekly_hours').select('*').eq('weekday', weekday);
  const stylistHours = stylistId ? (hrs.data || []).find(h => h.stylist_id === stylistId) : null;
  const salonHours = (hrs.data || []).find(h => h.stylist_id === null);
  const hours = stylistHours || salonHours;
  if (!hours?.open_time || !hours?.close_time) return NextResponse.json({ slots: [], closed: true });

  // existing bookings
  let q = supa().from('bookings').select('start_time,end_time,stylist_id')
    .eq('date', date).in('status', ['pending','confirmed']);
  if (stylistId) q = q.eq('stylist_id', stylistId);
  const { data: bookings } = await q;

  // load settings
  const setQ = await supa().from('settings').select('key,value').in('key', ['slot_minutes','buffer_minutes']);
  const settings = Object.fromEntries((setQ.data || []).map(r => [r.key, r.value]));

  const slots = computeSlots({
    dateStr: date,
    hours: { open: hours.open_time, close: hours.close_time },
    bookings: bookings || [],
    durationMin: duration,
    slotMinutes: settings.slot_minutes || 30,
    bufferMin: settings.buffer_minutes || 10,
  });

  return NextResponse.json({ slots });
}
