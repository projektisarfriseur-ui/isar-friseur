import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'isar_admin';
const PROTECTED = /^\/admin(\/.*)?$/;
const LOGIN = '/admin/login';

function secret() {
  const s = process.env.ADMIN_COOKIE_SECRET || 'dev-cookie-secret-change-me-please-32b';
  return new TextEncoder().encode(s);
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.test(pathname)) return NextResponse.next();
  if (pathname === LOGIN) return NextResponse.next();

  const tok = req.cookies.get(COOKIE)?.value;
  if (!tok) return NextResponse.redirect(new URL(LOGIN, req.url));

  try {
    await jwtVerify(tok, secret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL(LOGIN, req.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
