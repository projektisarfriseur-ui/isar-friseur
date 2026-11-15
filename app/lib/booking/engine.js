// Scheduling engine: catalogue + day context loaders and the pure slot planner.
// The planner suggests; the database exclusion constraints decide (SCH-06).
import { zonedToUtc, localParts, hhmmToMinutes, addDays, todayIn, MINUTE } from './time.js';

export class BookingError extends Error {
  constructor(code, status = 400, detail) {
    super(code);
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

// ------------------------------------------------------------------ loaders
export async function loadSettings(db) {
  const { rows } = await db.query('select * from booking.salon_settings where id = 1');
  if (!rows[0]) throw new BookingError('salon_not_configured', 500);
  return rows[0];
}

export async function loadCatalog(db) {
  const { rows: services } = await db.query(`
    select s.id, s.slug, s.name_de, s.name_en, s.price_mode, s.price_minor, s.currency,
           s.prerequisite, s.sort_order, c.key as category_key, c.sort_order as category_sort
      from booking.services s
      join booking.service_categories c on c.id = s.category_id
     where s.archived_at is null and s.visible and s.online_bookable
       and c.archived_at is null and c.visible
     order by c.sort_order, s.sort_order, s.id`);
  const { rows: phases } = await db.query(`
    select service_id, seq, kind, duration_min, needs_staff, customer_present, resource_group_id
      from booking.service_phases
     where variant_id is null
     order by service_id, seq`);
  const byId = new Map();
  for (const s of services) byId.set(Number(s.id), { ...s, id: Number(s.id), phases: [] });
  for (const p of phases) byId.get(Number(p.service_id))?.phases.push(p);
  for (const s of byId.values()) {
    s.visible_minutes = s.phases.filter(p => p.customer_present).reduce((a, p) => a + p.duration_min, 0);
  }
  return { list: [...byId.values()], byId };
}

export async function eligibleStaff(db, serviceIds) {
  const { rows } = await db.query(`
    select s.id, s.display_name, s.slug, s.sort_order
      from booking.staff s
     where s.bookable and s.archived_at is null
       and not exists (
         select 1 from unnest($1::bigint[]) as want(service_id)
          where not exists (select 1 from booking.staff_services ss
                             where ss.staff_id = s.id and ss.service_id = want.service_id))
     order by s.sort_order, s.id`, [serviceIds]);
  return rows.map(r => ({ ...r, id: Number(r.id) }));
}

const toMs = (v) => (v instanceof Date ? v.getTime() : new Date(v).getTime());

// Everything the planner needs about one local day, as UTC-ms intervals.
export async function loadDay(db, date, settings) {
  const tz = settings.timezone;
  const dayStart = zonedToUtc(date, 0, tz);
  const dayEnd = zonedToUtc(addDays(date, 1), 0, tz);
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const range = [new Date(dayStart).toISOString(), new Date(dayEnd).toISOString()];

  const [rules, exceptions, allocations, resources] = await Promise.all([
    db.query(`
      select staff_id, start_local::text as s, end_local::text as e
        from booking.working_rules
       where weekday = $1
         and (valid_from is null or valid_from <= $2::date)
         and (valid_to   is null or valid_to   >= $2::date)`, [weekday, date]),
    db.query(`
      select staff_id, kind, lower(during) as s, upper(during) as e
        from booking.schedule_exceptions
       where during && tstzrange($1::timestamptz, $2::timestamptz)`, range),
    db.query(`
      select kind, staff_id, resource_id, lower(during) as s, upper(during) as e
        from booking.allocations
       where active and kind in ('staff', 'resource')
         and during && tstzrange($1::timestamptz, $2::timestamptz)`, range),
    db.query(`
      select id, group_id from booking.resources where active order by sort_order, id`),
  ]);

  const toInterval = (s, e) => {
    const a = zonedToUtc(date, hhmmToMinutes(s), tz);
    const b = zonedToUtc(date, hhmmToMinutes(e), tz);
    return a != null && b != null && a < b ? [a, b] : null;
  };

  const salonOpen = [];
  const shifts = new Map();
  for (const r of rules.rows) {
    const iv = toInterval(r.s, r.e);
    if (!iv) continue;
    if (r.staff_id == null) salonOpen.push(iv);
    else push(shifts, Number(r.staff_id), iv);
  }

  const salonBusy = [];
  const busyStaff = new Map();
  for (const x of exceptions.rows) {
    const iv = [toMs(x.s), toMs(x.e)];
    if (x.kind === 'extra_hours') {
      if (x.staff_id == null) salonOpen.push(iv); else push(shifts, Number(x.staff_id), iv);
    } else if (x.staff_id == null) {
      salonBusy.push(iv);
    } else {
      push(busyStaff, Number(x.staff_id), iv);
    }
  }

  const busyResource = new Map();
  const bookedMinutes = new Map();
  for (const a of allocations.rows) {
    const iv = [toMs(a.s), toMs(a.e)];
    if (a.kind === 'staff') {
      const id = Number(a.staff_id);
      push(busyStaff, id, iv);
      bookedMinutes.set(id, (bookedMinutes.get(id) || 0) + (iv[1] - iv[0]) / MINUTE);
    } else {
      push(busyResource, Number(a.resource_id), iv);
    }
  }

  const resourcesByGroup = new Map();
  for (const r of resources.rows) push(resourcesByGroup, Number(r.group_id), Number(r.id));

  salonOpen.sort((a, b) => a[0] - b[0]);
  return { date, tz, dayStart, dayEnd, salonOpen, salonBusy, shifts, busyStaff, busyResource, resourcesByGroup, bookedMinutes };
}

function push(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

// ------------------------------------------------------------------ itinerary
// Concatenates the services' phases in the order chosen. Offsets in minutes
// from the start of the first phase.
export function buildItinerary(serviceIds, catalog) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0 || serviceIds.length > 6) {
    throw new BookingError('invalid_services');
  }
  if (new Set(serviceIds).size !== serviceIds.length) throw new BookingError('invalid_services');

  const phases = [];
  const services = [];
  let offset = 0;
  for (const id of serviceIds) {
    const svc = catalog.byId.get(Number(id));
    if (!svc || svc.phases.length === 0) throw new BookingError('invalid_services');
    if (svc.price_mode === 'consultation' || svc.prerequisite) {
      throw new BookingError('prerequisite_required', 422, { serviceId: svc.id });
    }
    const svcPhases = [];
    for (const p of svc.phases) {
      const ph = {
        serviceId: svc.id, offset, dur: p.duration_min, kind: p.kind,
        needsStaff: p.needs_staff, present: p.customer_present,
        groupId: p.resource_group_id != null ? Number(p.resource_group_id) : null,
      };
      phases.push(ph);
      svcPhases.push(ph);
      offset += p.duration_min;
    }
    services.push({ svc, phases: svcPhases });
  }
  const present = phases.filter(p => p.present);
  const visibleStart = Math.min(...present.map(p => p.offset));
  const visibleEnd = Math.max(...present.map(p => p.offset + p.dur));
  return { phases, services, total: offset, visibleStart, visibleEnd, visibleMinutes: visibleEnd - visibleStart };
}

// ------------------------------------------------------------------ planner
const within = (ivs, s, e) => (ivs || []).some(([a, b]) => a <= s && e <= b);
const overlaps = (ivs, s, e) => (ivs || []).some(([a, b]) => a < e && s < b);

// Concrete allocation plan for an itinerary whose customer-visible start is
// `anchorMs`, performed by `staffId`. Returns null when anything doesn't fit.
export function planAt(day, itin, anchorMs, staffId) {
  const abs = itin.phases.map(p => {
    const s = anchorMs + (p.offset - itin.visibleStart) * MINUTE;
    return { ...p, s, e: s + p.dur * MINUTE };
  });

  // The client is in the salon only while it's open.
  for (const p of abs) {
    if (!p.present) continue;
    if (!within(day.salonOpen, p.s, p.e) || overlaps(day.salonBusy, p.s, p.e)) return null;
  }

  // Stylist time, merging back-to-back hands-on phases into one block.
  const staffBlocks = [];
  for (const p of abs.filter(x => x.needsStaff)) {
    const last = staffBlocks[staffBlocks.length - 1];
    if (last && last.e === p.s) { last.e = p.e; last.kind = last.kind === p.kind ? p.kind : 'hands_on'; }
    else staffBlocks.push({ s: p.s, e: p.e, kind: p.kind });
  }
  const shift = day.shifts.get(staffId);
  const busy = day.busyStaff.get(staffId);
  for (const b of staffBlocks) {
    if (!within(shift, b.s, b.e) || overlaps(busy, b.s, b.e) || overlaps(day.salonBusy, b.s, b.e)) return null;
  }

  // One physical unit per resource group, held across all phases that need it (SCH-04).
  const spans = new Map();
  for (const p of abs) {
    if (p.groupId == null) continue;
    const cur = spans.get(p.groupId);
    spans.set(p.groupId, cur ? [Math.min(cur[0], p.s), Math.max(cur[1], p.e)] : [p.s, p.e]);
  }
  const resourceBlocks = [];
  for (const [groupId, [s, e]] of spans) {
    const unit = (day.resourcesByGroup.get(groupId) || []).find(id => !overlaps(day.busyResource.get(id), s, e));
    if (unit == null) return null;
    resourceBlocks.push({ resourceId: unit, s, e });
  }

  const visible = [anchorMs, anchorMs + itin.visibleMinutes * MINUTE];
  return { staffId, staffBlocks, resourceBlocks, visible, phases: abs };
}

// Bookable start times for one day. "Any professional" picks, per slot, the
// least-booked eligible stylist (ties by sort order) so the choice is predictable (SCH-19).
export function findSlots(day, itin, settings, staff, nowMs = Date.now()) {
  const tz = settings.timezone;
  const today = todayIn(tz, nowMs);
  if (day.date < today || day.date > addDays(today, settings.booking_horizon_days)) return [];
  const earliest = nowMs + settings.min_notice_minutes * MINUTE;
  const step = settings.slot_interval_minutes * MINUTE;

  const ordered = [...staff].sort((a, b) =>
    (day.bookedMinutes.get(a.id) || 0) - (day.bookedMinutes.get(b.id) || 0) || a.sort_order - b.sort_order || a.id - b.id);

  const slots = [];
  const seen = new Set();
  for (const [openS, openE] of day.salonOpen) {
    for (let t = openS; t + itin.visibleMinutes * MINUTE <= openE; t += step) {
      if (t < earliest || seen.has(t)) continue;
      for (const st of ordered) {
        const plan = planAt(day, itin, t, st.id);
        if (plan) {
          seen.add(t);
          slots.push({ time: localParts(t, tz).hhmm, startMs: t, staffId: st.id });
          break;
        }
      }
    }
  }
  return slots.sort((a, b) => a.startMs - b.startMs);
}
