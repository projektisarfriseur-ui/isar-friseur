// Server-only Postgres access for the reservation system (`booking` schema).
// Booking mutations need real transactions + DB constraint errors, which the
// Supabase REST client cannot give us, so we talk to Postgres directly.
import 'server-only';
import pg from 'pg';

const globalForPg = globalThis;

function connectionString() {
  const raw = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!raw) throw new Error('POSTGRES_URL is not set');
  // sslmode in the URL makes node-pg verify against the system CA store, which
  // rejects Supabase's own CA. TLS stays on via the `ssl` option below.
  const url = new URL(raw);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('supa');
  return url.toString();
}

export function pool() {
  if (!globalForPg.__isarPool) {
    globalForPg.__isarPool = new pg.Pool({
      connectionString: connectionString(),
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000,
    });
  }
  return globalForPg.__isarPool;
}

export function dbConfigured() {
  return Boolean(process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING);
}

// Postgres error codes the booking layer maps to stable API errors.
export const PG = {
  EXCLUSION_VIOLATION: '23P01', // overlapping allocation -> slot unavailable
  UNIQUE_VIOLATION: '23505',
  SERIALIZATION_FAILURE: '40001',
  DEADLOCK: '40P01',
};

// Runs fn(client) in one transaction. Retries a bounded number of times on
// serialization failures / deadlocks (SCH-12); every other error propagates.
export async function withTransaction(fn, { retries = 2 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const client = await pool().connect();
    try {
      await client.query('begin');
      const result = await fn(client);
      await client.query('commit');
      return result;
    } catch (err) {
      await client.query('rollback').catch(() => {});
      const retryable = err.code === PG.SERIALIZATION_FAILURE || err.code === PG.DEADLOCK;
      if (!retryable || attempt >= retries) throw err;
    } finally {
      client.release();
    }
  }
}
