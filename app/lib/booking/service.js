// Booking mutations: holds (SCH-07/08) and atomic confirmation (SCH-12/13).
import { createHash } from 'node:crypto';
import { withTransaction, PG } from '../db';
import { BookingError, loadSettings, loadCatalog, eligibleStaff, loadDay, buildItinerary, planAt } from './engine';
import { zonedToUtc, hhmmToMinutes, isValidDateStr, todayIn, addDays, localParts, MINUTE } from './time';

const iso = (ms) => new Date(ms).toISOString();
const range = (s, e) => `[${iso(s)},${iso(e)})`;

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function mapPgError(err) {
  if (err instanceof BookingError) return err;
  if (err?.code === PG.EXCLUSION_VIOLATION) return new BookingError('slot_unavailable', 409);
  return err;
}

// ------------------------------------------------------------------ holds
export async function createHold({ date, time, serviceIds, staffId, sessionDigest, ip }) {
  if (!isValidDateStr(date) || !/^\d{2}:\d{2}$/.test(time || '')) throw new BookingError('invalid_input');
  const ids = (serviceIds || []).map(Number);

  try {
    return await withTransaction(async (db) => {
      await db.query('select booking.expire_holds()');
      // A session holds one slot at a time; picking another time releases the old one.
      await db.query(`
        with released as (
          update booking.holds set status = 'released'
           where guest_session = $1 and status = 'active' returning id)
        update booking.allocations a set active = false, released_at = now()
          from released r where a.hold_id = r.id and a.active`, [sessionDigest]);

      const { rows: [{ n }] } = await db.query(
        `select count(*)::int n from booking.holds where guest_session = $1 and created_at > now() - interval '1 hour'`,
        [sessionDigest]);
      if (n >= 30) throw new BookingError('too_many_holds', 429);

      const settings = await loadSettings(db);
      const catalog = await loadCatalog(db);
      const itin = buildItinerary(ids, catalog);
      const tz = settings.timezone;

      const anchor = zonedToUtc(date, hhmmToMinutes(time), tz);
      if (anchor == null) throw new BookingError('invalid_time');
      const now = Date.now();
      if (anchor < now + settings.min_notice_minutes * MINUTE) throw new BookingError('policy_min_notice', 422);
      if (date > addDays(todayIn(tz, now), settings.booking_horizon_days)) throw new BookingError('policy_horizon', 422);

      let candidates = await eligibleStaff(db, ids);
      if (staffId && staffId !== 'any') {
        candidates = candidates.filter(s => s.id === Number(staffId));
        if (!candidates.length) throw new BookingError('staff_not_eligible', 422);
      }
      const day = await loadDay(db, date, settings);
      candidates.sort((a, b) =>
        (day.bookedMinutes.get(a.id) || 0) - (day.bookedMinutes.get(b.id) || 0) || a.sort_order - b.sort_order);

      let plan = null;
      for (const st of candidates) { plan = planAt(day, itin, anchor, st.id); if (plan) break; }
      if (!plan) throw new BookingError('slot_unavailable', 409);

      const { rows: [hold] } = await db.query(`
        insert into booking.holds (guest_session, expires_at, itinerary, created_ip)
        values ($1, now() + make_interval(mins => $2), $3, $4)
        returning id, expires_at`,
        [sessionDigest, settings.hold_minutes,
         JSON.stringify({ date, time, serviceIds: ids, staffId: plan.staffId, anchor: iso(anchor) }),
         ip || null]);

      for (const b of plan.staffBlocks) {
        await db.query(
          `insert into booking.allocations (hold_id, kind, staff_id, phase_kind, during) values ($1, 'staff', $2, $3, $4::tstzrange)`,
          [hold.id, plan.staffId, b.kind, range(b.s, b.e)]);
      }
      for (const r of plan.resourceBlocks) {
        await db.query(
          `insert into booking.allocations (hold_id, kind, resource_id, phase_kind, during) values ($1, 'resource', $2, 'visit', $3::tstzrange)`,
          [hold.id, r.resourceId, range(r.s, r.e)]);
      }

      const staff = candidates.find(s => s.id === plan.staffId);
      return {
        holdId: hold.id,
        expiresAt: hold.expires_at,
        staff: { id: staff.id, name: staff.display_name },
        start: iso(plan.visible[0]),
        end: iso(plan.visible[1]),
      };
    });
  } catch (err) {
    throw mapPgError(err);
  }
}

export async function releaseHold(holdId, sessionDigest) {
  await withTransaction(async (db) => {
    await db.query(`
      with released as (
        update booking.holds set status = 'released'
         where id = $1 and guest_session = $2 and status = 'active' returning id)
      update booking.allocations a set active = false, released_at = now()
        from released r where a.hold_id = r.id and a.active`, [holdId, sessionDigest]);
  });
}

// ------------------------------------------------------------------ confirm
const clean = (v, max) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : null;
};

export async function confirmHold({ holdId, sessionDigest, idempotencyKey, customer, lang }) {
  const first = clean(customer?.first_name, 80);
  const last = clean(customer?.last_name, 80);
  const email = clean(customer?.email, 200)?.toLowerCase() || null;
  const phone = clean(customer?.phone, 32);
  const message = clean(customer?.message, 500);
  if (!first || !last) throw new BookingError('invalid_input', 400, { field: 'name' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BookingError('invalid_input', 400, { field: 'email' });
  if (!idempotencyKey || idempotencyKey.length > 100) throw new BookingError('idempotency_key_required');
  const language = lang === 'en' ? 'en' : 'de';
  const requestHash = sha256(JSON.stringify({ holdId, first, last, email, phone, message, language }));

  try {
    return await withTransaction(async (db) => {
      // Idempotency (SCH-13): the same key + payload returns the first outcome.
      const ins = await db.query(`
        insert into booking.idempotency_keys (key, scope, actor, request_hash)
        values ($1, 'confirm_hold', $2, $3) on conflict do nothing returning key`,
        [idempotencyKey, sessionDigest, requestHash]);
      if (!ins.rowCount) {
        const { rows: [prev] } = await db.query(
          `select request_hash, status, response from booking.idempotency_keys
            where key = $1 and scope = 'confirm_hold' and actor = $2`, [idempotencyKey, sessionDigest]);
        if (prev.request_hash !== requestHash) throw new BookingError('idempotency_key_reused', 422);
        if (prev.status === 'succeeded') return prev.response;
        throw new BookingError('request_in_progress', 409);
      }

      const { rows: [hold] } = await db.query(
        `select * from booking.holds where id = $1 and guest_session = $2 for update`, [holdId, sessionDigest]);
      if (!hold) throw new BookingError('hold_not_found', 404);
      if (hold.status !== 'active' || new Date(hold.expires_at).getTime() <= Date.now()) {
        throw new BookingError('hold_expired', 410);
      }

      const it = hold.itinerary;
      const settings = await loadSettings(db);
      const catalog = await loadCatalog(db);
      const itin = buildItinerary(it.serviceIds, catalog);
      const anchor = new Date(it.anchor).getTime();
      const startsAt = anchor;
      const endsAt = anchor + itin.visibleMinutes * MINUTE;

      const { rows: [staff] } = await db.query(
        `select id, display_name from booking.staff where id = $1`, [it.staffId]);
      const { rows: overrides } = await db.query(
        `select service_id, price_minor from booking.staff_services where staff_id = $1 and service_id = any($2::bigint[])`,
        [it.staffId, it.serviceIds]);
      const priceOverride = new Map(overrides.filter(o => o.price_minor != null).map(o => [Number(o.service_id), o.price_minor]));

      let total = 0;
      let estimate = false;
      for (const { svc } of itin.services) {
        total += priceOverride.get(svc.id) ?? svc.price_minor ?? 0;
        if (svc.price_mode !== 'exact') estimate = true;
      }

      const { rows: [cust] } = await db.query(`
        insert into booking.customers (first_name, last_name, email, phone, preferred_lang)
        values ($1, $2, $3, $4, $5) returning id`, [first, last, email, phone, language]);

      const policy = {
        version: settings.policy_version,
        cancel_window_minutes: settings.cancel_window_minutes,
        cancel_policy_de: settings.cancel_policy_de,
        cancel_policy_en: settings.cancel_policy_en,
      };
      const status = settings.auto_confirm ? 'confirmed' : 'pending_approval';
      const { rows: [appt] } = await db.query(`
        insert into booking.appointments
          (customer_id, status, source, starts_at, ends_at, cancel_deadline, pending_expires_at,
           policy_snapshot, total_price_minor, price_is_estimate, currency, customer_message)
        values ($1, $2, 'online', $3, $4, $5, $6, $7, $8, $9, $10, $11)
        returning id, reference, version`,
        [cust.id, status, iso(startsAt), iso(endsAt),
         iso(startsAt - settings.cancel_window_minutes * MINUTE),
         status === 'pending_approval' ? iso(Date.now() + 24 * 60 * MINUTE) : null,
         JSON.stringify(policy), total, estimate, settings.currency, message]);

      let seq = 1;
      for (const { svc, phases } of itin.services) {
        await db.query(`
          insert into booking.appointment_items
            (appointment_id, seq, service_id, staff_id, name_de, name_en, price_mode, price_minor, duration_min, phases_snapshot)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [appt.id, seq++, svc.id, it.staffId, svc.name_de, svc.name_en, svc.price_mode,
           priceOverride.get(svc.id) ?? svc.price_minor, svc.visible_minutes,
           JSON.stringify(phases.map(p => ({ kind: p.kind, minutes: p.dur, needs_staff: p.needsStaff, customer_present: p.present })))]);
      }

      // Move the held capacity onto the appointment inside this transaction (SCH-12).
      await db.query(`
        with moved as (
          update booking.allocations set active = false, released_at = now()
           where hold_id = $1 and active
          returning kind, staff_id, resource_id, phase_kind, during)
        insert into booking.allocations (appointment_id, kind, staff_id, resource_id, phase_kind, during)
        select $2, kind, staff_id, resource_id, phase_kind, during from moved`, [hold.id, appt.id]);
      await db.query(`
        insert into booking.allocations (appointment_id, kind, customer_id, phase_kind, during)
        values ($1, 'customer', $2, 'visit', $3::tstzrange)`, [appt.id, cust.id, range(startsAt, endsAt)]);
      await db.query(`update booking.holds set status = 'converted' where id = $1`, [hold.id]);

      await db.query(`
        insert into booking.appointment_events (appointment_id, version, action, actor_kind, changes)
        values ($1, 1, 'created', 'guest', $2)`,
        [appt.id, JSON.stringify({ source: 'online', staff_id: it.staffId, starts_at: iso(startsAt) })]);
      // Delivery is picked up by the notification worker (MSG-02); queued != sent.
      await db.query(`
        insert into booking.notification_outbox (event_key, appointment_id, appointment_version, template, recipient)
        values ($1, $2, 1, 'booking_confirmed', $3)`, [`confirm:${appt.id}:v1`, appt.id, email]);

      const local = localParts(startsAt, settings.timezone);
      const response = {
        reference: appt.reference,
        status,
        start: iso(startsAt),
        end: iso(endsAt),
        localDate: local.date,
        localTime: local.hhmm,
        timezone: settings.timezone,
        staff: { id: Number(staff.id), name: staff.display_name },
        totalPriceMinor: total,
        priceIsEstimate: estimate,
        currency: settings.currency,
      };
      await db.query(`
        update booking.idempotency_keys set status = 'succeeded', response = $3
         where key = $1 and scope = 'confirm_hold' and actor = $2`,
        [idempotencyKey, sessionDigest, JSON.stringify(response)]);
      return response;
    });
  } catch (err) {
    throw mapPgError(err);
  }
}
