// Server-side staff identity + permissions. Every admin route calls this;
// hiding buttons in the UI is not authorisation.
import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseServer } from './supabase-auth';
import { pool } from './db';

export async function getStaffSession() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();   // validates the JWT with Supabase
  if (!user) return null;

  const db = pool();
  const [{ rows: roles }, { rows: staffRows }] = await Promise.all([
    db.query(`select role, permissions from booking.role_assignments where user_id = $1 and revoked_at is null`, [user.id]),
    db.query(`select id, display_name, slug from booking.staff where user_id = $1 and archived_at is null`, [user.id]),
  ]);
  if (!roles.length) return null;   // signed in but not staff (e.g. a customer)

  const roleSet = new Set(roles.map(r => r.role));
  const staff = staffRows[0] ? { ...staffRows[0], id: Number(staffRows[0].id) } : null;
  return {
    userId: user.id,
    email: user.email,
    isOwner: roleSet.has('owner'),
    isAdmin: roleSet.has('owner') || roleSet.has('admin'),
    roles: [...roleSet],
    staff,
    displayName: staff?.display_name || user.email,
  };
}

// Usage in a route: const { session, deny } = await requireStaff(); if (deny) return deny;
export async function requireStaff({ owner = false } = {}) {
  const session = await getStaffSession();
  if (!session) return { deny: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  if (owner && !session.isOwner) return { deny: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { session };
}
