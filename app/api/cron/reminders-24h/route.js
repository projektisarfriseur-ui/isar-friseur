import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../lib/supabase';
import { sendReminder24h } from '../../../lib/emails';

function isAuthed(req) {
  if (req.headers.get('x-vercel-cron')) return true;
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return false;
}

export async function GET(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ skipped: true });

  // window: bookings starting between 23h and 25h from now
  const now = new Date();
  const target = new Date(now.getTime() + 24 * 3600 * 1000);
  const dateStr = target.toISOString().slice(0, 10);

  const { data: bookings, error } = await supa()
    .from('bookings').select('*')
    .eq('status', 'confirmed')
    .eq('date', dateStr);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const setQ = await supa().from('settings').select('key,value').in('key', ['cancel_policy_de','cancel_policy_en']);
  const settings = Object.fromEntries((setQ.data || []).map(r => [r.key, r.value]));
  const policyDe = settings.cancel_policy_de || '';
  const policyEn = settings.cancel_policy_en || '';

  let sent = 0;
  for (const b of bookings) {
    if (b.reminders_sent?.includes('24h')) continue;
    try {
      await sendReminder24h(b, policyDe, policyEn);
      await supa().from('bookings')
        .update({ reminders_sent: [...(b.reminders_sent || []), '24h'] })
        .eq('id', b.id);
      sent++;
    } catch (e) { console.error('24h reminder', b.id, e); }
  }
  return NextResponse.json({ sent, scanned: bookings.length, date: dateStr });
}
