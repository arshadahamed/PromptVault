import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'meigen_admin';

async function verifyToken(token: string): Promise<boolean> {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot < 0) return false;
    const payload = token.slice(0, lastDot);
    const sig     = token.slice(lastDot + 1);

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 16) return false;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(
      (sig.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16))
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(payload)
    );

    if (!valid) return false;

    const exp = parseInt(payload.split(':')[1] ?? '0', 10);
    return Math.floor(Date.now() / 1000) < exp;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token || !(await verifyToken(token))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
