# Vercel Deployment Migration Design
**Date:** 2026-06-18  
**Project:** PromptVault  
**Goal:** Migrate file-based storage to Supabase + Cloudflare R2 so the app runs fully on Vercel.

---

## Problem

Vercel's serverless runtime has a **read-only filesystem**. The current app writes to:
- `data/db.json` — prompts and categories
- `data/settings.json` — site settings
- `public/images/` — uploaded prompt images
- `data/prompts.ts` — regenerated static TypeScript on every prompt change

None of these work on Vercel. The gallery displays fine (reads static files at deploy time) but all admin write operations silently fail.

---

## Architecture

```
Vercel (Next.js 16 App Router)
    ├── Supabase PostgreSQL  — prompts, categories, settings
    └── Cloudflare R2        — 2,821 images (2.1 GB)
```

### Why Supabase + R2
- Supabase free tier: 500 MB PostgreSQL — ample for 1,977 prompts
- Cloudflare R2 free tier: 10 GB storage, zero egress fees — covers 2.1 GB images
- Both integrate cleanly with Next.js API routes via official SDKs

---

## Database Schema (Supabase PostgreSQL)

```sql
CREATE TABLE prompts (
  id            TEXT PRIMARY KEY,
  prompt_text   TEXT NOT NULL,
  model         TEXT NOT NULL DEFAULT 'ChatGPT',
  tab           TEXT NOT NULL DEFAULT 'ChatGPT',
  category      TEXT NOT NULL DEFAULT 'ChatGPT',
  local_img     TEXT DEFAULT '',
  gradient_from TEXT DEFAULT '#d4f5b4',
  gradient_to   TEXT DEFAULT '#f5b4e8',
  aspect_ratio  TEXT DEFAULT '4/3',
  author_name   TEXT DEFAULT 'Admin',
  handle        TEXT DEFAULT '@admin',
  likes         INTEGER DEFAULT 0,
  views         INTEGER DEFAULT 0,
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

-- Single-row settings table (enforced by CHECK constraint)
CREATE TABLE settings (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Environment Variables

### New (add to Vercel dashboard + `.env.local`)
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLOUDFLARE_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=promptvault-images
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

### Existing (unchanged)
```
JWT_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
```

---

## Code Changes

### New Files
| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase service-role client singleton |
| `lib/r2.ts` | Cloudflare R2 client (AWS S3-compatible via `@aws-sdk/client-s3`) |
| `app/(gallery)/GalleryClient.tsx` | Client component: tab/sort state + filtering (extracted from page.tsx) |
| `scripts/migrate-to-supabase.mjs` | One-time migration script |

### Modified Files
| File | Change |
|------|--------|
| `lib/db.ts` | Full rewrite: `fs`/JSON → async Supabase queries. Remove `regeneratePromptTs`. |
| `lib/settings.ts` | Full rewrite: `fs`/JSON → async Supabase single-row upsert |
| `app/(gallery)/page.tsx` | Remove `'use client'`. Async server component. Fetch from Supabase. Add `revalidate = 60`. |
| `app/(gallery)/prompt/[id]/page.tsx` | Fetch prompt + related by category from Supabase |
| `app/api/admin/upload/route.ts` | Replace `saveUploadedImage()` with R2 `PutObjectCommand`. Return R2 public URL. |
| `app/api/admin/prompts/route.ts` | Add `await` to `getAllPrompts()`, `createPrompt()`, `searchPrompts()` |
| `app/api/admin/prompts/[id]/route.ts` | Add `await` to `getPromptById()`, `updatePrompt()`, `deletePrompt()` |
| `app/api/admin/prompts/bulk/route.ts` | Add `await` to `bulkDeletePrompts()` |
| `app/api/admin/categories/route.ts` | Add `await` to `getAllCategories()`, `createCategory()` |
| `app/api/admin/categories/[id]/route.ts` | Add `await` to `updateCategory()`, `deleteCategory()` |
| `app/api/admin/export/route.ts` | Add `await` to `getAllPrompts()` |
| `app/api/admin/import/route.ts` | Add `await` to `getPromptById()`, `createPrompt()` |
| `app/api/promo/route.ts` | Add `await` to `getSettings()` |
| `app/(gallery)/layout.tsx` | Add `await` to `getSettings()` |
| `app/layout.tsx` | Add `await` to `getSettings()` (already async) |

### Removed Dependencies
- `data/prompts.ts` — no longer used at runtime (kept as static reference only)
- `regeneratePromptTs()` — deleted from `lib/db.ts`
- `saveUploadedImage()` — deleted from `lib/db.ts`, replaced by R2 upload

### New npm Packages
```
@supabase/supabase-js
@aws-sdk/client-s3
```

---

## Gallery Page Restructure

**Before:** `page.tsx` is `'use client'`, imports static `data/prompts.ts`, uses `useState`/`useMemo` for filtering.

**After:**
- `page.tsx` — async server component, fetches all published prompts from Supabase, passes to `GalleryClient`
- `GalleryClient.tsx` — `'use client'`, receives prompts as props, handles tab/sort/filter (identical UX)
- `export const revalidate = 60` — Vercel rebuilds the page every 60 seconds, reflecting admin changes within 1 minute

---

## One-Time Migration Script

`scripts/migrate-to-supabase.mjs` — run locally before first Vercel deploy:

1. Read `data/db.json` → insert all 1,977 prompts into Supabase `prompts` table
2. Read `data/db.json` categories → insert into Supabase `categories` table  
3. Read `data/settings.json` → upsert into Supabase `settings` table
4. For each prompt with a `localImg` path:
   - Read file from `public/images/`
   - Upload to Cloudflare R2 with original filename
   - Update prompt's `local_img` in Supabase to the R2 public URL
5. Print summary: prompts migrated, images uploaded, errors

**Estimated runtime:** 10–20 minutes (2.1 GB image upload speed depends on internet)

---

## Deployment Steps (after implementation)

1. Create Supabase project → run SQL schema → copy URL + service role key
2. Create Cloudflare R2 bucket → enable public access → copy credentials
3. Run `node scripts/migrate-to-supabase.mjs` locally
4. Add all env vars to Vercel dashboard
5. Connect GitHub repo to Vercel → deploy
6. Verify gallery loads, admin panel works, image uploads go to R2

---

## What Does NOT Change

- JWT auth flow (login, cookie, `requireAdmin`) — untouched
- All admin UI pages (prompts, categories, import/export, settings)
- Gallery UI (cards, sidebar, modals, promo card)
- All existing API route paths and response shapes
- Theme system, branding settings
