import { NextResponse } from 'next/server';
import { requireStaff } from '../../../../../lib/staff-auth';
import { getPayment, recordPayment } from '../../../../../lib/booking/history';
import { errorResponse, assertSameOrigin } from '../../../../../lib/booking/http';
import { BookingError } from '../../../../../lib/booking/engine';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req, { params }) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    const { id } = await params;
    if (!UUID.test(id)) throw new BookingError('not_found', 404);
    return NextResponse.json({ payment: await getPayment(session, id) }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT { method: 'cash'|'card'|'voucher'|'other', amount_minor }
export async function PUT(req, { params }) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    await assertSameOrigin();
    const { id } = await params;
    if (!UUID.test(id)) throw new BookingError('not_found', 404);
    const body = await req.json().catch(() => ({}));
    return NextResponse.json(await recordPayment(session, id, body));
  } catch (err) {
    return errorResponse(err);
  }
}
