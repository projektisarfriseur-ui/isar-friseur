// Database-level booking integrity tests (AT-09, AT-10, AT-12, AT-13, AT-14 at the
// constraint layer). Uses fictional holds tagged guest_session 'itest:*' and
// removes them afterwards.
// Usage: node --env-file=.env.local scripts/test-booking-integrity.mjs
import { connect } from './pg-connect.mjs';

const TAG = `itest:${Date.now()}`;
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const admin = await connect();
// A day far in the future so real bookings never collide with the test.
const DAY = '2099-03-10';
const at = (hhmm) => `${DAY} ${hhmm}:00+01`;
const range = (a, b) => `[${at(a)},${at(b)})`;

const { rows: [{ staff_a, staff_b }] } = await admin.query(
  `select min(id) staff_a, max(id) staff_b from booking.staff`);
const { rows: chairs } = await admin.query(
  `select r.id from booking.resources r join booking.resource_groups g on g.id = r.group_id where g.key = 'chair' order by r.id limit 2`);
const [chair1, chair2] = chairs.map(r => r.id);

async function newHold(client, label) {
  const { rows } = await client.query(
    `insert into booking.holds (guest_session, expires_at, itinerary) values ($1, now() + interval '5 minutes', '{}') returning id`,
    [`${TAG}:${label}`]);
  return rows[0].id;
}
async function alloc(client, holdId, kind, id, during) {
  const col = { staff: 'staff_id', resource: 'resource_id' }[kind];
  await client.query(
    `insert into booking.allocations (hold_id, kind, ${col}, during) values ($1, $2, $3, $4::tstzrange)`,
    [holdId, kind, id, during]);
}
async function tryAlloc(label, parts) {
  const c = await connect();
  try {
    await c.query('begin');
    const h = await newHold(c, label);
    for (const [kind, id, during] of parts) await alloc(c, h, kind, id, during);
    await c.query('commit');
    return { ok: true };
  } catch (e) {
    await c.query('rollback').catch(() => {});
    return { ok: false, code: e.code, constraint: e.constraint };
  } finally {
    await c.end();
  }
}

try {
  // AT-09: many concurrent attempts at one last slot -> exactly one wins.
  const N = 8;
  const race = await Promise.all(Array.from({ length: N }, (_, i) =>
    tryAlloc(`race${i}`, [['staff', staff_a, range('10:00', '11:00')]])));
  const winners = race.filter(r => r.ok).length;
  const losersAreExclusion = race.filter(r => !r.ok).every(r => r.code === '23P01');
  check('AT-09 concurrent last-slot race has exactly one winner', winners === 1 && losersAreExclusion,
    `${winners}/${N} succeeded, losers=${race.filter(r => !r.ok).map(r => r.code).join(',')}`);

  // SCH-10: adjacent half-open intervals are allowed.
  const adj = await tryAlloc('adjacent', [['staff', staff_a, range('11:00', '12:00')]]);
  check('SCH-10 adjacent [11:00,12:00) after [10:00,11:00) allowed', adj.ok);

  // AT-12: one basin/chair can't be shared even with different stylists.
  const r1 = await tryAlloc('chair-a', [['staff', staff_a, range('13:00', '14:00')], ['resource', chair1, range('13:00', '14:00')]]);
  const r2 = await tryAlloc('chair-b', [['staff', staff_b, range('13:30', '14:30')], ['resource', chair1, range('13:30', '14:30')]]);
  check('AT-12 shared resource conflict across different staff', r1.ok && !r2.ok && r2.constraint === 'no_resource_overlap',
    `second=${r2.constraint}`);
  // ... and the whole multi-allocation set rolls back together (no orphan staff row for staff_b).
  const { rows: [{ n: orphan }] } = await admin.query(
    `select count(*)::int n from booking.allocations a join booking.holds h on h.id = a.hold_id
      where h.guest_session = $1`, [`${TAG}:chair-b`]);
  check('SCH-12 failed allocation set leaves nothing behind', orphan === 0);

  // AT-13/14: colour visit 15:00 — application 15:00-15:30, processing (stylist free)
  // 15:30-16:05, finish 16:05-16:30, cleanup 16:30-16:40. Chair held throughout.
  const colour = await tryAlloc('colour', [
    ['staff', staff_b, range('15:00', '15:30')],
    ['staff', staff_b, range('16:05', '16:40')],
    ['resource', chair2, range('15:00', '16:40')],
  ]);
  const fitsGap = await tryAlloc('in-gap', [['staff', staff_b, range('15:30', '16:05')], ['resource', chair1, range('15:30', '16:05')]]);
  const overlapsReturn = await tryAlloc('over-return', [['staff', staff_b, range('15:30', '16:10')]]);
  const overlapsCleanup = await tryAlloc('over-cleanup', [['resource', chair2, range('16:35', '17:00')]]);
  check('AT-13 service fits inside released processing time', colour.ok && fitsGap.ok);
  check('AT-13 cannot overlap the stylist return phase', !overlapsReturn.ok && overlapsReturn.constraint === 'no_staff_overlap');
  check('AT-14 cleanup buffer keeps chair occupied', !overlapsCleanup.ok && overlapsCleanup.constraint === 'no_resource_overlap');

  // AT-10 / SCH-11: an expired hold releases its capacity transactionally.
  await admin.query(`update booking.holds set expires_at = now() - interval '1 second' where guest_session = $1`, [`${TAG}:adjacent`]);
  const released = await admin.query(`select booking.expire_holds() n`);
  const reuse = await tryAlloc('after-expiry', [['staff', staff_a, range('11:00', '12:00')]]);
  check('AT-10 expired hold frees the slot', released.rows[0].n >= 1 && reuse.ok, `released=${released.rows[0].n}`);

  // Bad intervals are rejected (closed upper bound).
  const closed = await tryAlloc('closed', [['staff', staff_a, `[${at('18:00')},${at('18:30')}]`]]);
  check('SCH-10 closed-bound ranges rejected', !closed.ok);

  // Public REST with the anon key must not expose data.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (base && anon) {
    const res = await fetch(`${base}/rest/v1/bookings?select=*`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
    const body = await res.text();
    const leaked = res.ok && body.trim() !== '[]';
    check('anon REST cannot read legacy bookings', !leaked, `HTTP ${res.status}`);
    const res2 = await fetch(`${base}/rest/v1/services?select=id`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
    check('anon REST cannot read legacy services', !(res2.ok && (await res2.text()).trim() !== '[]'), `HTTP ${res2.status}`);
  }
} finally {
  await admin.query(`delete from booking.holds where guest_session like $1`, [`${TAG}:%`]);
  await admin.end();
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
