// Owner-only staff account management. Accounts are invite-only (no public
// staff sign-up). The owner gets a single-use link to hand to the employee,
// who then chooses their own password; we never see or store it.
import { pool, withTransaction } from '../db';
import { supa } from '../supabase';
import { BookingError } from './engine';

export async function listTeam() {
  const { rows } = await pool().query(`
    select s.id, s.display_name, s.slug, s.photo_url, s.bookable, s.archived_at,
           u.email, u.last_sign_in_at, u.banned_until,
           exists (select 1 from booking.role_assignments r
                    where r.user_id = s.user_id and r.revoked_at is null) as has_access
      from booking.staff s
      left join auth.users u on u.id = s.user_id
     where s.archived_at is null
     order by s.sort_order, s.id`);
  return rows.map(r => ({
    id: Number(r.id),
    name: r.display_name,
    slug: r.slug,
    photo_url: r.photo_url,
    bookable: r.bookable,
    email: r.email,
    lastSignInAt: r.last_sign_in_at,
    access: r.email && r.has_access && !(r.banned_until && new Date(r.banned_until) > new Date()) ? 'active' : r.email ? 'revoked' : 'none',
  }));
}

function confirmLink(origin, hashedToken, type) {
  const u = new URL('/admin/auth/confirm', origin);
  u.searchParams.set('token_hash', hashedToken);
  u.searchParams.set('type', type);
  return u.toString();
}

async function audit(db, actor, action, entityId, reason = null) {
  await db.query(
    `insert into booking.audit_events (actor_user_id, action, entity, entity_id, reason) values ($1, $2, 'staff', $3, $4)`,
    [actor, action, String(entityId), reason]);
}

// Create (or re-issue) access for one staff member and return a setup link.
export async function inviteStaff(owner, staffId, email, origin) {
  const addr = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) throw new BookingError('invalid_input', 400, { field: 'email' });

  const { rows: [staff] } = await pool().query(
    `select s.id, s.user_id, u.email from booking.staff s left join auth.users u on u.id = s.user_id
      where s.id = $1 and s.archived_at is null`, [staffId]);
  if (!staff) throw new BookingError('not_found', 404);
  if (staff.user_id && staff.email && staff.email.toLowerCase() !== addr) {
    throw new BookingError('staff_has_other_account', 409, { email: staff.email });
  }

  const admin = supa().auth.admin;
  let type = 'invite';
  let { data, error } = await admin.generateLink({ type: 'invite', email: addr });
  if (error && /already|registered|exists/i.test(error.message || '')) {
    type = 'recovery';
    ({ data, error } = await admin.generateLink({ type: 'recovery', email: addr }));
  }
  if (error || !data?.user) throw new BookingError('auth_provider_error', 502);
  const userId = data.user.id;

  // An account already tied to another staff profile can't be reused silently.
  const { rows: clash } = await pool().query(
    `select id from booking.staff where user_id = $1 and id <> $2`, [userId, staffId]);
  if (clash.length) throw new BookingError('account_linked_elsewhere', 409);

  if (data.user.banned_until) await admin.updateUserById(userId, { ban_duration: 'none' });

  await withTransaction(async (db) => {
    await db.query(`update booking.staff set user_id = $2 where id = $1`, [staffId, userId]);
    await db.query(`
      insert into booking.role_assignments (user_id, role, granted_by)
      select $1, 'hairdresser', $2
       where not exists (select 1 from booking.role_assignments
                          where user_id = $1 and role = 'hairdresser' and revoked_at is null)`,
      [userId, owner.userId]);
    await audit(db, owner.userId, type === 'invite' ? 'staff.invited' : 'staff.access_link', staffId);
  });

  return { link: confirmLink(origin, data.properties.hashed_token, type), type, email: addr };
}

// New password-setup link for an employee who forgot their password.
export async function resetStaffPassword(owner, staffId, origin) {
  const { rows: [staff] } = await pool().query(
    `select s.id, u.email from booking.staff s join auth.users u on u.id = s.user_id where s.id = $1`, [staffId]);
  if (!staff?.email) throw new BookingError('no_account', 409);
  return inviteStaff(owner, staffId, staff.email, origin);
}

// Offboarding access: revoke role, unlink, block sign-in. History stays (ADM-04).
export async function revokeStaff(owner, staffId) {
  const { rows: [staff] } = await pool().query(`select id, user_id from booking.staff where id = $1`, [staffId]);
  if (!staff?.user_id) throw new BookingError('no_account', 409);
  if (staff.user_id === owner.userId) throw new BookingError('cannot_revoke_self', 422);
  await withTransaction(async (db) => {
    await db.query(`update booking.role_assignments set revoked_at = now()
                     where user_id = $1 and role <> 'owner' and revoked_at is null`, [staff.user_id]);
    await db.query(`update booking.staff set user_id = null where id = $1`, [staffId]);
    await audit(db, owner.userId, 'staff.access_revoked', staffId);
  });
  await supa().auth.admin.updateUserById(staff.user_id, { ban_duration: '876000h' });
  return { ok: true };
}
