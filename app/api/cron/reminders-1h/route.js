import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../../lib/supabase';
import { sendReminder1h } from '../../../lib/emails';

function isAuthed(req) {
  if (req.headers.get('x-vercel-cron')) return true;
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return false;
}

function hhmm(d) {
  return d.toISOString().slice(11, 16);
}

export async function GET(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supaConfigured()) return NextResponse.json({ skipped: true });

  // window: starts ~1h from now (50–70 min)
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const lower = new Date(now.getTime() + 50 * 60 * 1000);
  const upper = new Date(now.getTime() + 70 * 60 * 1000);

  const { data: bookings, error } = await supa()
    .from('bookings').select('*')
    .eq('status', 'confirmed')
    .eq('date', dateStr)
    .gte('start_time', hhmm(lower))
    .lte('start_time', hhmm(upper));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const b of bookings) {
    if (b.reminders_sent?.includes('1h')) continue;
    try {
      await sendReminder1h(b);
      await supa().from('bookings')
        .update({ reminders_sent: [...(b.reminders_sent || []), '1h'] })
        .eq('id', b.id);
      sent++;
    } catch (e) { console.error('1h reminder', b.id, e); }
  }
  return NextResponse.json({ sent, scanned: bookings.length });
}
