import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  createPrompt,
  getAdminPromptsPaginated,
  type AdminPromptSort,
  type AdminPromptStatus,
} from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { isSafeHref, parsePositiveInt } from '@/lib/security';
import {
  normalizeCodeLanguage,
  sanitizeSafeUrls,
  sanitizeStringArray,
} from '@/lib/vibe-coding';

const ALLOWED_STATUS = new Set<AdminPromptStatus>(['all', 'published', 'draft', 'featured']);
const ALLOWED_SORT = new Set<AdminPromptSort>(['newest', 'oldest', 'likes', 'views']);

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const sp = req.nextUrl.searchParams;
  const q         = sp.get('q') || '';
  const model     = sp.get('model') || '';
  const category  = sp.get('category') || '';
  const rawStatus = (sp.get('status') || 'all') as AdminPromptStatus;
  const rawSort   = (sp.get('sort') || 'newest') as AdminPromptSort;
  const status    = ALLOWED_STATUS.has(rawStatus) ? rawStatus : 'all';
  const sort      = ALLOWED_SORT.has(rawSort) ? rawSort : 'newest';
  const hasCode   = sp.get('hasCode') === '1' ? true : undefined;
  const page      = parsePositiveInt(sp.get('page'), 1, 10000);
  const limit     = parsePositiveInt(sp.get('limit'), 20, 100);

  try {
    const { items, total } = await getAdminPromptsPaginated({
      q,
      model,
      category,
      status,
      hasCode,
      sort,
      page,
      limit,
    });
    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load prompts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const promptText = typeof data.promptText === 'string' ? data.promptText.trim() : '';
  if (!promptText) {
    return NextResponse.json({ error: 'Prompt text is required' }, { status: 400 });
  }

  const rawImageUrl = typeof data.imageUrl === 'string' ? data.imageUrl.trim() : '';
  const rawLocalImg = typeof data.localImg === 'string' ? data.localImg.trim() : '';
  const rawPreviewUrl = typeof data.previewUrl === 'string' ? data.previewUrl.trim() : '';

  if (rawImageUrl && !isSafeHref(rawImageUrl)) {
    return NextResponse.json({ error: 'Invalid imageUrl' }, { status: 400 });
  }
  if (rawLocalImg && !isSafeHref(rawLocalImg)) {
    return NextResponse.json({ error: 'Invalid localImg' }, { status: 400 });
  }
  if (rawPreviewUrl && !isSafeHref(rawPreviewUrl)) {
    return NextResponse.json({ error: 'Invalid previewUrl' }, { status: 400 });
  }

  const galleryImages = sanitizeSafeUrls(data.galleryImages, 12);
  const stackTags = sanitizeStringArray(data.stackTags, 20, 40);
  const codeSnippet = typeof data.codeSnippet === 'string' ? data.codeSnippet.slice(0, 200_000) : '';
  const codeLanguage = codeSnippet.trim()
    ? normalizeCodeLanguage(data.codeLanguage) || 'tsx'
    : normalizeCodeLanguage(data.codeLanguage);
  const title = typeof data.title === 'string' ? data.title.trim().slice(0, 140) : '';

  const prompt = await createPrompt({
    title,
    promptText,
    imageUrl:     rawImageUrl,
    localImg:     rawLocalImg,
    authorName:   typeof data.authorName   === 'string' && data.authorName.trim() ? data.authorName.trim() : 'Admin',
    handle:       typeof data.handle       === 'string' ? data.handle.trim()       : '',
    model:        typeof data.model        === 'string' && data.model.trim() ? data.model.trim() : 'ChatGPT',
    category:     typeof data.category     === 'string' && data.category.trim() ? data.category.trim() : 'ChatGPT',
    tab:          typeof data.tab          === 'string' && data.tab.trim() ? data.tab.trim() : 'ChatGPT',
    likes:        typeof data.likes        === 'number' && Number.isFinite(data.likes) ? Math.max(0, Math.floor(data.likes)) : 0,
    views:        typeof data.views        === 'number' && Number.isFinite(data.views) ? Math.max(0, Math.floor(data.views)) : 0,
    gradientFrom: typeof data.gradientFrom === 'string' ? data.gradientFrom : '#b4d4f5',
    gradientTo:   typeof data.gradientTo   === 'string' ? data.gradientTo   : '#f5d4b4',
    aspectRatio:  typeof data.aspectRatio  === 'string' ? data.aspectRatio  : '4/3',
    featured:     typeof data.featured     === 'boolean' ? data.featured    : false,
    published:    typeof data.published    === 'boolean' ? data.published   : true,
    codeSnippet,
    codeLanguage,
    stackTags,
    galleryImages,
    previewUrl:   rawPreviewUrl,
  });

  revalidateTag('prompts', 'max');
  revalidatePath('/');
  return NextResponse.json(prompt, { status: 201 });
}
