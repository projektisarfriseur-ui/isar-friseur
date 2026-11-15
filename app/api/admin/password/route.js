import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-auth';
import { assertSameOrigin, errorResponse } from '../../../lib/booking/http';

// Sets the signed-in user's password (after an invite / reset link).
export async function POST(req) {
  try {
    await assertSameOrigin();
    const { password } = await req.json().catch(() => ({}));
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
      return NextResponse.json({ error: 'weak_password' }, { status: 400 });
    }
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return NextResponse.json({ error: error.code === 'weak_password' ? 'weak_password' : 'update_failed' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
