import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts, createPrompt } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body     = await req.json();
  const incoming = body.prompts || (Array.isArray(body) ? body : []) as any[];
  if (!incoming.length) return NextResponse.json({ error: 'No prompts in payload' }, { status: 400 });

  const existing    = await getAllPrompts();
  const existingIds = new Set(existing.map((p) => p.id));
  let added   = 0;
  let skipped = 0;

  for (const p of incoming) {
    if (!p.promptText)                      { skipped++; continue; }
    if (p.id && existingIds.has(p.id))      { skipped++; continue; }
    await createPrompt({
      promptText:   p.promptText   || '',
      imageUrl:     p.imageUrl     || '',
      localImg:     p.localImg     || '',
      authorName:   p.authorName   || 'User',
      handle:       p.handle       || '',
      model:        p.model        || 'ChatGPT',
      category:     p.category     || 'ChatGPT',
      tab:          p.tab          || 'ChatGPT',
      likes:        p.likes        || 0,
      views:        p.views        || 0,
      gradientFrom: p.gradientFrom || '#b4d4f5',
      gradientTo:   p.gradientTo   || '#f5d4b4',
      aspectRatio:  p.aspectRatio  || '4/3',
      featured:     p.featured     ?? false,
      published:    p.published    ?? true,
    });
    added++;
  }

  return NextResponse.json({ added, skipped, total: incoming.length });
}
