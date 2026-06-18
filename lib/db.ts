import crypto from 'crypto';
import { supabase } from './supabase';

export interface DbPrompt {
  id: string;
  sourceId?: string;
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
}

export interface DbCategory {
  id: string;
  name: string;
  createdAt: string;
}

// ── Row mappers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): DbPrompt {
  return {
    id:           row.id,
    sourceId:     row.source_id ?? undefined,
    promptText:   row.prompt_text,
    imageUrl:     row.image_url ?? '',
    localImg:     row.local_img ?? '',
    authorName:   row.author_name ?? 'Admin',
    handle:       row.handle ?? '@admin',
    model:        row.model,
    category:     row.category,
    tab:          row.tab,
    likes:        row.likes ?? 0,
    views:        row.views ?? 0,
    gradientFrom: row.gradient_from ?? '#d4f5b4',
    gradientTo:   row.gradient_to ?? '#f5b4e8',
    aspectRatio:  row.aspect_ratio ?? '4/3',
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
    featured:     row.featured ?? false,
    published:    row.published ?? true,
  };
}

function toRow(p: Partial<DbPrompt>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (p.id !== undefined)           r.id = p.id;
  if (p.sourceId !== undefined)     r.source_id = p.sourceId;
  if (p.promptText !== undefined)   r.prompt_text = p.promptText;
  if (p.imageUrl !== undefined)     r.image_url = p.imageUrl;
  if (p.localImg !== undefined)     r.local_img = p.localImg;
  if (p.authorName !== undefined)   r.author_name = p.authorName;
  if (p.handle !== undefined)       r.handle = p.handle;
  if (p.model !== undefined)        r.model = p.model;
  if (p.category !== undefined)     r.category = p.category;
  if (p.tab !== undefined)          r.tab = p.tab;
  if (p.likes !== undefined)        r.likes = p.likes;
  if (p.views !== undefined)        r.views = p.views;
  if (p.gradientFrom !== undefined) r.gradient_from = p.gradientFrom;
  if (p.gradientTo !== undefined)   r.gradient_to = p.gradientTo;
  if (p.aspectRatio !== undefined)  r.aspect_ratio = p.aspectRatio;
  if (p.featured !== undefined)     r.featured = p.featured;
  if (p.published !== undefined)    r.published = p.published;
  return r;
}

// ── Prompts ───────────────────────────────────────────────────────────────────

export async function getAllPrompts(): Promise<DbPrompt[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
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
  const q = `%${query}%`;
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
  return updated ? fromRow(updated) : null;
}

export async function deletePrompt(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('prompts')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function bulkDeletePrompts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const { error, count } = await supabase
    .from('prompts')
    .delete({ count: 'exact' })
    .in('id', ids);
  if (error) throw new Error(error.message);
  return count ?? 0;
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
