import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-auth';

export async function POST() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
