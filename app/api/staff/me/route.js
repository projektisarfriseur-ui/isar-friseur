import { NextResponse } from 'next/server';
import { requireStaff } from '../../../lib/staff-auth';
import { pool } from '../../../lib/db';

// Who am I + which calendars may I see.
export async function GET() {
  const { session, deny } = await requireStaff();
  if (deny) return deny;
  const { rows } = session.isAdmin
    ? await pool().query(`select id, display_name, slug, photo_url from booking.staff where archived_at is null order by sort_order, id`)
    : { rows: session.staff ? [{ ...session.staff }] : [] };
  const { rows: [settings] } = await pool().query(`select timezone, name from booking.salon_settings where id = 1`);
  return NextResponse.json({
    user: { email: session.email, name: session.displayName, isOwner: session.isOwner, isAdmin: session.isAdmin, staffId: session.staff?.id ?? null },
    staff: rows.map(r => ({ id: Number(r.id), name: r.display_name, slug: r.slug, photo_url: r.photo_url ?? null })),
    timezone: settings.timezone,
  });
}
