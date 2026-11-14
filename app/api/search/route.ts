import { NextRequest, NextResponse } from 'next/server';
import { searchPublishedPrompts } from '@/lib/db';
import { toPrompt } from '@/lib/prompts';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, sanitizeSearchQuery } from '@/lib/security';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`search:${ip}`, { maxAttempts: 60, windowMs: 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const q = sanitizeSearchQuery(req.nextUrl.searchParams.get('q') || '');
  if (!q) return NextResponse.json([], { headers: { 'Cache-Control': 'public, s-maxage=30' } });

  const rows = await searchPublishedPrompts(q, 12);
  return NextResponse.json(rows.map(toPrompt), {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
    },
  });
}
