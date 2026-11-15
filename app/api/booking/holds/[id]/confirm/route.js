import { NextResponse } from 'next/server';
import { confirmHold } from '../../../../../lib/booking/service';
import { guestSession, errorResponse, assertSameOrigin } from '../../../../../lib/booking/http';
import { BookingError } from '../../../../../lib/booking/engine';

// POST /api/booking/holds/:id/confirm  (header: Idempotency-Key)
export async function POST(req, { params }) {
  try {
    await assertSameOrigin();
    const { id } = await params;
    const sessionDigest = await guestSession();
    if (!sessionDigest) throw new BookingError('hold_not_found', 404);
    const body = await req.json().catch(() => ({}));
    if (!body.consent) throw new BookingError('privacy_ack_required', 422);
    const result = await confirmHold({
      holdId: id,
      sessionDigest,
      idempotencyKey: req.headers.get('idempotency-key'),
      customer: body,
      lang: body.lang,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
