import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../../lib/supabase';
import { isAdmin } from '../../../../lib/auth';
import { sendBookingConfirmed, sendCancelled } from '../../../../lib/emails';

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ['status', 'admin_notes', 'date', 'start_time', 'end_time', 'stylist_id', 'first_name', 'last_name', 'phone', 'email', 'message'];
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  update.updated_at = new Date().toISOString();

  const upd = await supa().from('bookings').update(update).eq('id', id).select('*').single();
  if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });

  if (body.status === 'confirmed') await sendBookingConfirmed(upd.data).catch(() => {});
  if (body.status === 'cancelled') await sendCancelled(upd.data).catch(() => {});

  return NextResponse.json({ ok: true, booking: upd.data });
}

export async function DELETE(req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const { id } = await params;
  const del = await supa().from('bookings').delete().eq('id', id);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
