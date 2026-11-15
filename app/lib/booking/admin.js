// Staff-side appointment queries and mutations. Callers pass the session from
// requireStaff(); visibility is enforced here, in SQL.
import { pool, withTransaction } from '../db';
import { BookingError } from './engine';

// owner/admin: everything (optionally one stylist); hairdresser: own items only.
function scope(session, staffFilter, params) {
  if (!session.isAdmin) {
    if (!session.staff) return 'false';
    params.push(session.staff.id);
    return `exists (select 1 from booking.appointment_items x where x.appointment_id = a.id and x.staff_id = $${params.length})`;
  }
  if (staffFilter) {
    params.push(Number(staffFilter));
    return `exists (select 1 from booking.appointment_items x where x.appointment_id = a.id and x.staff_id = $${params.length})`;
  }
  return 'true';
}

const APPT_COLUMNS = `
  a.id, a.reference, a.status, a.source, a.version, a.starts_at, a.ends_at,
  a.total_price_minor, a.price_is_estimate, a.currency, a.customer_message, a.no_email_reason,
  a.cancel_reason, a.created_at,
  c.first_name, c.last_name, c.phone, c.email,
  (select coalesce(json_agg(json_build_object(
            'seq', i.seq, 'name_de', i.name_de, 'name_en', i.name_en, 'staff_id', i.staff_id,
            'duration_min', i.duration_min, 'price_minor', i.price_minor, 'price_mode', i.price_mode)
          order by i.seq), '[]'::json)
     from booking.appointment_items i where i.appointment_id = a.id) as items,
  (select count(*)::int from booking.appointment_notes n where n.appointment_id = a.id) as notes_count,
  (select p.method from booking.payments p where p.appointment_id = a.id) as payment_method`;

export async function listAppointments(session, { from, to, staffId, includeCancelled }) {
  const params = [from, to];
  const where = [`a.starts_at < $2`, `a.ends_at > $1`, scope(session, staffId, params)];
  if (!includeCancelled) where.push(`a.status <> 'cancelled'`);
  const { rows } = await pool().query(`
    select ${APPT_COLUMNS}
      from booking.appointments a
      join booking.customers c on c.id = a.customer_id
     where ${where.join(' and ')}
     order by a.starts_at
     limit 2000`, params);
  return rows;
}

export async function getAppointment(session, id) {
  const params = [id];
  const { rows: [appt] } = await pool().query(`
    select ${APPT_COLUMNS}
      from booking.appointments a
      join booking.customers c on c.id = a.customer_id
     where a.id = $1 and ${scope(session, null, params)}`, params);
  if (!appt) throw new BookingError('not_found', 404);
  const [{ rows: notes }, { rows: events }] = await Promise.all([
    pool().query(`select id, author_name, author_staff_id, body, created_at from booking.appointment_notes
                   where appointment_id = $1 order by id`, [id]),
    pool().query(`select version, action, actor_kind, reason, created_at from booking.appointment_events
                   where appointment_id = $1 order by id desc limit 30`, [id]),
  ]);
  return { ...appt, notes, events };
}

// Allowed status transitions (appointment state table). Customers never mark
// themselves completed / no-show; corrections need owner/admin + reason.
const TRANSITIONS = {
  pending_approval: ['confirmed', 'cancelled'],
  confirmed: ['arrived', 'no_show', 'cancelled'],
  arrived: ['completed', 'cancelled'],
  completed: ['arrived'],
  no_show: ['confirmed'],
  cancelled: [],
};
const ADMIN_ONLY = new Set(['cancelled', 'confirmed']);
const CORRECTIONS = new Set(['completed>arrived', 'no_show>confirmed', 'arrived>cancelled']);

export async function changeStatus(session, id, { status, version, reason, notifyCustomer }) {
  if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, status)) throw new BookingError('invalid_input');
  const cleanReason = typeof reason === 'string' ? reason.trim().slice(0, 300) : '';

  return withTransaction(async (db) => {
    const params = [id];
    const { rows: [appt] } = await db.query(`
      select a.id, a.status, a.version, c.email
        from booking.appointments a join booking.customers c on c.id = a.customer_id
       where a.id = $1 and ${scope(session, null, params)}
       for update of a`, params);
    if (!appt) throw new BookingError('not_found', 404);
    if (Number(version) !== appt.version) throw new BookingError('stale_version', 409, { current: appt.version });
    if (!TRANSITIONS[appt.status].includes(status)) throw new BookingError('invalid_transition', 422, { from: appt.status, to: status });
    const key = `${appt.status}>${status}`;
    if ((ADMIN_ONLY.has(status) || CORRECTIONS.has(key)) && !session.isAdmin) throw new BookingError('forbidden', 403);
    if ((status === 'cancelled' || CORRECTIONS.has(key)) && !cleanReason) throw new BookingError('reason_required', 422);

    const next = appt.version + 1;
    if (status === 'cancelled') {
      await db.query(`
        update booking.appointments
           set status = 'cancelled', version = $2, cancelled_at = now(), cancelled_by = $3, cancel_reason = $4
         where id = $1`, [id, next, session.userId, cleanReason]);
      // Frees staff, chair and customer capacity (cancelled reserves nothing).
      await db.query(`update booking.allocations set active = false, released_at = now() where appointment_id = $1 and active`, [id]);
      await db.query(`update booking.notification_outbox set status = 'cancelled' where appointment_id = $1 and status = 'queued'`, [id]);
      if (notifyCustomer && appt.email) {
        await db.query(`
          insert into booking.notification_outbox (event_key, appointment_id, appointment_version, template, recipient)
          values ($1, $2, $3, 'booking_cancelled_by_salon', $4) on conflict (event_key) do nothing`,
          [`cancel:${id}:v${next}`, id, next, appt.email]);
      }
    } else {
      await db.query(`update booking.appointments set status = $2, version = $3 where id = $1`, [id, status, next]);
    }
    await db.query(`
      insert into booking.appointment_events (appointment_id, version, action, actor_user_id, actor_kind, reason, changes, notify_customer)
      values ($1, $2, $3, $4, 'staff', $5, $6, $7)`,
      [id, next, status === 'cancelled' ? 'cancelled' : 'status_changed', session.userId, cleanReason || null,
       JSON.stringify({ status: { from: appt.status, to: status } }), status === 'cancelled' ? Boolean(notifyCustomer) : null]);
    return { id, status, version: next };
  });
}

export async function addNote(session, id, body) {
  const text = typeof body === 'string' ? body.trim() : '';
  if (!text || text.length > 2000) throw new BookingError('invalid_input');
  const params = [id];
  const { rows: [appt] } = await pool().query(
    `select a.id from booking.appointments a where a.id = $1 and ${scope(session, null, params)}`, params);
  if (!appt) throw new BookingError('not_found', 404);
  const { rows: [note] } = await pool().query(`
    insert into booking.appointment_notes (appointment_id, author_user_id, author_staff_id, author_name, body)
    values ($1, $2, $3, $4, $5)
    returning id, author_name, author_staff_id, body, created_at`,
    [id, session.userId, session.staff?.id ?? null, session.displayName, text]);
  return note;
}

// Hard delete (owner/admin only): removes the appointment and, when the customer
// has no other appointments, the customer record too, so no personal data about
// this booking stays in the database. Items, notes, history, allocations and all
// queued/sent notification rows go with the appointment (ON DELETE CASCADE).
// Only non-personal facts are kept: an audit row and a deletion-ledger row.
export async function deleteAppointment(session, id) {
  if (!session.isAdmin) throw new BookingError('forbidden', 403);
  return withTransaction(async (db) => {
    const { rows: [appt] } = await db.query(
      `select id, reference, customer_id from booking.appointments where id = $1 for update`, [id]);
    if (!appt) throw new BookingError('not_found', 404);

    // The confirm response cached for idempotency mentions the booking reference.
    await db.query(`delete from booking.idempotency_keys where response->>'reference' = $1`, [appt.reference]);
    await db.query(`delete from booking.appointments where id = $1`, [id]);

    const { rows: [{ others }] } = await db.query(
      `select count(*)::int as others from booking.appointments where customer_id = $1`, [appt.customer_id]);
    let customerDeleted = false;
    if (others === 0) {
      await db.query(`delete from booking.allocations where customer_id = $1`, [appt.customer_id]);
      await db.query(`update booking.customers set merged_into = null where merged_into = $1`, [appt.customer_id]);
      await db.query(`delete from booking.customers where id = $1`, [appt.customer_id]);
      await db.query(
        `insert into booking.deletion_ledger (subject_kind, subject_id, action) values ('customer', $1, 'deleted')`,
        [String(appt.customer_id)]);
      customerDeleted = true;
    }
    await db.query(
      `insert into booking.audit_events (actor_user_id, action, entity, entity_id) values ($1, 'appointment.deleted', 'appointment', $2)`,
      [session.userId, id]);
    return { id, deleted: true, customerDeleted };
  });
}
