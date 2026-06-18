import { NextRequest, NextResponse } from 'next/server';
import { searchPrompts } from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) return NextResponse.json([]);
  const results = await searchPrompts(q);
  const published = results.filter((p) => p.published !== false).slice(0, 10);
  return NextResponse.json(published);
}
