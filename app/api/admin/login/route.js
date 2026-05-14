import { NextResponse } from 'next/server';
import { checkSharedSecret, createAdminSession } from '../../../lib/auth';

export async function POST(req) {
  const { password } = await req.json();
  if (!checkSharedSecret(password)) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }
  await createAdminSession();
  return NextResponse.json({ ok: true });
}
