import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public admin entry points (login + invite/password-reset landing).
const PUBLIC_ADMIN = new Set(['/admin/login', '/admin/auth/confirm', '/admin/password']);

export async function proxy(req) {
  let res = NextResponse.next({ request: req });

  // Refresh the Supabase session cookie on every admin request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  if (!user && !PUBLIC_ADMIN.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
