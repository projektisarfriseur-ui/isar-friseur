import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../lib/supabase';
import { isAdmin } from '../../../lib/auth';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ settings: {} });
  const { data } = await supa().from('settings').select('key,value');
  return NextResponse.json({ settings: Object.fromEntries(data.map(r => [r.key, r.value])) });
}

export async function PATCH(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const body = await req.json();
  const rows = Object.entries(body).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
  const up = await supa().from('settings').upsert(rows, { onConflict: 'key' });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
