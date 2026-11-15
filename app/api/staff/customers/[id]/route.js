import { NextResponse } from 'next/server';
import { requireStaff } from '../../../../lib/staff-auth';
import { getCustomerHistory } from '../../../../lib/booking/history';
import { errorResponse } from '../../../../lib/booking/http';
import { BookingError } from '../../../../lib/booking/engine';

export async function GET(_req, { params }) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BookingError('not_found', 404);
    return NextResponse.json(await getCustomerHistory(session, id), { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
