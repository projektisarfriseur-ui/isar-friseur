import { NextResponse } from 'next/server';
import { requireStaff } from '../../../lib/staff-auth';
import { listAppointments } from '../../../lib/booking/admin';
import { errorResponse } from '../../../lib/booking/http';
import { BookingError } from '../../../lib/booking/engine';

// GET ?from=ISO&to=ISO&staffId=&cancelled=1
export async function GET(req) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    const q = new URL(req.url).searchParams;
    const from = new Date(q.get('from'));
    const to = new Date(q.get('to'));
    if (isNaN(from) || isNaN(to) || to <= from || to - from > 100 * 86400_000) throw new BookingError('invalid_input');
    const rows = await listAppointments(session, {
      from: from.toISOString(),
      to: to.toISOString(),
      staffId: q.get('staffId') || null,
      includeCancelled: q.get('cancelled') === '1',
    });
    return NextResponse.json({ appointments: rows }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
