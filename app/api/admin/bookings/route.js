import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../lib/supabase';
import { isAdmin } from '../../../lib/auth';
import { parseHHMM, addMin, toHHMM } from '../../../lib/dates';

export async function GET(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ bookings: [] });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let q = supa().from('bookings').select('*').order('date').order('start_time');
  if (status) q = q.eq('status', status);
  if (from) q = q.gte('date', from);
  if (to) q = q.lte('date', to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

// walk-in / manual create
export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const body = await req.json();
  const { service_ids, stylist_id, date, start_time, first_name, last_name, phone, email, message, lang = 'de', is_walkin = true } = body;

  const sQ = await supa().from('services').select('*').in('id', service_ids || []);
  const services = sQ.data || [];
  const duration_min = services.reduce((sum, s) => sum + s.duration_min, 0) || 30;
  const allFixed = services.length > 0 && services.every(s => s.is_fixed_price);
  const totalFrom = services.reduce((sum, s) => sum + s.price_from, 0);
  const price_estimate = services.length === 0 ? '—' : allFixed ? `${totalFrom} €` : `ab ${totalFrom} €`;
  const startDate = parseHHMM(date, start_time);
  const end_time = toHHMM(addMin(startDate, duration_min));

  const ins = await supa().from('bookings').insert({
    status: 'confirmed', is_walkin,
    service_ids: service_ids || [], stylist_id: stylist_id || null,
    date, start_time, end_time, duration_min, price_estimate,
    first_name: first_name || 'Walk-in', last_name: last_name || '',
    phone, email, message, lang,
  }).select('*').single();
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, booking: ins.data });
}
