import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../lib/supabase';
import { isAdmin } from '../../../lib/auth';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ hours: [], closures: [] });
  const h = await supa().from('weekly_hours').select('*').order('stylist_id').order('weekday');
  const c = await supa().from('closures').select('*').order('date');
  return NextResponse.json({ hours: h.data, closures: c.data });
}

// upsert single weekly_hours row
export async function PATCH(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const body = await req.json();
  const { stylist_id, weekday, open_time, close_time } = body;
  const up = await supa().from('weekly_hours')
    .upsert({ stylist_id: stylist_id ?? null, weekday, open_time, close_time }, { onConflict: 'stylist_id,weekday' })
    .select('*').single();
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, row: up.data });
}

export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const body = await req.json();
  // add closure
  const ins = await supa().from('closures').insert({ stylist_id: body.stylist_id ?? null, date: body.date, reason: body.reason }).select('*').single();
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, closure: ins.data });
}

export async function DELETE(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const url = new URL(req.url);
  const id = url.searchParams.get('closure_id');
  if (!id) return NextResponse.json({ error: 'closure_id required' }, { status: 400 });
  const del = await supa().from('closures').delete().eq('id', id);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
