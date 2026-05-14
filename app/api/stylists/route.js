import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../lib/supabase';

export async function GET() {
  if (!supaConfigured()) return NextResponse.json({ stylists: [], fallback: true });
  const { data, error } = await supa()
    .from('stylists').select('*').eq('active', true).order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stylists: data });
}
