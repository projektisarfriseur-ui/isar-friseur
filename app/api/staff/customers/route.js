import { NextResponse } from 'next/server';
import { requireStaff } from '../../../lib/staff-auth';
import { listCustomers, deleteCustomers } from '../../../lib/booking/history';
import { errorResponse, assertSameOrigin } from '../../../lib/booking/http';

// GET ?q=  -> customer history list (owner/admin only)
export async function GET(req) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    const q = new URL(req.url).searchParams.get('q') || '';
    return NextResponse.json({ customers: await listCustomers(session, { q }) }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE { ids: [uuid, ...] } -> permanently removes those customers and their visits
export async function DELETE(req) {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  try {
    await assertSameOrigin();
    const { ids } = await req.json().catch(() => ({}));
    return NextResponse.json(await deleteCustomers(session, ids));
  } catch (err) {
    return errorResponse(err);
  }
}
