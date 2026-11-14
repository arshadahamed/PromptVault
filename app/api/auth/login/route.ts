import { NextRequest, NextResponse } from 'next/server';
import { checkCredentials, createToken, COOKIE } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`login:${ip}`, { maxAttempts: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSec),
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { username, password } = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password ||
    username.length > 120 ||
    password.length > 200
  ) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  if (!(await checkCredentials(username.trim(), password))) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const token = await createToken();
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}
