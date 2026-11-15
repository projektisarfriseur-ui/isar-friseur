// Staff account helper (service role, run locally).
//
//   node --env-file=.env.local scripts/staff-accounts.mjs owner <email> [--site https://…] [--staff <slug>]
//       Creates/finds the salon owner's account, grants the owner role and prints a
//       one-time link where the owner sets their own password.
//
//   node --env-file=.env.local scripts/staff-accounts.mjs test-setup
//   node --env-file=.env.local scripts/staff-accounts.mjs test-cleanup
//       Fictional accounts (@isar-friseur.test) for local end-to-end tests only.
//       Credentials go to .test-accounts.local.json (git-ignored). Run test-cleanup
//       before going live.
import { randomBytes } from 'node:crypto';
import { writeFile, readFile, rm } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { connect } from './pg-connect.mjs';

const TEST_FILE = '.test-accounts.local.json';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const admin = supabase.auth.admin;
const [cmd, ...args] = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

async function findUserByEmail(email) {
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (hit || data.users.length < 200) return hit || null;
  }
  return null;
}

async function grant(db, userId, role, staffSlug) {
  await db.query(`
    insert into booking.role_assignments (user_id, role)
    select $1, $2 where not exists (
      select 1 from booking.role_assignments where user_id = $1 and role = $2 and revoked_at is null)`, [userId, role]);
  if (staffSlug) {
    const { rowCount } = await db.query(`update booking.staff set user_id = $1 where slug = $2`, [userId, staffSlug]);
    if (!rowCount) throw new Error(`no staff with slug ${staffSlug}`);
  }
}

const db = await connect();
try {
  if (cmd === 'owner') {
    const email = args[0];
    if (!email || !email.includes('@')) throw new Error('usage: owner <email> [--site URL] [--staff slug]');
    const site = flag('--site') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let type = 'invite';
    let { data, error } = await admin.generateLink({ type, email });
    if (error) { type = 'recovery'; ({ data, error } = await admin.generateLink({ type, email })); }
    if (error) throw error;
    await grant(db, data.user.id, 'owner', flag('--staff'));
    const link = new URL('/admin/auth/confirm', site);
    link.searchParams.set('token_hash', data.properties.hashed_token);
    link.searchParams.set('type', type);
    console.log(`Owner role granted to ${email}.`);
    console.log('One-time password link (valid ~1 hour, open it yourself, do not forward):');
    console.log(link.toString());
  } else if (cmd === 'test-setup') {
    const plan = [
      { key: 'owner', email: 'chef@isar-friseur.test', role: 'owner' },
      { key: 'gulay', email: 'gulay@isar-friseur.test', role: 'hairdresser', staff: 'gulay' },
      { key: 'paula', email: 'paula@isar-friseur.test', role: 'hairdresser', staff: 'paula' },
    ];
    const out = {};
    for (const p of plan) {
      const password = randomBytes(18).toString('base64url');
      let user = await findUserByEmail(p.email);
      if (user) {
        await admin.updateUserById(user.id, { password, ban_duration: 'none' });
      } else {
        const { data, error } = await admin.createUser({ email: p.email, password, email_confirm: true });
        if (error) throw error;
        user = data.user;
      }
      await grant(db, user.id, p.role, p.staff);
      out[p.key] = { email: p.email, password, userId: user.id, role: p.role, staff: p.staff || null };
    }
    await writeFile(TEST_FILE, JSON.stringify(out, null, 2));
    console.log(`Test accounts ready (${Object.keys(out).join(', ')}); credentials in ${TEST_FILE}`);
  } else if (cmd === 'test-cleanup') {
    let accounts = {};
    try { accounts = JSON.parse(await readFile(TEST_FILE, 'utf8')); } catch {}
    const { rows } = await db.query(`select id from auth.users where email like '%@isar-friseur.test'`);
    const ids = new Set([...rows.map(r => r.id), ...Object.values(accounts).map(a => a.userId)]);
    for (const id of ids) {
      await db.query(`update booking.staff set user_id = null where user_id = $1`, [id]);
      await db.query(`delete from booking.role_assignments where user_id = $1`, [id]);
      await admin.deleteUser(id);
    }
    await rm(TEST_FILE, { force: true });
    // Fictional demo bookings made during testing (customers on example.test).
    const { rowCount } = await db.query(`
      delete from booking.appointments a using booking.customers c
       where c.id = a.customer_id and c.email like '%@example.test'`);
    await db.query(`delete from booking.customers where email like '%@example.test'`);
    console.log(`Removed ${ids.size} test account(s) and ${rowCount} demo booking(s).`);
  } else {
    console.log('commands: owner <email> [--site URL] [--staff slug] | test-setup | test-cleanup');
  }
} finally {
  await db.end();
}
