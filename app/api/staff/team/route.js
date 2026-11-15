import { NextResponse } from 'next/server';
import { requireStaff } from '../../../lib/staff-auth';
import { listTeam } from '../../../lib/booking/team';
import { errorResponse } from '../../../lib/booking/http';

export async function GET() {
  const { deny } = await requireStaff({ owner: true });
  if (deny) return deny;
  try {
    return NextResponse.json({ team: await listTeam() }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
