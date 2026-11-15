import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-auth';
import { getStaffSession } from '../../../lib/staff-auth';
import { assertSameOrigin, errorResponse } from '../../../lib/booking/http';

// Email + password sign-in for staff. Supabase Auth hashes passwords and
// rate-limits attempts; responses stay generic (AUTH-02).
export async function POST(req) {
  try {
    await assertSameOrigin();
    const { email, password } = await req.json().catch(() => ({}));
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 400 });
    }
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      const limited = error.status === 429;
      return NextResponse.json({ error: limited ? 'rate_limited' : 'invalid_credentials' }, { status: limited ? 429 : 401 });
    }
    const session = await getStaffSession();
    if (!session) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'not_staff' }, { status: 403 });
    }
    return NextResponse.json({ ok: true, isOwner: session.isOwner });
  } catch (err) {
    return errorResponse(err);
  }
}
