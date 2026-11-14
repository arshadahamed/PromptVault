import { NextRequest, NextResponse } from 'next/server';
import { getPromptsPaginated, getPromptCount, GALLERY_TABS } from '@/lib/db';
import { toPrompt } from '@/lib/prompts';
import { parsePositiveInt } from '@/lib/security';

const LIMIT = 48;
const ALLOWED_TABS = new Set<string>(GALLERY_TABS);
const ALLOWED_SORTS = new Set<string>(['Featured', 'Newest', 'Popular']);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawTab  = searchParams.get('tab')  ?? 'All';
  const rawSort = searchParams.get('sort') ?? 'Featured';
  const tab  = ALLOWED_TABS.has(rawTab) ? rawTab : 'All';
  const sort = ALLOWED_SORTS.has(rawSort) ? rawSort : 'Featured';
  const page = parsePositiveInt(searchParams.get('page'), 1, 1000);

  const [dbPrompts, total] = await Promise.all([
    getPromptsPaginated({ tab, sort, page, limit: LIMIT }),
    getPromptCount(tab),
  ]);

  const prompts = dbPrompts.map(toPrompt);
  const hasMore = page * LIMIT < total;

  return NextResponse.json(
    { prompts, total, hasMore, page, limit: LIMIT },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
