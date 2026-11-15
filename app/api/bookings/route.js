import { NextResponse } from 'next/server';

// Legacy endpoint (no double-booking protection). Replaced by
// POST /api/booking/holds + POST /api/booking/holds/:id/confirm.
export async function POST() {
  return NextResponse.json({ error: 'gone', use: '/api/booking/holds' }, { status: 410 });
}
