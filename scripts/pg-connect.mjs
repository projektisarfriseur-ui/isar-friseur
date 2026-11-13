// Shared connection helper for CLI scripts (migrate, tests).
// Run scripts with: node --env-file=.env.local scripts/<name>.mjs
import pg from 'pg';

export function connectionString() {
  const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!raw) {
    console.error('POSTGRES_URL_NON_POOLING missing. Run `vercel env pull` first.');
    process.exit(1);
  }
  const url = new URL(raw);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('supa');
  return url.toString();
}

export async function connect() {
  const client = new pg.Client({ connectionString: connectionString(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}
