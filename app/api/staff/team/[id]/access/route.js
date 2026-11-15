import { NextResponse } from 'next/server';
import { requireStaff } from '../../../../../lib/staff-auth';
import { inviteStaff, resetStaffPassword, revokeStaff } from '../../../../../lib/booking/team';
import { errorResponse, assertSameOrigin } from '../../../../../lib/booking/http';
import { BookingError } from '../../../../../lib/booking/engine';

// POST { action: 'invite' | 'reset' | 'revoke', email? }  — owner only.
export async function POST(req, { params }) {
  const { session, deny } = await requireStaff({ owner: true });
  if (deny) return deny;
  try {
    await assertSameOrigin();
    const { id } = await params;
    const staffId = Number(id);
    if (!Number.isInteger(staffId)) throw new BookingError('not_found', 404);
    const { action, email } = await req.json().catch(() => ({}));
    const origin = new URL(req.url).origin;
    let result;
    if (action === 'invite') result = await inviteStaff(session, staffId, email, origin);
    else if (action === 'reset') result = await resetStaffPassword(session, staffId, origin);
    else if (action === 'revoke') result = await revokeStaff(session, staffId);
    else throw new BookingError('invalid_input');
    return NextResponse.json(result, { headers: { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } });
  } catch (err) {
    return errorResponse(err);
  }
}
