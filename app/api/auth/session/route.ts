import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const authenticated = token ? await verifyToken(token) : false;
  return NextResponse.json(
    { authenticated },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
