import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-auth';

// Landing for invite / password-reset links the owner generates in the TEAM tab.
// Verifies the single-use token, starts a session, then asks for a new password.
export async function GET(req) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const fail = new URL('/admin/login?link=invalid', url.origin);
  if (!tokenHash || !['invite', 'recovery'].includes(type)) return NextResponse.redirect(fail);

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return NextResponse.redirect(fail);
  const res = NextResponse.redirect(new URL('/admin/password', url.origin));
  res.headers.set('referrer-policy', 'no-referrer');   // keep the token out of referrers (MSG-06)
  return res;
}
