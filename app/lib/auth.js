import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE = 'isar_admin';
const ALG = 'HS256';

function secret() {
  const s = process.env.ADMIN_COOKIE_SECRET || 'dev-cookie-secret-change-me-please-32b';
  return new TextEncoder().encode(s);
}

export async function createAdminSession() {
  const jwt = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin() {
  const jar = await cookies();
  const tok = jar.get(COOKIE)?.value;
  if (!tok) return false;
  try {
    await jwtVerify(tok, secret());
    return true;
  } catch {
    return false;
  }
}

export function checkSharedSecret(input) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  return input === expected;
}
