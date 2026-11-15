// Applies supabase/migrations/*.sql in filename order, once each.
// Usage: node --env-file=.env.local scripts/migrate.mjs
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { connect } from './pg-connect.mjs';

const dir = path.resolve('supabase/migrations');
const client = await connect();

try {
  await client.query(`
    create table if not exists public.schema_migrations (
      name       text primary key,
      checksum   text not null,
      applied_at timestamptz not null default now()
    )`);
  await client.query('alter table public.schema_migrations enable row level security');

  const done = new Map(
    (await client.query('select name, checksum from public.schema_migrations')).rows.map(r => [r.name, r.checksum]),
  );
  const files = (await readdir(dir)).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = await readFile(path.join(dir, file), 'utf8');
    // Hash with LF endings so git's core.autocrlf checkouts don't look like edits.
    const checksum = createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex');
    if (done.has(file)) {
      if (done.get(file) !== checksum) console.warn(`! ${file} changed after it was applied (not re-run)`);
      continue;
    }
    process.stdout.write(`→ ${file} ... `);
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into public.schema_migrations (name, checksum) values ($1, $2)', [file, checksum]);
      await client.query('commit');
      console.log('ok');
    } catch (err) {
      await client.query('rollback');
      console.log('FAILED');
      throw err;
    }
  }
  console.log('Migrations up to date.');
} finally {
  await client.end();
}
