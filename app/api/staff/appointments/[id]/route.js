import { NextResponse } from 'next/server';
import { requireStaff } from '../../../../lib/staff-auth';
import { getAppointment, changeStatus, deleteAppointment } from '../../../../lib/booking/admin';
import { errorResponse, assertSameOrigin } from '../../../../lib/booking/http';
import { BookingError } from '../../../../lib/booking/engine';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req, { params }) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    const { id } = await params;
    if (!UUID.test(id)) throw new BookingError('not_found', 404);
    return NextResponse.json({ appointment: await getAppointment(session, id) }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}

// PATCH { status, version, reason?, notifyCustomer? }
export async function PATCH(req, { params }) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    await assertSameOrigin();
    const { id } = await params;
    if (!UUID.test(id)) throw new BookingError('not_found', 404);
    const body = await req.json().catch(() => ({}));
    return NextResponse.json(await changeStatus(session, id, body));
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE: owner/admin permanently removes the appointment and the customer's data.
export async function DELETE(_req, { params }) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    await assertSameOrigin();
    const { id } = await params;
    if (!UUID.test(id)) throw new BookingError('not_found', 404);
    return NextResponse.json(await deleteAppointment(session, id));
  } catch (err) {
    return errorResponse(err);
  }
}
