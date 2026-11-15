// Payments recorded after a visit + the owner's customer history.
// Visibility is enforced here in SQL; the UI only hides buttons.
import { pool, withTransaction } from '../db';
import { BookingError } from './engine';

export const PAYMENT_METHODS = ['cash', 'card', 'voucher', 'other'];

// owner/admin: any appointment; hairdresser: only appointments with their item.
function canSee(session, params) {
  if (session.isAdmin) return 'true';
  if (!session.staff) return 'false';
  params.push(session.staff.id);
  return `exists (select 1 from booking.appointment_items x where x.appointment_id = a.id and x.staff_id = $${params.length})`;
}

export async function getPayment(session, appointmentId) {
  const params = [appointmentId];
  const { rows: [row] } = await pool().query(`
    select p.method, p.amount_minor, p.currency, p.recorded_by_name, p.recorded_at, p.updated_at
      from booking.appointments a
      left join booking.payments p on p.appointment_id = a.id
     where a.id = $1 and ${canSee(session, params)}`, params);
  if (!row) throw new BookingError('not_found', 404);
  return row.method ? row : null;
}

// Stylist records method + amount once the customer has left the chair.
// An "arrived" appointment becomes "completed" in the same transaction.
export async function recordPayment(session, appointmentId, { method, amount_minor }) {
  const amount = Number(amount_minor);
  if (!PAYMENT_METHODS.includes(method) || !Number.isInteger(amount) || amount < 0 || amount > 10000000) {
    throw new BookingError('invalid_input');
  }
  return withTransaction(async (db) => {
    const params = [appointmentId];
    const { rows: [appt] } = await db.query(`
      select a.id, a.status, a.version from booking.appointments a
       where a.id = $1 and ${canSee(session, params)}
       for update of a`, params);
    if (!appt) throw new BookingError('not_found', 404);
    if (!['arrived', 'completed'].includes(appt.status)) throw new BookingError('not_ready_for_payment', 422, { status: appt.status });

    const { rows: [prev] } = await db.query(`select method, amount_minor from booking.payments where appointment_id = $1`, [appointmentId]);
    await db.query(`
      insert into booking.payments (appointment_id, method, amount_minor, recorded_by_user, recorded_by_staff, recorded_by_name)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (appointment_id) do update
         set method = excluded.method, amount_minor = excluded.amount_minor,
             recorded_by_user = excluded.recorded_by_user, recorded_by_staff = excluded.recorded_by_staff,
             recorded_by_name = excluded.recorded_by_name, updated_at = now()`,
      [appointmentId, method, amount, session.userId, session.staff?.id ?? null, session.displayName]);

    let { status, version } = appt;
    if (status === 'arrived') {
      status = 'completed'; version += 1;
      await db.query(`update booking.appointments set status = 'completed', version = $2 where id = $1`, [appointmentId, version]);
    }
    await db.query(`
      insert into booking.appointment_events (appointment_id, version, action, actor_user_id, actor_kind, changes)
      values ($1, $2, 'payment_recorded', $3, 'staff', $4)`,
      [appointmentId, version, session.userId, JSON.stringify({
        payment: { from: prev || null, to: { method, amount_minor: amount } },
        ...(appt.status !== status ? { status: { from: appt.status, to: status } } : {}),
      })]);
    return { status, version, payment: { method, amount_minor: amount, recorded_by_name: session.displayName } };
  });
}

function requireAdmin(session) {
  if (!session.isAdmin) throw new BookingError('forbidden', 403);
}

// One row per customer, most recent visit first.
export async function listCustomers(session, { q = '', limit = 100 } = {}) {
  requireAdmin(session);
  const params = [];
  let filter = '';
  const term = String(q).trim().slice(0, 80);
  if (term) {
    params.push(`%${term.toLowerCase()}%`);
    filter = `and (lower(c.first_name || ' ' || c.last_name) like $1 or lower(coalesce(c.email, '')) like $1 or coalesce(c.phone, '') like $1)`;
  }
  params.push(Math.min(Math.max(Number(limit) || 100, 1), 300));
  const { rows } = await pool().query(`
    select c.id, c.first_name, c.last_name, c.email, c.phone,
           count(a.id) filter (where a.status <> 'cancelled')::int  as visits,
           count(p.appointment_id)::int                             as paid_visits,
           coalesce(sum(p.amount_minor), 0)::int                    as total_paid_minor,
           max(a.starts_at)                                         as last_at,
           (select json_build_object('starts_at', la.starts_at, 'status', la.status, 'staff', st.display_name,
                                     'method', lp.method, 'amount_minor', lp.amount_minor)
              from booking.appointments la
              left join booking.payments lp on lp.appointment_id = la.id
              left join lateral (select s.display_name from booking.appointment_items i
                                   join booking.staff s on s.id = i.staff_id
                                  where i.appointment_id = la.id order by i.seq limit 1) st on true
             where la.customer_id = c.id
             order by la.starts_at desc limit 1)                    as last_visit
      from booking.customers c
      join booking.appointments a on a.customer_id = c.id
      left join booking.payments p on p.appointment_id = a.id
     where c.merged_into is null ${filter}
     group by c.id
     order by max(a.starts_at) desc
     limit $${params.length}`, params);
  return rows;
}

export async function getCustomerHistory(session, customerId) {
  requireAdmin(session);
  const { rows: [customer] } = await pool().query(`
    select id, first_name, last_name, email, phone, preferred_lang, created_at
      from booking.customers where id = $1`, [customerId]);
  if (!customer) throw new BookingError('not_found', 404);
  const { rows: visits } = await pool().query(`
    select a.id, a.reference, a.status, a.source, a.starts_at, a.ends_at,
           a.total_price_minor, a.price_is_estimate, a.cancel_reason,
           (select coalesce(json_agg(json_build_object(
                     'name_de', i.name_de, 'name_en', i.name_en, 'duration_min', i.duration_min,
                     'staff_id', i.staff_id, 'staff', s.display_name) order by i.seq), '[]'::json)
              from booking.appointment_items i left join booking.staff s on s.id = i.staff_id
             where i.appointment_id = a.id) as items,
           case when p.appointment_id is null then null else json_build_object(
             'method', p.method, 'amount_minor', p.amount_minor, 'recorded_by_name', p.recorded_by_name,
             'recorded_at', p.recorded_at) end as payment,
           (select count(*)::int from booking.appointment_notes n where n.appointment_id = a.id) as notes_count
      from booking.appointments a
      left join booking.payments p on p.appointment_id = a.id
     where a.customer_id = $1
     order by a.starts_at desc`, [customerId]);
  return { customer, visits };
}

// Permanently removes customers and everything about their visits (items,
// notes, payments, events, outbox rows cascade). Refuses customers with an
// upcoming active booking, so nobody is silently dropped from the calendar.
export async function deleteCustomers(session, ids) {
  requireAdmin(session);
  const list = [...new Set((Array.isArray(ids) ? ids : []).filter(id => /^[0-9a-f-]{36}$/i.test(String(id))))];
  if (!list.length || list.length > 200) throw new BookingError('invalid_input');
  return withTransaction(async (db) => {
    const { rows: upcoming } = await db.query(`
      select distinct c.id, c.first_name, c.last_name
        from booking.customers c join booking.appointments a on a.customer_id = c.id
       where c.id = any($1::uuid[]) and a.starts_at > now()
         and a.status in ('pending_approval', 'confirmed', 'arrived')`, [list]);
    if (upcoming.length) {
      throw new BookingError('has_upcoming', 409, { customers: upcoming.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}` })) });
    }
    const { rows: found } = await db.query(`select id from booking.customers where id = any($1::uuid[]) for update`, [list]);
    const ids2 = found.map(r => r.id);
    if (!ids2.length) return { deleted: 0, appointments: 0 };

    await db.query(`
      delete from booking.idempotency_keys
       where response->>'reference' in (select reference from booking.appointments where customer_id = any($1::uuid[]))`, [ids2]);
    const { rowCount: appts } = await db.query(`delete from booking.appointments where customer_id = any($1::uuid[])`, [ids2]);
    await db.query(`delete from booking.allocations where customer_id = any($1::uuid[])`, [ids2]);
    await db.query(`update booking.customers set merged_into = null where merged_into = any($1::uuid[])`, [ids2]);
    await db.query(`delete from booking.customers where id = any($1::uuid[])`, [ids2]);
    await db.query(`
      insert into booking.deletion_ledger (subject_kind, subject_id, action)
      select 'customer', x::text, 'deleted' from unnest($1::uuid[]) x`, [ids2]);
    await db.query(`
      insert into booking.audit_events (actor_user_id, action, entity, entity_id)
      select $1, 'customer.deleted', 'customer', x::text from unnest($2::uuid[]) x`, [session.userId, ids2]);
    return { deleted: ids2.length, appointments: appts };
  });
}
