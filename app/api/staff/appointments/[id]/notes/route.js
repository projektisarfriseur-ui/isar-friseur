import { NextResponse } from 'next/server';
import { requireStaff } from '../../../../../lib/staff-auth';
import { addNote } from '../../../../../lib/booking/admin';
import { errorResponse, assertSameOrigin } from '../../../../../lib/booking/http';
import { BookingError } from '../../../../../lib/booking/engine';

export async function POST(req, { params }) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    await assertSameOrigin();
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BookingError('not_found', 404);
    const { body } = await req.json().catch(() => ({}));
    return NextResponse.json({ note: await addNote(session, id, body) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
