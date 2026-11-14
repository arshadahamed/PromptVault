import { NextRequest, NextResponse } from 'next/server';
import { getPublishedPromptsByIds } from '@/lib/db';
import { toPrompt } from '@/lib/prompts';

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get('ids') || '';
  if (!idsParam.trim()) return NextResponse.json([]);

  const rows = await getPublishedPromptsByIds(idsParam);
  return NextResponse.json(rows.map(toPrompt), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
