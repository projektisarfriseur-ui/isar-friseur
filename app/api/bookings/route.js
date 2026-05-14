import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../lib/supabase';
import { parseHHMM, addMin, toHHMM } from '../../lib/dates';
import { sendBookingReceived } from '../../lib/emails';

export async function POST(req) {
  const body = await req.json();
  const {
    service_ids, stylist_id, date, start_time,
    first_name, last_name, phone, email, message, lang = 'de',
  } = body;

  if (!service_ids?.length || !date || !start_time || !first_name || !last_name) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  if (!supaConfigured()) {
    return NextResponse.json({ ok: true, demo: true, message: 'Supabase not configured — booking not persisted' });
  }

  // fetch services to compute duration + price
  const sQ = await supa().from('services').select('*').in('id', service_ids);
  const services = sQ.data || [];
  if (!services.length) return NextResponse.json({ error: 'services not found' }, { status: 400 });

  const duration_min = services.reduce((sum, s) => sum + s.duration_min, 0);
  const allFixed = services.every(s => s.is_fixed_price);
  const totalFrom = services.reduce((sum, s) => sum + s.price_from, 0);
  const price_estimate = allFixed ? `${totalFrom} €` : `ab ${totalFrom} €`;

  const startDate = parseHHMM(date, start_time);
  const end_time = toHHMM(addMin(startDate, duration_min));

  const ins = await supa().from('bookings').insert({
    status: 'pending',
    service_ids, stylist_id: stylist_id || null,
    date, start_time, end_time, duration_min, price_estimate,
    first_name, last_name, phone, email, message, lang,
  }).select('*').single();

  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });

  await sendBookingReceived(ins.data).catch(e => console.error('email error', e));

  return NextResponse.json({ ok: true, booking: { id: ins.data.id } });
}
