import crypto from 'crypto';
import { unstable_cache } from 'next/cache';
import { supabase } from './supabase';
import { sanitizePromptIds, sanitizeSearchQuery } from './security';

const PUBLIC_GALLERY_COLUMNS =
  'id, title, prompt_text, image_url, local_img, author_name, handle, model, category, tab, likes, views, gradient_from, gradient_to, aspect_ratio, created_at, featured, code_language, stack_tags, gallery_images, preview_url, has_code';

const PUBLIC_DETAIL_COLUMNS = `${PUBLIC_GALLERY_COLUMNS}, code_snippet`;

export const GALLERY_TABS = [
  'All',
  'Vibe Coding',
  'ChatGPT',
  'Nanobanana',
  'Midjourney',
  'Flux',
  'Seedance',
  'Gemini',
  'Adobe Firefly',
] as const;

export interface DbPrompt {
  id: string;
  sourceId?: string;
  title?: string;
  promptText: string;
  imageUrl: string;
  localImg: string;
  authorName: string;
  handle: string;
  model: string;
  category: string;
  tab: string;
  likes: number;
  views: number;
  gradientFrom: string;
  gradientTo: string;
  aspectRatio: string;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
  published?: boolean;
  codeSnippet?: string;
  codeLanguage?: string;
  stackTags?: string[];
  galleryImages?: string[];
  previewUrl?: string;
  hasCode?: boolean;
}

export interface DbCategory {
  id: string;
  name: string;
  createdAt: string;
}

// ── Row mappers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromRow(row: any): DbPrompt {
  return {
    id:            row.id,
    sourceId:      row.source_id ?? undefined,
    title:         typeof row.title === 'string' ? row.title : '',
    promptText:    row.prompt_text,
    imageUrl:      row.image_url ?? '',
    localImg:      row.local_img ?? '',
    authorName:    row.author_name ?? 'Admin',
    handle:        row.handle ?? '@admin',
    model:         row.model,
    category:      row.category,
    tab:           row.tab,
    likes:         row.likes ?? 0,
    views:         row.views ?? 0,
    gradientFrom:  row.gradient_from ?? '#d4f5b4',
    gradientTo:    row.gradient_to ?? '#f5b4e8',
    aspectRatio:   row.aspect_ratio ?? '4/3',
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
    featured:      row.featured ?? false,
    published:     row.published ?? true,
    codeSnippet:   typeof row.code_snippet === 'string' ? row.code_snippet : '',
    codeLanguage:  typeof row.code_language === 'string' ? row.code_language : '',
    stackTags:     Array.isArray(row.stack_tags) ? row.stack_tags.filter((x: unknown): x is string => typeof x === 'string') : [],
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images.filter((x: unknown): x is string => typeof x === 'string') : [],
    previewUrl:    typeof row.preview_url === 'string' ? row.preview_url : '',
    hasCode:       Boolean(row.has_code ?? (typeof row.code_snippet === 'string' && row.code_snippet.trim().length > 0)),
  };
}

function toRow(p: Partial<DbPrompt>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (p.id !== undefined)            r.id = p.id;
  if (p.sourceId !== undefined)      r.source_id = p.sourceId;
  if (p.title !== undefined)         r.title = p.title;
  if (p.promptText !== undefined)    r.prompt_text = p.promptText;
  if (p.imageUrl !== undefined)      r.image_url = p.imageUrl;
  if (p.localImg !== undefined)      r.local_img = p.localImg;
  if (p.authorName !== undefined)    r.author_name = p.authorName;
  if (p.handle !== undefined)        r.handle = p.handle;
  if (p.model !== undefined)         r.model = p.model;
  if (p.category !== undefined)      r.category = p.category;
  if (p.tab !== undefined)           r.tab = p.tab;
  if (p.likes !== undefined)         r.likes = p.likes;
  if (p.views !== undefined)         r.views = p.views;
  if (p.gradientFrom !== undefined)  r.gradient_from = p.gradientFrom;
  if (p.gradientTo !== undefined)    r.gradient_to = p.gradientTo;
  if (p.aspectRatio !== undefined)   r.aspect_ratio = p.aspectRatio;
  if (p.featured !== undefined)      r.featured = p.featured;
  if (p.published !== undefined)     r.published = p.published;
  if (p.codeSnippet !== undefined)   r.code_snippet = p.codeSnippet;
  if (p.codeLanguage !== undefined)  r.code_language = p.codeLanguage;
  if (p.stackTags !== undefined)     r.stack_tags = p.stackTags;
  if (p.galleryImages !== undefined) r.gallery_images = p.galleryImages;
  if (p.previewUrl !== undefined)    r.preview_url = p.previewUrl;
  return r;
}

// ── Fast In-Memory Read Cache (eliminates repeated Supabase round-trips) ─────
interface MemCacheEntry<T> {
  value: T;
  expiresAt: number;
}
const MEM_TTL_MS = 120_000; // 2 minutes in-RAM cache
const memCache = new Map<string, MemCacheEntry<unknown>>();

function getMemCache<T>(key: string): T | undefined {
  const entry = memCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setMemCache<T>(key: string, value: T, ttlMs = MEM_TTL_MS): T {
  memCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function clearPromptsMemCache(): void {
  memCache.clear();
}

// ── Prompts ───────────────────────────────────────────────────────────────────

/**
 * Paginated prompt fetch — only fetches `limit` rows per page.
 * Server-side tab/sort filtering + in-memory & Next.js cache keeps responses < 5ms.
 */
export interface GetPromptsPaginatedOptions {
  tab?: string;   // 'All' | 'ChatGPT' | 'Midjourney' | etc.
  sort?: string;  // 'Featured' | 'Newest' | 'Popular'
  page?: number;  // 1-indexed
  limit?: number;
}

const _fetchPromptsPaginated = unstable_cache(
  async ({ tab = 'All', sort = 'Featured', page = 1, limit = 24 }: GetPromptsPaginatedOptions = {}): Promise<DbPrompt[]> => {
    let q = supabase
      .from('prompts')
      .select(PUBLIC_GALLERY_COLUMNS)
      .eq('published', true);

    if (tab && tab !== 'All') {
      if (tab === 'Vibe Coding') q = q.or('tab.eq.Vibe Coding,category.eq.Vibe Coding');
      else q = q.eq('tab', tab);
    }

    if (sort === 'Popular')       q = q.order('likes',      { ascending: false });
    else if (sort === 'Newest')   q = q.order('created_at', { ascending: false });
    else /* Featured */           q = q.order('featured',   { ascending: false })
                                       .order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const { data, error } = await q.range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return (data ?? []).map(fromRow);
  },
  ['prompts-paginated'],
  { revalidate: 300, tags: ['prompts'] }
);

export async function getPromptsPaginated(opts: GetPromptsPaginatedOptions = {}): Promise<DbPrompt[]> {
  const tab = opts.tab ?? 'All';
  const sort = opts.sort ?? 'Featured';
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 24;
  const key = `paginated:${tab}:${sort}:${page}:${limit}`;
  const cached = getMemCache<DbPrompt[]>(key);
  if (cached) return cached;
  const res = await _fetchPromptsPaginated({ tab, sort, page, limit });
  return setMemCache(key, res);
}

/** Total published prompt count — cached in memory + Next.js unstable_cache */
const _fetchPromptCount = unstable_cache(
  async (tab = 'All'): Promise<number> => {
    let q = supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('published', true);
    if (tab !== 'All') {
      if (tab === 'Vibe Coding') q = q.or('tab.eq.Vibe Coding,category.eq.Vibe Coding');
      else q = q.eq('tab', tab);
    }
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  ['prompts-count'],
  { revalidate: 300, tags: ['prompts'] }
);

export async function getPromptCount(tab = 'All'): Promise<number> {
  const key = `count:${tab}`;
  const cached = getMemCache<number>(key);
  if (cached !== undefined) return cached;
  const res = await _fetchPromptCount(tab);
  return setMemCache(key, res);
}

/** Cached per-tab published counts for filter pills & sidebar badges */
const _fetchTabCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const entries = await Promise.all(
      GALLERY_TABS.map(async (tab) => [tab, await getPromptCount(tab)] as const)
    );
    return Object.fromEntries(entries);
  },
  ['prompts-tab-counts'],
  { revalidate: 300, tags: ['prompts'] }
);

export async function getTabCounts(): Promise<Record<string, number>> {
  const key = 'tab-counts';
  const cached = getMemCache<Record<string, number>>(key);
  if (cached) return cached;
  const res = await _fetchTabCounts();
  return setMemCache(key, res);
}

/** Public search — strictly published rows, sanitized against PostgREST injection */
export async function searchPublishedPrompts(rawQuery: string, limit = 12): Promise<DbPrompt[]> {
  const clean = sanitizeSearchQuery(rawQuery);
  if (!clean) return [];
  const pct = `%${clean}%`;
  const { data, error } = await supabase
    .from('prompts')
    .select(PUBLIC_GALLERY_COLUMNS)
    .eq('published', true)
    .or(`title.ilike.${pct},prompt_text.ilike.${pct},model.ilike.${pct},category.ilike.${pct},author_name.ilike.${pct}`)
    .order('likes', { ascending: false })
    .limit(Math.min(Math.max(1, limit), 24));
  if (error) return [];
  return (data ?? []).map(fromRow);
}

/** Public batch fetch by IDs — strictly published rows, preserves caller ordering */
export async function getPublishedPromptsByIds(rawIds: string): Promise<DbPrompt[]> {
  const ids = sanitizePromptIds(rawIds, 50);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('prompts')
    .select(PUBLIC_GALLERY_COLUMNS)
    .in('id', ids)
    .eq('published', true);
  if (error) return [];
  const map = new Map((data ?? []).map((r) => [r.id, fromRow(r)]));
  return ids.map((id) => map.get(id)).filter((x): x is DbPrompt => Boolean(x));
}

/** Public prompt detail + up to 6 same-category published prompts, cached in RAM + Next.js cache */
const _fetchPublishedPromptWithRelated = unstable_cache(
  async (rawId: string): Promise<{ prompt: DbPrompt | null; related: DbPrompt[] }> => {
    const [id] = sanitizePromptIds(rawId, 1);
    if (!id) return { prompt: null, related: [] };

    const { data: row, error } = await supabase
      .from('prompts')
      .select(PUBLIC_DETAIL_COLUMNS)
      .eq('id', id)
      .eq('published', true)
      .maybeSingle();

    if (error || !row) return { prompt: null, related: [] };

    const { data: relatedRows } = await supabase
      .from('prompts')
      .select(PUBLIC_GALLERY_COLUMNS)
      .eq('category', row.category)
      .eq('published', true)
      .neq('id', id)
      .order('featured', { ascending: false })
      .order('likes', { ascending: false })
      .limit(6);

    return {
      prompt: fromRow(row),
      related: (relatedRows ?? []).map(fromRow),
    };
  },
  ['prompt-detail-with-related'],
  { revalidate: 300, tags: ['prompts'] }
);

export async function getPublishedPromptWithRelated(
  rawId: string
): Promise<{ prompt: DbPrompt | null; related: DbPrompt[] }> {
  const key = `detail:${rawId}`;
  const cached = getMemCache<{ prompt: DbPrompt | null; related: DbPrompt[] }>(key);
  if (cached) return cached;
  const res = await _fetchPublishedPromptWithRelated(rawId);
  return setMemCache(key, res);
}

/** Admin only — fetches all rows (no cache) */
export async function getAllPrompts(): Promise<DbPrompt[]> {
  const PAGE = 1000;
  const all: DbPrompt[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data.map(fromRow));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export async function getPromptById(id: string): Promise<DbPrompt | undefined> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : undefined;
}

export async function searchPrompts(query: string): Promise<DbPrompt[]> {
  const clean = sanitizeSearchQuery(query);
  if (!clean) return [];
  const q = `%${clean}%`;
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .or(`prompt_text.ilike.${q},model.ilike.${q},category.ilike.${q},author_name.ilike.${q}`);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function createPrompt(
  data: Omit<DbPrompt, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DbPrompt> {
  const id  = 'p' + crypto.randomBytes(8).toString('hex');
  const now = new Date().toISOString();
  const row = {
    ...toRow({ ...data, id }),
    created_at: now,
    updated_at: now,
    featured:   data.featured ?? false,
    published:  data.published ?? true,
  };
  const { data: inserted, error } = await supabase
    .from('prompts')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  clearPromptsMemCache();
  return fromRow(inserted);
}

export async function updatePrompt(
  id: string,
  data: Partial<DbPrompt>
): Promise<DbPrompt | null> {
  const row = { ...toRow(data), updated_at: new Date().toISOString() };
  const { data: updated, error } = await supabase
    .from('prompts')
    .update(row)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  clearPromptsMemCache();
  return updated ? fromRow(updated) : null;
}

export async function deletePrompt(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('prompts')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  clearPromptsMemCache();
  return (count ?? 0) > 0;
}

export async function bulkDeletePrompts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const { error, count } = await supabase
    .from('prompts')
    .delete({ count: 'exact' })
    .in('id', ids);
  if (error) throw new Error(error.message);
  clearPromptsMemCache();
  return count ?? 0;
}

export async function bulkUpdatePrompts(
  ids: string[],
  patch: Partial<Pick<DbPrompt, 'featured' | 'published' | 'category' | 'model' | 'tab'>>
): Promise<number> {
  if (ids.length === 0) return 0;
  const row = { ...toRow(patch), updated_at: new Date().toISOString() };
  const { error, count } = await supabase
    .from('prompts')
    .update(row, { count: 'exact' })
    .in('id', ids);
  if (error) throw new Error(error.message);
  clearPromptsMemCache();
  return count ?? 0;
}

export type AdminPromptStatus = 'all' | 'published' | 'draft' | 'featured';
export type AdminPromptSort = 'newest' | 'oldest' | 'likes' | 'views';

export interface AdminPromptsQuery {
  q?: string;
  model?: string;
  category?: string;
  status?: AdminPromptStatus;
  hasCode?: boolean;
  sort?: AdminPromptSort;
  page?: number;
  limit?: number;
}

/** Server-side filtered, sorted, and paginated admin prompt query */
export async function getAdminPromptsPaginated({
  q = '',
  model = '',
  category = '',
  status = 'all',
  hasCode,
  sort = 'newest',
  page = 1,
  limit = 20,
}: AdminPromptsQuery = {}): Promise<{ items: DbPrompt[]; total: number }> {
  let query = supabase.from('prompts').select('*', { count: 'exact' });

  const cleanQ = sanitizeSearchQuery(q);
  if (cleanQ) {
    const pct = `%${cleanQ}%`;
    query = query.or(
      `title.ilike.${pct},prompt_text.ilike.${pct},model.ilike.${pct},category.ilike.${pct},author_name.ilike.${pct},handle.ilike.${pct}`
    );
  }
  if (model) query = query.eq('model', model);
  if (category) query = query.eq('category', category);
  if (status === 'published') query = query.eq('published', true);
  else if (status === 'draft') query = query.eq('published', false);
  else if (status === 'featured') query = query.eq('featured', true);
  if (hasCode === true) query = query.eq('has_code', true);

  if (sort === 'oldest') query = query.order('created_at', { ascending: true });
  else if (sort === 'likes') query = query.order('likes', { ascending: false }).order('created_at', { ascending: false });
  else if (sort === 'views') query = query.order('views', { ascending: false }).order('created_at', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const from = (page - 1) * limit;
  const { data, count, error } = await query.range(from, from + limit - 1);
  if (error) throw new Error(error.message);

  return {
    items: (data ?? []).map(fromRow),
    total: count ?? 0,
  };
}

/** Lightweight ID set fetch for fast deduplication during bulk import */
export async function getExistingPromptIds(): Promise<Set<string>> {
  const PAGE = 1000;
  const ids = new Set<string>();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('prompts')
      .select('id')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (typeof row.id === 'string') ids.add(row.id);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return ids;
}

/** Batch insert prompts in chunks of 100 for reliable bulk imports */
export async function createPromptsBatch(
  items: Array<Omit<DbPrompt, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<number> {
  if (items.length === 0) return 0;
  const BATCH = 100;
  let inserted = 0;

  for (let i = 0; i < items.length; i += BATCH) {
    const now = new Date().toISOString();
    const rows = items.slice(i, i + BATCH).map((data) => {
      const id = 'p' + crypto.randomBytes(8).toString('hex');
      return {
        ...toRow({ ...data, id }),
        created_at: now,
        updated_at: now,
        featured: data.featured ?? false,
        published: data.published ?? true,
      };
    });
    const { error } = await supabase.from('prompts').insert(rows);
    if (error) throw new Error(error.message);
    inserted += rows.length;
  }
  clearPromptsMemCache();
  return inserted;
}

/** Helper to fetch minimal prompt columns across all rows in parallel pages */
async function fetchPromptColumnPages<T>(columns: string, totalHint?: number): Promise<T[]> {
  const PAGE = 1000;
  if (typeof totalHint === 'number' && totalHint >= 0) {
    if (totalHint === 0) return [];
    const pageCount = Math.ceil(totalHint / PAGE);
    const results = await Promise.all(
      Array.from({ length: pageCount }, async (_, idx) => {
        const from = idx * PAGE;
        const { data, error } = await supabase
          .from('prompts')
          .select(columns)
          .range(from, from + PAGE - 1);
        if (error) throw new Error(error.message);
        return (data ?? []) as T[];
      })
    );
    return results.flat();
  }

  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('prompts')
      .select(columns)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export interface ModelBreakdownItem {
  model: string;
  count: number;
  published: number;
  featured: number;
}

export interface SyncRunSummary {
  id: number;
  startedAt: string;
  sort: string | null;
  scanned: number;
  inserted: number;
  skipped: number;
  fallback: number;
  uploaded: number;
  dryRun: boolean;
}

export interface AdminDashboardStats {
  totalPrompts: number;
  publishedCount: number;
  draftCount: number;
  featuredCount: number;
  categoriesCount: number;
  totalLikes: number;
  totalViews: number;
  modelBreakdown: ModelBreakdownItem[];
  recentPrompts: DbPrompt[];
  topPrompts: DbPrompt[];
  recentSyncRuns: SyncRunSummary[];
}

/** Exact database-wide aggregates for the Admin Dashboard */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [totalRes, pubRes, draftRes, featRes, catRes, recentRes, topRes] = await Promise.all([
    supabase.from('prompts').select('id', { count: 'exact', head: true }),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('published', false),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('featured', true),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('prompts').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.from('prompts').select('*').order('likes', { ascending: false }).limit(5),
  ]);

  if (totalRes.error) throw new Error(totalRes.error.message);
  const totalPrompts = totalRes.count ?? 0;

  interface StatRow {
    model: string | null;
    likes: number | null;
    views: number | null;
    published: boolean | null;
    featured: boolean | null;
  }

  const statRows = await fetchPromptColumnPages<StatRow>(
    'model, likes, views, published, featured',
    totalPrompts
  );

  const modelMap = new Map<string, ModelBreakdownItem>();
  let totalLikes = 0;
  let totalViews = 0;

  for (const r of statRows) {
    const modelName = r.model || 'Unknown';
    totalLikes += r.likes ?? 0;
    totalViews += r.views ?? 0;

    const entry = modelMap.get(modelName) ?? {
      model: modelName,
      count: 0,
      published: 0,
      featured: 0,
    };
    entry.count += 1;
    if (r.published !== false) entry.published += 1;
    if (r.featured === true) entry.featured += 1;
    modelMap.set(modelName, entry);
  }

  const modelBreakdown = [...modelMap.values()].sort((a, b) => b.count - a.count);

  let recentSyncRuns: SyncRunSummary[] = [];
  try {
    const { data: syncData, error: syncErr } = await supabase
      .from('sync_runs')
      .select('id, started_at, sort, scanned, inserted, skipped, fallback, uploaded, dry_run')
      .order('created_at', { ascending: false })
      .limit(5);
    if (!syncErr && syncData) {
      recentSyncRuns = syncData.map((r) => ({
        id: r.id,
        startedAt: r.started_at,
        sort: r.sort,
        scanned: r.scanned ?? 0,
        inserted: r.inserted ?? 0,
        skipped: r.skipped ?? 0,
        fallback: r.fallback ?? 0,
        uploaded: r.uploaded ?? 0,
        dryRun: Boolean(r.dry_run),
      }));
    }
  } catch {
    // Non-fatal if sync_runs table has not been created yet
  }

  return {
    totalPrompts,
    publishedCount: pubRes.count ?? 0,
    draftCount: draftRes.count ?? 0,
    featuredCount: featRes.count ?? 0,
    categoriesCount: catRes.count ?? 0,
    totalLikes,
    totalViews,
    modelBreakdown,
    recentPrompts: (recentRes.data ?? []).map(fromRow),
    topPrompts: (topRes.data ?? []).map(fromRow),
    recentSyncRuns,
  };
}

/** Exact prompt counts grouped by category name */
export async function getCategoryPromptCounts(): Promise<Record<string, number>> {
  const { count, error } = await supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  const rows = await fetchPromptColumnPages<{ category: string | null }>('category', count ?? 0);
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const c = (r.category || '').trim();
    if (c) counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at }));
}

export async function createCategory(name: string): Promise<DbCategory> {
  const id = 'cat_' + crypto.randomBytes(4).toString('hex');
  const { data, error } = await supabase
    .from('categories')
    .insert({ id, name: name.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, createdAt: data.created_at };
}

export async function updateCategory(id: string, name: string): Promise<DbCategory | null> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { id: data.id, name: data.name, createdAt: data.created_at } : null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('categories')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
