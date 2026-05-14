import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../lib/supabase';
import { isAdmin } from '../../../lib/auth';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ stylists: [] });
  const { data, error } = await supa().from('stylists').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stylists: data });
}

export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const body = await req.json();
  const ins = await supa().from('stylists').insert(body).select('*').single();
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, stylist: ins.data });
}
