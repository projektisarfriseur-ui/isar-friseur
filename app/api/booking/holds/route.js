import { NextResponse } from 'next/server';
import { createHold, releaseHold } from '../../../lib/booking/service';
import { guestSession, clientIp, errorResponse, assertSameOrigin } from '../../../lib/booking/http';
import { BookingError } from '../../../lib/booking/engine';

// POST { date, time, serviceIds, staffId } -> short-lived hold on the full allocation set.
export async function POST(req) {
  try {
    await assertSameOrigin();
    const body = await req.json().catch(() => ({}));
    const sessionDigest = await guestSession({ create: true });
    const hold = await createHold({
      date: body.date,
      time: body.time,
      serviceIds: body.serviceIds,
      staffId: body.staffId,
      sessionDigest,
      ip: await clientIp(),
    });
    return NextResponse.json(hold, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE ?id=<holdId> -> release an owned hold early.
export async function DELETE(req) {
  try {
    await assertSameOrigin();
    const id = new URL(req.url).searchParams.get('id');
    const sessionDigest = await guestSession();
    if (!id || !sessionDigest) throw new BookingError('hold_not_found', 404);
    await releaseHold(id, sessionDigest);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
