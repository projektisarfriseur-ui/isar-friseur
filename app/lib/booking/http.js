// Shared bits for the booking route handlers.
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { BookingError } from './engine';
import { sha256 } from './service';

const SESSION_COOKIE = 'isar_bk_sid';

// Opaque guest session bound to holds (SCH-08). Only its digest is stored.
export async function guestSession({ create = false } = {}) {
  const jar = await cookies();
  let sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid && create) {
    sid = randomBytes(32).toString('base64url');
    jar.set(SESSION_COOKIE, sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
  }
  return sid ? sha256(sid) : null;
}

export async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || null;
}

// Stable error codes for the client (ARCH-08); no stack traces leak out.
export function errorResponse(err) {
  if (err instanceof BookingError) {
    return NextResponse.json({ error: err.code, detail: err.detail ?? null }, { status: err.status });
  }
  console.error('[booking]', err);
  return NextResponse.json({ error: 'internal_error' }, { status: 500 });
}

// Same-origin check for state-changing requests from the browser (CSRF).
export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get('origin');
  const host = h.get('x-forwarded-host') || h.get('host');
  if (origin && host && new URL(origin).host !== host) throw new BookingError('forbidden_origin', 403);
}
