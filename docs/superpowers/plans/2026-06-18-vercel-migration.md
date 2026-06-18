# Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate PromptVault from file-based storage (`data/db.json`, `data/settings.json`, `public/images/`) to Supabase PostgreSQL + Cloudflare R2 so the app deploys and runs fully on Vercel.

**Architecture:** Server-side db/settings calls become async Supabase queries; image uploads go to Cloudflare R2 (S3-compatible); the gallery home page is converted from a `'use client'` component to an async server component that passes prompts as props to a new `GalleryClient` client component.

**Tech Stack:** `@supabase/supabase-js`, `@aws-sdk/client-s3`, Next.js 16 App Router, Supabase PostgreSQL, Cloudflare R2.

## Global Constraints

- Node.js 20+, Next.js 16.2.9 (App Router only — no Pages Router).
- All database calls MUST be async/await — Supabase client is promise-based.
- `DbPrompt` interface in `lib/db.ts` stays identical — only implementation changes.
- `SiteSettings` interface in `lib/settings.ts` stays identical.
- `Prompt` type in `lib/types.ts` is NOT modified.
- API route paths and response shapes are NOT changed.
- All `.env.local` variables must also be added to Vercel dashboard before deploying.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/supabase.ts` | Supabase service-role client singleton |
| Create | `lib/r2.ts` | Cloudflare R2 S3 client + bucket/URL constants |
| Rewrite | `lib/db.ts` | All sync fs/JSON ops → async Supabase queries |
| Rewrite | `lib/settings.ts` | Sync fs/JSON → async Supabase single-row upsert |
| Modify | `app/(gallery)/page.tsx` | Remove `'use client'`; async server component; fetch from Supabase |
| Create | `app/(gallery)/GalleryClient.tsx` | Client component: tab/sort/filter state (moved from page.tsx) |
| Modify | `app/(gallery)/prompt/[id]/page.tsx` | Fetch prompt + related from Supabase; pass as props |
| Modify | `components/prompt/PromptDetail.tsx` | Accept `related: Prompt[]` prop instead of fetching from static file |
| Modify | `app/(gallery)/layout.tsx` | `await getSettings()` |
| Modify | `app/layout.tsx` | `await getSettings()` |
| Modify | `app/api/admin/prompts/route.ts` | `await` all db calls |
| Modify | `app/api/admin/prompts/[id]/route.ts` | `await` all db calls |
| Modify | `app/api/admin/prompts/bulk/route.ts` | `await bulkDeletePrompts()` |
| Modify | `app/api/admin/categories/route.ts` | `await` all db calls |
| Modify | `app/api/admin/categories/[id]/route.ts` | `await` all db calls |
| Modify | `app/api/admin/export/route.ts` | `await getAllPrompts()` |
| Modify | `app/api/admin/import/route.ts` | `await getAllPrompts()`, `await createPrompt()` |
| Modify | `app/api/admin/settings/route.ts` | `await` getSettings/saveSettings |
| Modify | `app/api/admin/upload/route.ts` | Replace `saveUploadedImage()` with R2 `PutObjectCommand` |
| Modify | `app/api/promo/route.ts` | `await getSettings()` |
| Create | `scripts/migrate-to-supabase.mjs` | One-time migration: db.json + settings.json → Supabase; images → R2 |

---

### Task 1: Install Packages + Create Supabase and R2 Clients

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/r2.ts`

**Interfaces:**
- Produces: `supabase` (Supabase client), `r2` (S3Client), `R2_BUCKET`, `R2_PUBLIC_URL` — consumed by Tasks 2, 3, 7, 8.

- [ ] **Step 1: Install packages**

```bash
cd d:\Freelance\New\meigen-gallery
npm install @supabase/supabase-js @aws-sdk/client-s3
```

Expected: packages added to node_modules, package.json updated.

- [ ] **Step 2: Create lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

export const supabase = createClient(url, key);
```

- [ ] **Step 3: Create lib/r2.ts**

```typescript
import { S3Client } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET     = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
```

- [ ] **Step 4: Add env var placeholders to .env.local**

Open `.env.local` (create it if it doesn't exist) and add these lines below the existing vars:

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLOUDFLARE_ACCOUNT_ID=YOUR_ACCOUNT_ID
R2_ACCESS_KEY_ID=YOUR_KEY_ID
R2_SECRET_ACCESS_KEY=YOUR_SECRET
R2_BUCKET_NAME=promptvault-images
R2_PUBLIC_URL=https://pub-XXXX.r2.dev
```

Leave the real values empty for now — they'll be filled in during Task 9 (deploy).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase.ts lib/r2.ts package.json package-lock.json
git commit -m "feat: add Supabase and R2 client singletons"
```

---

### Task 2: Rewrite lib/db.ts

**Files:**
- Rewrite: `lib/db.ts`

**Interfaces:**
- Consumes: `supabase` from `lib/supabase.ts`
- Produces: all same function names as before, now `async` — `getAllPrompts(): Promise<DbPrompt[]>`, `getPromptById(id): Promise<DbPrompt | undefined>`, `searchPrompts(query): Promise<DbPrompt[]>`, `createPrompt(data): Promise<DbPrompt>`, `updatePrompt(id, data): Promise<DbPrompt | null>`, `deletePrompt(id): Promise<boolean>`, `bulkDeletePrompts(ids): Promise<number>`, `getAllCategories(): Promise<DbCategory[]>`, `createCategory(name): Promise<DbCategory>`, `updateCategory(id, name): Promise<DbCategory | null>`, `deleteCategory(id): Promise<boolean>`

- [ ] **Step 1: Replace lib/db.ts entirely**

Write the following content to `lib/db.ts`:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in lib/db.ts (API routes will have errors until Task 4 — that's OK).

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: rewrite lib/db.ts with async Supabase queries"
```

---

### Task 3: Rewrite lib/settings.ts

**Files:**
- Rewrite: `lib/settings.ts`

**Interfaces:**
- Consumes: `supabase` from `lib/supabase.ts`
- Produces: `getSettings(): Promise<SiteSettings>`, `saveSettings(data): Promise<SiteSettings>` — same interface, now async

- [ ] **Step 1: Replace lib/settings.ts entirely**

```typescript
import { supabase } from './supabase';

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  logoText: string;
  logoImageUrl: string;
  faviconUrl: string;
  primaryColor: string;
  metaTitle: string;
  metaDescription: string;
  footerCopyright: string;
  footerLinks: { label: string; href: string }[];
  socialLinks: { twitter: string; github: string; instagram: string };
  announcementBar: string;
  adminName: string;
  adminTagline: string;
  loginBrandName: string;
  loginTagline: string;
  promoEnabled: boolean;
  promoTitle: string;
  promoDescription: string;
  promoEmoji1: string;
  promoEmoji2: string;
  promoGradientFrom: string;
  promoGradientTo: string;
  promoCtaText: string;
  promoCtaUrl: string;
  updatedAt: string;
}

export async function getSettings(): Promise<SiteSettings> {
  const { data } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 1)
    .maybeSingle();
  if (!data) return defaultSettings();
  return { ...defaultSettings(), ...(data.data as Partial<SiteSettings>) };
}

export async function saveSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const updated: SiteSettings = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await supabase
    .from('settings')
    .upsert({ id: 1, data: updated, updated_at: updated.updatedAt });
  return updated;
}

function defaultSettings(): SiteSettings {
  return {
    siteName: 'PromptVault',
    siteTagline: 'Free AI Prompt Gallery',
    siteDescription: 'Browse 2000+ free AI prompts for ChatGPT, Midjourney, Nanobanana, and more.',
    logoText: 'P',
    logoImageUrl: '',
    faviconUrl: '',
    primaryColor: '#7c3aed',
    metaTitle: 'PromptVault — Free AI Prompt Gallery',
    metaDescription: 'Browse 2000+ free AI prompts for ChatGPT, Midjourney, Nanobanana, and more.',
    footerCopyright: '© 2025 PromptVault. All rights reserved.',
    footerLinks: [
      { label: 'Terms', href: '#terms' },
      { label: 'Privacy', href: '#privacy' },
    ],
    socialLinks: { twitter: '', github: '', instagram: '' },
    announcementBar: '',
    adminName: 'PromptVault',
    adminTagline: 'Admin Studio',
    loginBrandName: 'PromptVault',
    loginTagline: 'Prompt Studio',
    promoEnabled: true,
    promoTitle: 'FIFA World Cup 2026 ⚽',
    promoDescription: 'Ronaldo, Messi & epic football art — explore the World Cup collection',
    promoEmoji1: '⚽',
    promoEmoji2: '🏆',
    promoGradientFrom: '#064e3b',
    promoGradientTo: '#d97706',
    promoCtaText: 'Explore now',
    promoCtaUrl: '#',
    updatedAt: '',
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/settings.ts
git commit -m "feat: rewrite lib/settings.ts with async Supabase single-row storage"
```

---

### Task 4: Update All API Routes (Add await)

**Files:**
- Modify: `app/api/admin/prompts/route.ts`
- Modify: `app/api/admin/prompts/[id]/route.ts`
- Modify: `app/api/admin/prompts/bulk/route.ts`
- Modify: `app/api/admin/categories/route.ts`
- Modify: `app/api/admin/categories/[id]/route.ts`
- Modify: `app/api/admin/export/route.ts`
- Modify: `app/api/admin/import/route.ts`
- Modify: `app/api/admin/settings/route.ts`
- Modify: `app/api/promo/route.ts`
- Modify: `app/(gallery)/layout.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: async `getAllPrompts`, `createPrompt`, `searchPrompts`, `getPromptById`, `updatePrompt`, `deletePrompt`, `bulkDeletePrompts`, `getAllCategories`, `createCategory`, `updateCategory`, `deleteCategory`, `getSettings`, `saveSettings` from Tasks 2 and 3.
- Produces: all API routes working correctly with Supabase data.

- [ ] **Step 1: Update app/api/admin/prompts/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts, createPrompt, searchPrompts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const q        = req.nextUrl.searchParams.get('q') || '';
  const model    = req.nextUrl.searchParams.get('model') || '';
  const category = req.nextUrl.searchParams.get('category') || '';
  const page     = parseInt(req.nextUrl.searchParams.get('page')  || '1');
  const limit    = parseInt(req.nextUrl.searchParams.get('limit') || '20');

  let prompts = q ? await searchPrompts(q) : await getAllPrompts();
  if (model)    prompts = prompts.filter((p) => p.model    === model);
  if (category) prompts = prompts.filter((p) => p.category === category);

  prompts = [...prompts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = prompts.length;
  const items = prompts.slice((page - 1) * limit, page * limit);
  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const data   = await req.json();
  const prompt = await createPrompt({
    promptText:   data.promptText   || '',
    imageUrl:     data.imageUrl     || '',
    localImg:     data.localImg     || '',
    authorName:   data.authorName   || 'User',
    handle:       data.handle       || '',
    model:        data.model        || 'GPT Image',
    category:     data.category     || 'ChatGPT',
    tab:          data.tab          || 'GPT Image',
    likes:        data.likes        || 0,
    views:        data.views        || 0,
    gradientFrom: data.gradientFrom || '#b4d4f5',
    gradientTo:   data.gradientTo   || '#f5d4b4',
    aspectRatio:  data.aspectRatio  || '4/3',
  });
  return NextResponse.json(prompt, { status: 201 });
}
```

- [ ] **Step 2: Update app/api/admin/prompts/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPromptById, updatePrompt, deletePrompt } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id }   = await params;
  const prompt   = await getPromptById(id);
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(prompt);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id }  = await params;
  const data    = await req.json();
  const updated = await updatePrompt(id, data);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id } = await params;
  const ok     = await deletePrompt(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Update app/api/admin/prompts/bulk/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { bulkDeletePrompts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });

  const removed = await bulkDeletePrompts(ids);
  return NextResponse.json({ removed });
}
```

- [ ] **Step 4: Update app/api/admin/categories/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, createCategory } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  return NextResponse.json(await getAllCategories());
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const cat = await createCategory(name);
  return NextResponse.json(cat, { status: 201 });
}
```

- [ ] **Step 5: Update app/api/admin/categories/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { updateCategory, deleteCategory } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id }   = await params;
  const { name } = await req.json();
  const cat      = await updateCategory(id, name);
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cat);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id } = await params;
  const ok     = await deleteCategory(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Update app/api/admin/export/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const format  = req.nextUrl.searchParams.get('format') || 'json';
  const prompts = await getAllPrompts();

  if (format === 'csv') {
    const cols   = ['id','promptText','model','category','tab','authorName','handle','likes','views','featured','published','createdAt'];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows   = [
      cols.join(','),
      ...prompts.map((p: Record<string, unknown>) => cols.map((c) => escape(p[c])).join(',')),
    ];
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="prompts-${Date.now()}.csv"`,
      },
    });
  }

  const json = JSON.stringify({ prompts, exportedAt: new Date().toISOString() }, null, 2);
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="prompts-backup-${Date.now()}.json"`,
    },
  });
}
```

- [ ] **Step 7: Update app/api/admin/import/route.ts**

```typescript
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
```

- [ ] **Step 8: Update app/api/admin/settings/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSettings, saveSettings } from '@/lib/settings';

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  return NextResponse.json(await getSettings());
}

export async function PUT(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const body    = await req.json();
  const updated = await saveSettings(body);
  return NextResponse.json(updated);
}
```

- [ ] **Step 9: Update app/api/promo/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    logoText:          s.logoText,
    loginBrandName:    s.loginBrandName,
    loginTagline:      s.loginTagline,
    promoEnabled:      s.promoEnabled,
    promoTitle:        s.promoTitle,
    promoDescription:  s.promoDescription,
    promoEmoji1:       s.promoEmoji1,
    promoEmoji2:       s.promoEmoji2,
    promoGradientFrom: s.promoGradientFrom,
    promoGradientTo:   s.promoGradientTo,
    promoCtaText:      s.promoCtaText,
    promoCtaUrl:       s.promoCtaUrl,
  });
}
```

- [ ] **Step 10: Update app/(gallery)/layout.tsx**

```typescript
import { cookies } from 'next/headers';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { MobileHeader } from '@/components/sidebar/MobileHeader';
import { ModalRoot } from '@/components/modals/ModalRoot';
import { getSettings } from '@/lib/settings';
import { verifyToken, COOKIE } from '@/lib/auth';

export default async function GalleryLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  const cookieStore = await cookies();
  const token       = cookieStore.get(COOKIE)?.value;
  const isLoggedIn  = token ? await verifyToken(token) : false;

  return (
    <AppProvider>
      <MobileHeader siteName={settings.siteName} settings={settings} isLoggedIn={isLoggedIn} />
      <div className="flex min-h-screen pt-12 md:pt-0">
        <div className="hidden md:block w-[260px] shrink-0" />
        <div className="hidden md:block">
          <Sidebar settings={settings} isLoggedIn={isLoggedIn} />
        </div>
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
      <ModalRoot />
    </AppProvider>
  );
}
```

- [ ] **Step 11: Update app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import './globals.css';
import { getSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title:       s.metaTitle       || s.siteName || 'PromptVault',
    description: s.metaDescription || s.siteDescription || 'Browse free AI prompts.',
    icons:       s.faviconUrl ? { icon: s.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 12: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors (Tasks 5 and 6 will still show errors about `data/prompts` import — that's resolved in the next tasks).

- [ ] **Step 13: Commit**

```bash
git add app/api app/(gallery)/layout.tsx app/layout.tsx
git commit -m "feat: update all API routes and layouts to await async db/settings calls"
```

---

### Task 5: Restructure Gallery Page

**Files:**
- Rewrite: `app/(gallery)/page.tsx`
- Create: `app/(gallery)/GalleryClient.tsx`

**Interfaces:**
- Consumes: `getAllPrompts(): Promise<DbPrompt[]>` from `lib/db.ts`
- Produces: `GalleryClient({ prompts: Prompt[] })` — client component with tab/sort state

- [ ] **Step 1: Create app/(gallery)/GalleryClient.tsx**

```typescript
'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Prompt, Tab, Sort } from '@/lib/types';
import { TabBar } from '@/components/layout/TabBar';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { BottomDock } from '@/components/layout/BottomDock';
import { FifaPromoCard } from '@/components/layout/FifaPromoCard';

export function GalleryClient({ prompts }: { prompts: Prompt[] }) {
  const [tab,  setTab]  = useState<Tab>('All');
  const [sort, setSort] = useState<Sort>('Featured');

  const filtered = useMemo(() => {
    const base = tab === 'All' ? prompts : prompts.filter((p) => p.tab === tab);
    if (sort === 'Popular') return [...base].sort((a, b) => b.likes - a.likes);
    if (sort === 'Newest')  return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return base;
  }, [prompts, tab, sort]);

  return (
    <div className="relative">
      <div className="sr-only">
        <h1>Free GPT Image 2 &amp; AI Prompt Gallery</h1>
        <p>Browse 750+ free AI prompts for ChatGPT, Midjourney, Gemini, Nanobanana, and more.</p>
        <nav aria-label="Quick links">
          <Link href="/?tab=ChatGPT">ChatGPT Prompts</Link>
          <Link href="/?tab=Midjourney">Midjourney Prompts</Link>
          <Link href="/?tab=Gemini">Gemini Prompts</Link>
          <Link href="/?tab=Nanobanana">Nanobanana Prompts</Link>
        </nav>
      </div>
      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-28">
        <TabBar activeTab={tab} onTab={setTab} activeSort={sort} onSort={setSort} />
        <GalleryGrid prompts={filtered} className="masonry-3" />
      </div>
      <BottomDock />
      <FifaPromoCard />
    </div>
  );
}
```

- [ ] **Step 2: Rewrite app/(gallery)/page.tsx**

```typescript
import { getAllPrompts } from '@/lib/db';
import type { DbPrompt } from '@/lib/db';
import type { Prompt } from '@/lib/types';
import { GalleryClient } from './GalleryClient';

export const revalidate = 60;

function toPrompt(p: DbPrompt): Prompt {
  const name   = p.authorName || 'Admin';
  const handle = p.handle.startsWith('@') ? p.handle : '@' + p.handle;
  const words  = name.split(/\s+/);
  const initials = words.map((w) => w[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
  const colors   = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return {
    id:           p.id,
    author:       { name, handle, initials, avatarColor: colors[h] },
    model:        p.model    as any,
    category:     p.category as any,
    tab:          p.tab      as any,
    likes:        p.likes,
    views:        p.views,
    promptText:   p.promptText,
    aspectRatio:  p.aspectRatio,
    gradientFrom: p.gradientFrom,
    gradientTo:   p.gradientTo,
    localImg:     p.localImg,
    relatedIds:   [],
    createdAt:    p.createdAt.slice(0, 10),
  };
}

export default async function Home() {
  const dbPrompts = await getAllPrompts();
  const prompts   = dbPrompts
    .filter((p) => p.published !== false)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return  1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .map(toPrompt);
  return <GalleryClient prompts={prompts} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(gallery)/page.tsx" "app/(gallery)/GalleryClient.tsx"
git commit -m "feat: convert gallery page to async server component, extract GalleryClient"
```

---

### Task 6: Update Prompt Detail Page

`PromptDetail` currently calls `getRelatedPrompts(prompt.relatedIds)` from `@/data/prompts` (static file). After migration, the static file is stale. We fix this by fetching related prompts from Supabase in the server page component and passing them as a prop to `PromptDetail`.

**Files:**
- Rewrite: `app/(gallery)/prompt/[id]/page.tsx`
- Modify: `components/prompt/PromptDetail.tsx`

**Interfaces:**
- Consumes: `supabase` from `lib/supabase.ts`, `DbPrompt` from `lib/db.ts`
- Produces: `PromptDetail({ prompt, related })` — accepts pre-fetched related prompts

- [ ] **Step 1: Update components/prompt/PromptDetail.tsx**

Remove the import of `getRelatedPrompts` and add `related` as a prop:

Find and replace in `components/prompt/PromptDetail.tsx`:

Remove this line:
```typescript
import { getRelatedPrompts } from '@/data/prompts';
```

Change the function signature from:
```typescript
export function PromptDetail({ prompt }: { prompt: Prompt }) {
```
To:
```typescript
export function PromptDetail({ prompt, related }: { prompt: Prompt; related: Prompt[] }) {
```

Remove this line:
```typescript
  const related = getRelatedPrompts(prompt.relatedIds);
```

(The `related` variable is now a prop, so the `RelatedGrid` call at the bottom still works unchanged.)

- [ ] **Step 2: Rewrite app/(gallery)/prompt/[id]/page.tsx**

```typescript
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { DbPrompt } from '@/lib/db';
import type { Prompt } from '@/lib/types';
import { PromptDetail } from '@/components/prompt/PromptDetail';

export const dynamic = 'force-dynamic';

function toPrompt(p: DbPrompt): Prompt {
  const name   = p.authorName || 'Admin';
  const handle = p.handle.startsWith('@') ? p.handle : '@' + p.handle;
  const words  = name.split(/\s+/);
  const initials = words.map((w) => w[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
  const colors   = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return {
    id:           p.id,
    author:       { name, handle, initials, avatarColor: colors[h] },
    model:        p.model    as any,
    category:     p.category as any,
    tab:          p.tab      as any,
    likes:        p.likes,
    views:        p.views,
    promptText:   p.promptText,
    aspectRatio:  p.aspectRatio,
    gradientFrom: p.gradientFrom,
    gradientTo:   p.gradientTo,
    localImg:     p.localImg,
    relatedIds:   [],
    createdAt:    p.createdAt.slice(0, 10),
  };
}

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: row } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();

  if (!row) notFound();

  const { data: relatedRows } = await supabase
    .from('prompts')
    .select('*')
    .eq('category', row.category)
    .eq('published', true)
    .neq('id', id)
    .order('featured', { ascending: false })
    .limit(3);

  const prompt  = toPrompt(row as DbPrompt);
  const related = (relatedRows ?? []).map((r) => toPrompt(r as DbPrompt));

  return <PromptDetail prompt={prompt} related={related} />;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors. (Task 7 upload route still errors — that's next.)

- [ ] **Step 4: Commit**

```bash
git add "app/(gallery)/prompt/[id]/page.tsx" components/prompt/PromptDetail.tsx
git commit -m "feat: fetch prompt and related from Supabase in detail page"
```

---

### Task 7: Update Upload Route for R2

**Files:**
- Rewrite: `app/api/admin/upload/route.ts`

**Interfaces:**
- Consumes: `r2`, `R2_BUCKET`, `R2_PUBLIC_URL` from `lib/r2.ts`
- Produces: `POST /api/admin/upload` — returns `{ localImg: "https://pub-xxx.r2.dev/upload_abc123.jpg" }`

- [ ] **Step 1: Rewrite app/api/admin/upload/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { requireAdmin } from '@/lib/admin-auth';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const MAGIC: Array<{ mime: string; ext: string; check: (b: Buffer) => boolean }> = [
  { mime: 'image/png',  ext: 'png',  check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/jpeg', ext: 'jpg',  check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/gif',  ext: 'gif',  check: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  { mime: 'image/webp', ext: 'webp', check: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const formData = await req.formData();
  const file     = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const detected = MAGIC.find((m) => m.check(buffer));
  if (!detected) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload PNG, JPEG, GIF, or WebP.' },
      { status: 400 }
    );
  }

  const filename = `upload_${crypto.randomBytes(8).toString('hex')}.${detected.ext}`;

  await r2.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         filename,
    Body:        buffer,
    ContentType: detected.mime,
  }));

  const localImg = `${R2_PUBLIC_URL}/${filename}`;
  return NextResponse.json({ localImg });
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/upload/route.ts
git commit -m "feat: upload images to Cloudflare R2 instead of local filesystem"
```

---

### Task 8: Migration Script

This script runs once locally before first Vercel deploy. It reads `data/db.json` and `data/settings.json`, inserts everything into Supabase, then uploads all images from `public/images/` to R2 and updates `local_img` URLs in Supabase.

**Files:**
- Create: `scripts/migrate-to-supabase.mjs`

**Prerequisites:** Supabase project created, R2 bucket created, `.env.local` filled with real credentials (see Task 9 Step 1).

- [ ] **Step 1: Create scripts/migrate-to-supabase.mjs**

```javascript
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..');

// Load .env.local
try {
  const env = readFileSync(join(root, '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const eq = line.indexOf('=');
    if (eq < 1 || line.startsWith('#')) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found — assume env vars already set */ }

// Validate env
const required = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','CLOUDFLARE_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME','R2_PUBLIC_URL'];
for (const k of required) {
  if (!process.env[k]) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const R2_BUCKET     = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL.replace(/\/$/, '');

// Read local data
const dbPath = join(root, 'data', 'db.json');
const db = JSON.parse(readFileSync(dbPath, 'utf8'));
const prompts    = db.prompts    || [];
const categories = db.categories || [];

const settingsPath = join(root, 'data', 'settings.json');
const settings = existsSync(settingsPath)
  ? JSON.parse(readFileSync(settingsPath, 'utf8'))
  : {};

console.log(`\n=== PromptVault → Supabase + R2 Migration ===`);
console.log(`Prompts: ${prompts.length}, Categories: ${categories.length}`);

// 1. Insert categories
console.log('\n[1/4] Inserting categories...');
let catOk = 0, catSkip = 0;
for (const cat of categories) {
  const { error } = await supabase
    .from('categories')
    .upsert({ id: cat.id, name: cat.name, created_at: cat.createdAt });
  if (error) { console.warn(`  ⚠ category ${cat.name}: ${error.message}`); catSkip++; }
  else catOk++;
}
console.log(`  ✓ ${catOk} inserted, ${catSkip} failed`);

// 2. Insert prompts (in batches of 100)
console.log('\n[2/4] Inserting prompts...');
let pOk = 0, pSkip = 0;
const BATCH = 100;
for (let i = 0; i < prompts.length; i += BATCH) {
  const batch = prompts.slice(i, i + BATCH).map((p) => ({
    id:           p.id,
    source_id:    p.sourceId   ?? null,
    prompt_text:  p.promptText || '',
    image_url:    p.imageUrl   || '',
    local_img:    p.localImg   || '',
    author_name:  p.authorName || 'Admin',
    handle:       p.handle     || '@admin',
    model:        p.model      || 'ChatGPT',
    tab:          p.tab        || 'ChatGPT',
    category:     p.category   || 'ChatGPT',
    likes:        p.likes      || 0,
    views:        p.views      || 0,
    gradient_from: p.gradientFrom || '#d4f5b4',
    gradient_to:   p.gradientTo   || '#f5b4e8',
    aspect_ratio:  p.aspectRatio  || '4/3',
    featured:     p.featured  ?? false,
    published:    p.published ?? true,
    created_at:   p.createdAt || new Date().toISOString(),
    updated_at:   p.updatedAt || new Date().toISOString(),
  }));
  const { error } = await supabase.from('prompts').upsert(batch);
  if (error) {
    console.warn(`  ⚠ batch ${i}–${i + batch.length}: ${error.message}`);
    pSkip += batch.length;
  } else {
    pOk += batch.length;
    process.stdout.write(`\r  ✓ ${pOk}/${prompts.length}`);
  }
}
console.log(`\n  Done: ${pOk} inserted, ${pSkip} failed`);

// 3. Upsert settings
console.log('\n[3/4] Upserting settings...');
const { error: sErr } = await supabase
  .from('settings')
  .upsert({ id: 1, data: settings, updated_at: settings.updatedAt || new Date().toISOString() });
if (sErr) console.warn(`  ⚠ settings: ${sErr.message}`);
else      console.log('  ✓ settings saved');

// 4. Upload images to R2 and update local_img in Supabase
const imgDir = join(root, 'public', 'images');
const imageExists = existsSync(imgDir);
if (!imageExists) {
  console.log('\n[4/4] No public/images directory found — skipping image upload');
} else {
  const files = readdirSync(imgDir);
  console.log(`\n[4/4] Uploading ${files.length} images to R2...`);
  let imgOk = 0, imgSkip = 0;

  for (const file of files) {
    try {
      const { readFileSync: rfs } = await import('fs');
      const buf  = rfs(join(imgDir, file));
      const ext  = file.split('.').pop()?.toLowerCase() || '';
      const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }[ext] || 'application/octet-stream';

      await r2.send(new PutObjectCommand({
        Bucket:      R2_BUCKET,
        Key:         file,
        Body:        buf,
        ContentType: mime,
      }));

      const newUrl = `${R2_PUBLIC_URL}/${file}`;
      await supabase
        .from('prompts')
        .update({ local_img: newUrl })
        .eq('local_img', `/images/${file}`);

      imgOk++;
      if (imgOk % 50 === 0) process.stdout.write(`\r  ✓ ${imgOk}/${files.length}`);
    } catch (e) {
      console.warn(`\n  ⚠ ${file}: ${e.message}`);
      imgSkip++;
    }
  }
  console.log(`\n  Done: ${imgOk} uploaded, ${imgSkip} failed`);
}

console.log('\n=== Migration complete ===\n');
```

- [ ] **Step 2: Run a dry-run check (without real credentials, just verify the script parses)**

```bash
node --input-type=module --eval "import './scripts/migrate-to-supabase.mjs'" 2>&1 | head -5
```

Expected: error about missing env vars (not a syntax error).

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-to-supabase.mjs
git commit -m "feat: add one-time migration script for Supabase + R2"
```

---

### Task 9: Supabase Setup + Vercel Deploy

This task has no code to write — it's the cloud setup and deployment sequence. Complete these steps in order.

- [ ] **Step 1: Create Supabase project**

1. Go to [supabase.com](https://supabase.com) → "New project"
2. Name it `promptvault`, choose a region close to your Vercel region (e.g. `us-east-1`)
3. Note the **Project URL** and **service_role key** (Settings → API)

- [ ] **Step 2: Run SQL schema in Supabase**

In Supabase dashboard → SQL Editor, run:

```sql
CREATE TABLE prompts (
  id            TEXT PRIMARY KEY,
  source_id     TEXT,
  prompt_text   TEXT NOT NULL,
  image_url     TEXT DEFAULT '',
  local_img     TEXT DEFAULT '',
  author_name   TEXT DEFAULT 'Admin',
  handle        TEXT DEFAULT '@admin',
  model         TEXT NOT NULL DEFAULT 'ChatGPT',
  tab           TEXT NOT NULL DEFAULT 'ChatGPT',
  category      TEXT NOT NULL DEFAULT 'ChatGPT',
  likes         INTEGER DEFAULT 0,
  views         INTEGER DEFAULT 0,
  gradient_from TEXT DEFAULT '#d4f5b4',
  gradient_to   TEXT DEFAULT '#f5b4e8',
  aspect_ratio  TEXT DEFAULT '4/3',
  featured      BOOLEAN DEFAULT FALSE,
  published     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE settings (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (id, data) VALUES (1, '{}');
```

- [ ] **Step 3: Create Cloudflare R2 bucket**

1. Log in to Cloudflare dashboard → R2 Object Storage → "Create bucket"
2. Name: `promptvault-images`
3. Enable **Public access** (needed for serving images without auth)
4. Copy the **public URL** (format: `https://pub-XXXX.r2.dev`)
5. Under "Manage R2 API Tokens" → create a token with **Object Read & Write** permission
6. Note: Account ID, Access Key ID, Secret Access Key

- [ ] **Step 4: Fill in .env.local with real credentials**

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciO...
CLOUDFLARE_ACCOUNT_ID=abc123def456
R2_ACCESS_KEY_ID=your_key_id
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=promptvault-images
R2_PUBLIC_URL=https://pub-XXXX.r2.dev
```

- [ ] **Step 5: Run the migration script**

```bash
node scripts/migrate-to-supabase.mjs
```

Expected output:
```
=== PromptVault → Supabase + R2 Migration ===
Prompts: 1977, Categories: XX

[1/4] Inserting categories...
  ✓ XX inserted, 0 failed

[2/4] Inserting prompts...
  ✓ 1977/1977
  Done: 1977 inserted, 0 failed

[3/4] Upserting settings...
  ✓ settings saved

[4/4] Uploading 2821 images to R2...
  ✓ 2821/2821
  Done: 2821 uploaded, 0 failed

=== Migration complete ===
```

Estimated time: 10–20 minutes (depends on upload speed for 2.1 GB).

- [ ] **Step 6: Verify in Supabase dashboard**

- Table Editor → `prompts` → should show ~1977 rows
- Table Editor → `settings` → should show 1 row with your JSON settings
- Spot-check one `local_img` value — should be `https://pub-XXXX.r2.dev/upload_abc.jpg` (not `/images/...`)

- [ ] **Step 7: Push all code to GitHub**

```bash
git push origin master
```

- [ ] **Step 8: Connect to Vercel and set env vars**

1. Go to [vercel.com](https://vercel.com) → "Add New Project" → Import from GitHub → select `PromptVault`
2. Framework preset: Next.js (auto-detected)
3. Under **Environment Variables**, add all 7 new vars plus the existing 3:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL`
   - `JWT_SECRET` (existing)
   - `ADMIN_USERNAME` (existing)
   - `ADMIN_PASSWORD` (existing)
4. Click **Deploy**

- [ ] **Step 9: Verify the deployment**

After Vercel build succeeds:
- Open the Vercel URL → gallery should load with all prompts from Supabase
- Open a prompt detail → image and related prompts should display
- Go to `/login` → log in → admin panel should work
- Admin → create a new prompt, upload an image → the new prompt should appear in gallery within 60 seconds (ISR)
- Admin → Settings → save a change → verify it reflects in the gallery

---

## Self-Review

**Spec coverage:**
- ✓ Supabase PostgreSQL for prompts, categories, settings
- ✓ Cloudflare R2 for images
- ✓ All sync db/settings calls made async
- ✓ Gallery page ISR with `revalidate = 60`
- ✓ Prompt detail page fetches live from Supabase
- ✓ Upload route sends to R2, returns R2 public URL
- ✓ Migration script handles all 3 data sources (db.json, settings.json, images)
- ✓ `data/prompts.ts` static file is no longer imported at runtime (only `PromptDetail` used it, fixed in Task 6)
- ✓ All API route paths and response shapes unchanged

**Type consistency:**
- `getAllPrompts(): Promise<DbPrompt[]>` — used correctly with `await` in all routes
- `getSettings(): Promise<SiteSettings>` — used correctly with `await` in all callers
- `PromptDetail({ prompt, related })` — both `page.tsx` and the updated component signature match
- `toPrompt(DbPrompt): Prompt` helper is duplicated in `page.tsx` and `prompt/[id]/page.tsx` — acceptable for now (3 lines of duplication avoids a shared utility file with no other callers)
