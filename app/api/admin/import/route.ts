import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createPromptsBatch, getExistingPromptIds, type DbPrompt } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { isSafeHref } from '@/lib/security';

interface RawImportItem {
  id?: unknown;
  promptText?: unknown;
  imageUrl?: unknown;
  localImg?: unknown;
  authorName?: unknown;
  handle?: unknown;
  model?: unknown;
  category?: unknown;
  tab?: unknown;
  likes?: unknown;
  views?: unknown;
  gradientFrom?: unknown;
  gradientTo?: unknown;
  aspectRatio?: unknown;
  featured?: unknown;
  published?: unknown;
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const incoming: RawImportItem[] = Array.isArray(body)
    ? (body as RawImportItem[])
    : body && typeof body === 'object' && Array.isArray((body as { prompts?: unknown }).prompts)
      ? ((body as { prompts: RawImportItem[] }).prompts)
      : [];

  if (!incoming.length) {
    return NextResponse.json({ error: 'No prompts in payload' }, { status: 400 });
  }

  const existingIds = await getExistingPromptIds();
  const toInsert: Array<Omit<DbPrompt, 'id' | 'createdAt' | 'updatedAt'>> = [];

  let missingPrompt = 0;
  let duplicateId = 0;

  for (const p of incoming) {
    if (!p || typeof p !== 'object') {
      missingPrompt++;
      continue;
    }
    const promptText = typeof p.promptText === 'string' ? p.promptText.trim() : '';
    if (!promptText) {
      missingPrompt++;
      continue;
    }
    const id = typeof p.id === 'string' ? p.id.trim() : '';
    if (id && existingIds.has(id)) {
      duplicateId++;
      continue;
    }

    const imageUrl = typeof p.imageUrl === 'string' && isSafeHref(p.imageUrl) ? p.imageUrl.trim() : '';
    const localImg = typeof p.localImg === 'string' && isSafeHref(p.localImg) ? p.localImg.trim() : '';

    toInsert.push({
      promptText,
      imageUrl,
      localImg,
      authorName:   typeof p.authorName   === 'string' && p.authorName.trim() ? p.authorName.trim() : 'User',
      handle:       typeof p.handle       === 'string' ? p.handle.trim() : '',
      model:        typeof p.model        === 'string' && p.model.trim() ? p.model.trim() : 'ChatGPT',
      category:     typeof p.category     === 'string' && p.category.trim() ? p.category.trim() : 'ChatGPT',
      tab:          typeof p.tab          === 'string' && p.tab.trim() ? p.tab.trim() : 'ChatGPT',
      likes:        typeof p.likes        === 'number' && Number.isFinite(p.likes) ? Math.max(0, Math.floor(p.likes)) : 0,
      views:        typeof p.views        === 'number' && Number.isFinite(p.views) ? Math.max(0, Math.floor(p.views)) : 0,
      gradientFrom: typeof p.gradientFrom === 'string' ? p.gradientFrom : '#b4d4f5',
      gradientTo:   typeof p.gradientTo   === 'string' ? p.gradientTo   : '#f5d4b4',
      aspectRatio:  typeof p.aspectRatio  === 'string' ? p.aspectRatio  : '4/3',
      featured:     typeof p.featured     === 'boolean' ? p.featured    : false,
      published:    typeof p.published    === 'boolean' ? p.published   : true,
    });
  }

  const added = await createPromptsBatch(toInsert);
  const skipped = missingPrompt + duplicateId;

  if (added > 0) {
    revalidateTag('prompts', 'max');
    revalidatePath('/');
  }

  return NextResponse.json({
    added,
    skipped,
    total: incoming.length,
    reasons: { missingPrompt, duplicateId },
  });
}
