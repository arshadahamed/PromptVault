import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const PROMPTS_TS = path.join(process.cwd(), 'data', 'prompts.ts');
const IMG_DIR = path.join(process.cwd(), 'public', 'images');

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

interface DB {
  prompts: DbPrompt[];
  categories: DbCategory[];
}

function readDB(): DB {
  if (!fs.existsSync(DB_PATH)) {
    const empty: DB = { prompts: [], categories: [] };
    writeDB(empty);
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(db: DB): void {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

// ── Prompts ──────────────────────────────────────────────────────────────────

export function getAllPrompts(): DbPrompt[] {
  return readDB().prompts;
}

export function getPromptById(id: string): DbPrompt | undefined {
  return readDB().prompts.find((p) => p.id === id);
}

export function getPromptsByTab(tab: string): DbPrompt[] {
  const all = readDB().prompts;
  return tab === 'All' ? all : all.filter((p) => p.tab === tab);
}

export function searchPrompts(query: string): DbPrompt[] {
  const q = query.toLowerCase();
  return readDB().prompts.filter(
    (p) =>
      p.promptText.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
}

export function createPrompt(data: Omit<DbPrompt, 'id' | 'createdAt' | 'updatedAt'>): DbPrompt {
  const db = readDB();
  const now = new Date().toISOString();
  const prompt: DbPrompt = {
    ...data,
    featured: data.featured ?? false,
    published: data.published ?? true,
    id: 'p' + crypto.randomBytes(8).toString('hex'),
    createdAt: now,
    updatedAt: now,
  };
  db.prompts.push(prompt);
  writeDB(db);
  regeneratePromptTs(db);
  return prompt;
}

export function bulkDeletePrompts(ids: string[]): number {
  const db = readDB();
  const before = db.prompts.length;
  const set = new Set(ids);
  db.prompts = db.prompts.filter((p) => !set.has(p.id));
  const removed = before - db.prompts.length;
  if (removed > 0) { writeDB(db); regeneratePromptTs(db); }
  return removed;
}

export function updatePrompt(id: string, data: Partial<DbPrompt>): DbPrompt | null {
  const db = readDB();
  const idx = db.prompts.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  db.prompts[idx] = { ...db.prompts[idx], ...data, id, updatedAt: new Date().toISOString() };
  writeDB(db);
  regeneratePromptTs(db);
  return db.prompts[idx];
}

export function deletePrompt(id: string): boolean {
  const db = readDB();
  const before = db.prompts.length;
  db.prompts = db.prompts.filter((p) => p.id !== id);
  if (db.prompts.length === before) return false;
  writeDB(db);
  regeneratePromptTs(db);
  return true;
}

// ── Categories ────────────────────────────────────────────────────────────────

export function getAllCategories(): DbCategory[] {
  return readDB().categories;
}

export function createCategory(name: string): DbCategory {
  const db = readDB();
  const cat: DbCategory = {
    id: 'cat_' + crypto.randomBytes(4).toString('hex'),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  db.categories.push(cat);
  writeDB(db);
  return cat;
}

export function updateCategory(id: string, name: string): DbCategory | null {
  const db = readDB();
  const cat = db.categories.find((c) => c.id === id);
  if (!cat) return null;
  cat.name = name.trim();
  writeDB(db);
  return cat;
}

export function deleteCategory(id: string): boolean {
  const db = readDB();
  const before = db.categories.length;
  db.categories = db.categories.filter((c) => c.id !== id);
  if (db.categories.length === before) return false;
  writeDB(db);
  return true;
}

// ── Regenerate data/prompts.ts ────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
}

function avatarColor(name: string): string {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

export function regeneratePromptTs(db?: DB): void {
  // Only published prompts go to gallery; featured ones sort first
  const all = (db || readDB()).prompts;
  const prompts = all
    .filter((p) => p.published !== false)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  const total = prompts.length;
  const lines: string[] = [
    `import type { Prompt } from '@/lib/types';`,
    ``,
    `export const prompts: Prompt[] = [`,
  ];

  prompts.forEach((p, i) => {
    // Prefer same-category prompts; fall back to others for variety
    const sameCategory = prompts.filter((q) => q.category === p.category && q.id !== p.id);
    const others       = prompts.filter((q) => q.category !== p.category && q.id !== p.id);
    const pool = sameCategory.length >= 3 ? sameCategory : [...sameCategory, ...others];
    const relIds = pool.length === 0 ? [] :
      [0, Math.floor(pool.length / 3) || 1, Math.floor((2 * pool.length) / 3) || 2]
        .slice(0, Math.min(3, pool.length))
        .map((idx) => pool[Math.min(idx, pool.length - 1)].id);
    const authorName = p.authorName || 'User';
    const handle = (p.handle || '').replace(/^@/, '');
    lines.push(`  {`);
    lines.push(`    id: ${JSON.stringify(p.id)},`);
    lines.push(`    promptText: ${JSON.stringify(p.promptText)},`);
    lines.push(`    model: ${JSON.stringify(p.model)} as any,`);
    lines.push(`    tab: ${JSON.stringify(p.tab)} as any,`);
    lines.push(`    category: ${JSON.stringify(p.category)} as any,`);
    lines.push(`    localImg: ${JSON.stringify(p.localImg)},`);
    lines.push(`    gradientFrom: ${JSON.stringify(p.gradientFrom)},`);
    lines.push(`    gradientTo: ${JSON.stringify(p.gradientTo)},`);
    lines.push(`    aspectRatio: ${JSON.stringify(p.aspectRatio)},`);
    lines.push(`    author: { name: ${JSON.stringify(authorName)}, handle: ${JSON.stringify('@' + handle)}, initials: ${JSON.stringify(initials(authorName))}, avatarColor: ${JSON.stringify(avatarColor(authorName))} },`);
    lines.push(`    likes: ${p.likes || 0},`);
    lines.push(`    views: ${p.views || 0},`);
    lines.push(`    createdAt: ${JSON.stringify(p.createdAt.slice(0, 10))},`);
    lines.push(`    relatedIds: ${JSON.stringify(relIds)},`);
    lines.push(`  },`);
  });

  lines.push(`];`);
  lines.push(``);
  lines.push(`export function getPromptById(id: string) { return prompts.find((p) => p.id === id); }`);
  lines.push(`export function getRelatedPrompts(ids: string[]) { return ids.map((id) => getPromptById(id)).filter(Boolean) as typeof prompts; }`);
  lines.push(`export function getPromptsByTab(tab: string) { return tab === 'All' ? prompts : prompts.filter((p) => p.tab === tab); }`);
  lines.push(``);

  fs.writeFileSync(PROMPTS_TS, lines.join('\n'));
}

// ── Image helpers ─────────────────────────────────────────────────────────────

export function saveUploadedImage(buffer: Buffer, ext: string): string {
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
  const filename = `upload_${crypto.randomBytes(8).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(IMG_DIR, filename), buffer);
  return `/images/${filename}`;
}
