import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, verifyToken } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token || !(await verifyToken(token))) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/login') {
    const token = req.cookies.get(COOKIE)?.value;
    if (token && (await verifyToken(token))) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
