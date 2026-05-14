import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../lib/supabase';
import { sendCancelled } from '../../../lib/emails';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  if (!token) return NextResponse.redirect(`${site}/booking/result?status=invalid`);
  if (!supaConfigured()) return NextResponse.redirect(`${site}/booking/result?status=demo`);

  const upd = await supa().from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('cancel_token', token).in('status', ['pending','confirmed'])
    .select('*').single();

  if (upd.error || !upd.data) return NextResponse.redirect(`${site}/booking/result?status=invalid`);
  await sendCancelled(upd.data).catch(e => console.error('email', e));
  return NextResponse.redirect(`${site}/booking/result?status=cancelled`);
}
