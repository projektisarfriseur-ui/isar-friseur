import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../../lib/supabase';
import { isAdmin } from '../../../../lib/auth';

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const { id } = await params;
  const body = await req.json();
  const upd = await supa().from('stylists').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, stylist: upd.data });
}

export async function DELETE(req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const { id } = await params;
  const del = await supa().from('stylists').delete().eq('id', id);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
