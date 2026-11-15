// End-to-end checks against a running dev server (fictional data only).
// Needs: npm run dev, and `scripts/staff-accounts.mjs test-setup` done first.
// Usage: node --env-file=.env.local scripts/e2e-booking.mjs [baseUrl]
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { connect } from './pg-connect.mjs';

const BASE = process.argv[2] || 'http://localhost:3000';
const accounts = JSON.parse(await readFile('.test-accounts.local.json', 'utf8'));
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

// Minimal cookie-keeping client per actor.
function client() {
  const jar = new Map();
  return async function call(path, { method = 'GET', body, headers = {}, redirect = 'manual' } = {}) {
    const res = await fetch(BASE + path, {
      method, redirect,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      const k = pair.slice(0, i), v = pair.slice(i + 1);
      if (!v || /max-age=0/i.test(c)) jar.delete(k); else jar.set(k, v);
    }
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, headers: res.headers };
  };
}

const created = [];
const db = await connect();
try {
  const anon = client();
  const { json: cat } = await anon('/api/booking/catalog');
  const colour = cat.services.find(s => s.group_key === 'color' && s.duration_min === 90);
  const gulay = cat.stylists.find(s => s.slug === 'gulay');
  const paula = cat.stylists.find(s => s.slug === 'paula');

  // A weekday ~5 weeks out, so real bookings and notice rules don't interfere.
  const d = new Date(); d.setDate(d.getDate() + 35);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const { json: av } = await anon(`/api/booking/availability?date=${date}&serviceIds=${colour.id}&staffId=${gulay.id}`);
  const time = av.slots[0];
  check('availability returns slots for Gülay', av.slots.length > 0, `${date} first=${time}`);

  // Two guests race for the same slot with the same stylist.
  const guestA = client(), guestB = client();
  const holdA = await guestA('/api/booking/holds', { method: 'POST', body: { date, time, serviceIds: [colour.id], staffId: gulay.id } });
  const holdB = await guestB('/api/booking/holds', { method: 'POST', body: { date, time, serviceIds: [colour.id], staffId: gulay.id } });
  check('hold A created', holdA.status === 201, `staff=${holdA.json?.staff?.name}`);
  check('hold B on same slot rejected (AT-09)', holdB.status === 409 && holdB.json?.error === 'slot_unavailable');

  const stolen = await guestB(`/api/booking/holds/${holdA.json.holdId}/confirm`, {
    method: 'POST', headers: { 'idempotency-key': randomUUID() },
    body: { first_name: 'Eve', last_name: 'Test', email: 'eve@example.test', consent: true },
  });
  check('another session cannot confirm hold A (AT-10)', stolen.status === 404);

  const key = randomUUID();
  const customer = { first_name: 'Erika', last_name: 'Musterfrau', email: 'erika@example.test', phone: '+49 89 000000', consent: true, lang: 'de' };
  const conf1 = await guestA(`/api/booking/holds/${holdA.json.holdId}/confirm`, { method: 'POST', headers: { 'idempotency-key': key }, body: customer });
  const conf2 = await guestA(`/api/booking/holds/${holdA.json.holdId}/confirm`, { method: 'POST', headers: { 'idempotency-key': key }, body: customer });
  const conf3 = await guestA(`/api/booking/holds/${holdA.json.holdId}/confirm`, { method: 'POST', headers: { 'idempotency-key': key }, body: { ...customer, last_name: 'Other' } });
  const ref = conf1.json?.reference;
  check('confirm creates appointment', conf1.status === 201 && Boolean(ref), `ref=${ref} ${conf1.json?.localTime}`);
  check('retry with same key returns same booking (AT-11)', conf2.json?.reference === ref);
  check('same key + different payload rejected', conf3.status === 422);
  const { rows: [appt] } = await db.query(`select id from booking.appointments where reference = $1`, [ref]);
  created.push(appt.id);
  const { rows: [{ n }] } = await db.query(`select count(*)::int n from booking.appointments where reference = $1`, [ref]);
  check('exactly one appointment row', n === 1);

  const { json: av2 } = await anon(`/api/booking/availability?date=${date}&serviceIds=${colour.id}&staffId=${gulay.id}`);
  check('booked slot no longer offered for Gülay', !av2.slots.includes(time));

  // ---- staff side
  const login = async (who) => {
    const c = client();
    const r = await c('/api/admin/login', { method: 'POST', body: { email: accounts[who].email, password: accounts[who].password } });
    return { c, r };
  };
  const unauth = await anon('/api/staff/appointments?from=2026-01-01T00:00:00Z&to=2026-02-01T00:00:00Z');
  check('staff API without login -> 401', unauth.status === 401);
  const page = await anon('/admin');
  check('/admin without login redirects to /admin/login', page.status === 307 && /\/admin\/login/.test(page.headers.get('location') || ''));
  const bad = await anon('/api/admin/login', { method: 'POST', body: { email: accounts.gulay.email, password: 'wrong-password-123' } });
  check('wrong password rejected generically', bad.status === 401 && bad.json?.error === 'invalid_credentials');

  const G = await login('gulay'), P = await login('paula'), O = await login('owner');
  check('logins succeed', [G, P, O].every(x => x.r.status === 200), `owner isOwner=${O.r.json?.isOwner}`);

  const from = new Date(`${date}T00:00:00Z`).toISOString(), to = new Date(`${date}T23:59:59Z`).toISOString();
  const listG = await G.c(`/api/staff/appointments?from=${from}&to=${to}`);
  const listP = await P.c(`/api/staff/appointments?from=${from}&to=${to}`);
  const listO = await O.c(`/api/staff/appointments?from=${from}&to=${to}&staffId=${gulay.id}`);
  const has = (r) => (r.json?.appointments || []).some(a => a.reference === ref);
  check('Gülay sees her new booking', has(listG));
  check('Paula does not see Gülay\'s booking (AT-07/08)', !has(listP));
  check('owner sees Gülay\'s calendar', has(listO));
  check('Paula opening it by id -> 404', (await P.c(`/api/staff/appointments/${appt.id}`)).status === 404);
  check('Paula changing it -> 404', (await P.c(`/api/staff/appointments/${appt.id}`, { method: 'PATCH', body: { status: 'arrived', version: 1 } })).status === 404);

  const note = await O.c(`/api/staff/appointments/${appt.id}/notes`, { method: 'POST', body: { body: 'Farbe 7.1, Stammkundin' } });
  const detailG = await G.c(`/api/staff/appointments/${appt.id}`);
  check('owner note visible to Gülay', note.status === 201 && detailG.json?.appointment?.notes?.some(x => x.body.includes('7.1')));
  const noteG = await G.c(`/api/staff/appointments/${appt.id}/notes`, { method: 'POST', body: { body: 'Kundin kommt 5 Min später' } });
  const detailO = await O.c(`/api/staff/appointments/${appt.id}`);
  check('Gülay note visible to owner', noteG.status === 201 && detailO.json?.appointment?.notes?.length === 2);

  const arrived = await G.c(`/api/staff/appointments/${appt.id}`, { method: 'PATCH', body: { status: 'arrived', version: 1 } });
  check('Gülay marks arrived', arrived.status === 200 && arrived.json?.version === 2);
  const gCancel = await G.c(`/api/staff/appointments/${appt.id}`, { method: 'PATCH', body: { status: 'cancelled', version: 2, reason: 'x' } });
  check('hairdresser cannot cancel (owner only)', gCancel.status === 403);
  const stale = await O.c(`/api/staff/appointments/${appt.id}`, { method: 'PATCH', body: { status: 'completed', version: 1 } });
  check('stale version -> 409 (AT-32)', stale.status === 409 && stale.json?.error === 'stale_version');
  const noReason = await O.c(`/api/staff/appointments/${appt.id}`, { method: 'PATCH', body: { status: 'cancelled', version: 2 } });
  check('cancel without reason refused', noReason.status === 422);
  const cancel = await O.c(`/api/staff/appointments/${appt.id}`, { method: 'PATCH', body: { status: 'cancelled', version: 2, reason: 'E2E-Test', notifyCustomer: false } });
  check('owner cancels with reason', cancel.status === 200);
  const { json: av3 } = await anon(`/api/booking/availability?date=${date}&serviceIds=${colour.id}&staffId=${gulay.id}`);
  check('cancelled slot offered again', av3.slots.includes(time));

  // ---- payments + customer history
  const { json: avP } = await anon(`/api/booking/availability?date=${date}&serviceIds=${colour.id}&staffId=${paula.id}`);
  const guestC = client();
  const holdC = await guestC('/api/booking/holds', { method: 'POST', body: { date, time: avP.slots[0], serviceIds: [colour.id], staffId: paula.id } });
  const confC = await guestC(`/api/booking/holds/${holdC.json.holdId}/confirm`, {
    method: 'POST', headers: { 'idempotency-key': randomUUID() },
    body: { first_name: 'Max', last_name: 'Historie', email: 'max.historie@example.test', consent: true, lang: 'de' },
  });
  const { rows: [apptC] } = await db.query(`select id, customer_id from booking.appointments where reference = $1`, [confC.json?.reference]);
  created.push(apptC.id);
  const payEarly = await P.c(`/api/staff/appointments/${apptC.id}/payment`, { method: 'PUT', body: { method: 'cash', amount_minor: 5000 } });
  check('payment refused before arrival', payEarly.status === 422 && payEarly.json?.error === 'not_ready_for_payment');
  await P.c(`/api/staff/appointments/${apptC.id}`, { method: 'PATCH', body: { status: 'arrived', version: 1 } });
  const payOther = await G.c(`/api/staff/appointments/${apptC.id}/payment`, { method: 'PUT', body: { method: 'cash', amount_minor: 5000 } });
  check('other stylist cannot record payment', payOther.status === 404);
  const payBad = await P.c(`/api/staff/appointments/${apptC.id}/payment`, { method: 'PUT', body: { method: 'bitcoin', amount_minor: 5000 } });
  check('unknown payment method rejected', payBad.status === 400 && payBad.json?.error === 'invalid_input');
  const delUpcoming = await O.c('/api/staff/customers', { method: 'DELETE', body: { ids: [apptC.customer_id] } });
  check('cannot delete customer with upcoming booking', delUpcoming.status === 409 && delUpcoming.json?.error === 'has_upcoming');
  const pay = await P.c(`/api/staff/appointments/${apptC.id}/payment`, { method: 'PUT', body: { method: 'card', amount_minor: 4550 } });
  check('stylist records card payment, visit completed', pay.status === 200 && pay.json?.status === 'completed');
  check('hairdresser cannot open customer history', (await P.c('/api/staff/customers')).status === 403);
  const hist = await O.c('/api/staff/customers?q=historie');
  const row = hist.json?.customers?.find(c => c.id === apptC.customer_id);
  check('owner sees customer in history with total', row?.total_paid_minor === 4550 && row?.last_visit?.method === 'card' && row?.last_visit?.staff === 'Paula');
  const detail = await O.c(`/api/staff/customers/${apptC.customer_id}`);
  const v = detail.json?.visits?.[0];
  check('customer detail: stylist, amount, method', v?.payment?.amount_minor === 4550 && v?.payment?.method === 'card' && v?.items?.[0]?.staff === 'Paula');
  const delC = await O.c('/api/staff/customers', { method: 'DELETE', body: { ids: [apptC.customer_id] } });
  const { rows: [{ left }] } = await db.query(`select count(*)::int as left from booking.appointments where id = $1`, [apptC.id]);
  check('owner deletes customer and visits', delC.status === 200 && delC.json?.deleted === 1 && left === 0);

  // ---- team management
  check('hairdresser cannot open team admin', (await G.c('/api/staff/team')).status === 403);
  const team = await O.c('/api/staff/team');
  check('owner lists 7 team members', team.json?.team?.length === 7);
  const haji = team.json.team.find(t => t.slug === 'haji');
  const inv = await O.c(`/api/staff/team/${haji.id}/access`, { method: 'POST', body: { action: 'invite', email: 'haji@isar-friseur.test' } });
  check('owner creates invite link', inv.status === 200 && /\/admin\/auth\/confirm\?token_hash=/.test(inv.json?.link || ''));
  const H = client();
  const landing = await H(new URL(inv.json.link).pathname + new URL(inv.json.link).search);
  check('invite link signs in and asks for password', landing.status === 307 && /\/admin\/password/.test(landing.headers.get('location') || ''));
  const reuse = await client()(new URL(inv.json.link).pathname + new URL(inv.json.link).search);
  check('invite link is single-use', /link=invalid/.test(reuse.headers.get('location') || ''));
  const newPw = randomUUID();
  const setPw = await H('/api/admin/password', { method: 'POST', body: { password: newPw } });
  const H2 = client();
  const hLogin = await H2('/api/admin/login', { method: 'POST', body: { email: 'haji@isar-friseur.test', password: newPw } });
  const hMe = await H2('/api/staff/me');
  check('invited stylist sets password and logs in', setPw.status === 200 && hLogin.status === 200 && hMe.json?.staff?.[0]?.name === 'Haji');
  const revoke = await O.c(`/api/staff/team/${haji.id}/access`, { method: 'POST', body: { action: 'revoke' } });
  const afterRevoke = await H2('/api/staff/me');
  check('revoked stylist loses access immediately', revoke.status === 200 && afterRevoke.status === 401);
} finally {
  for (const id of created) {
    const { rows: [a] } = await db.query(`select customer_id from booking.appointments where id = $1`, [id]);
    await db.query(`delete from booking.idempotency_keys where response->>'reference' = (select reference from booking.appointments where id = $1)`, [id]);
    await db.query(`delete from booking.notification_outbox where appointment_id = $1`, [id]);
    await db.query(`delete from booking.appointments where id = $1`, [id]);
    if (a) await db.query(`delete from booking.customers where id = $1`, [a.customer_id]);
  }
  await db.query(`delete from booking.holds where itinerary->>'date' >= to_char(now(), 'YYYY-MM-DD') and status <> 'active' and created_at > now() - interval '1 hour'`);
  await db.end();
}
const failed = results.filter(x => !x).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
