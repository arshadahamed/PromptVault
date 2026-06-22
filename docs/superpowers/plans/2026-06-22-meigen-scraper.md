# meigen.ai Incremental Prompt Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a re-runnable Node script that pulls new prompts + images from meigen.ai into the production Supabase `prompts` table, mirroring images to Cloudflare R2.

**Architecture:** A single ESM script `scripts/scrape-meigen.mjs`. It loads existing `source_id`s from Supabase, drives meigen's `/api/images` JSON endpoint from inside a headless Chromium page (to clear Cloudflare), filters to unseen prompts, downloads each first image and uploads it to R2, then batch-upserts mapped rows. A `--dry-run` flag makes a real run safe to preview.

**Tech Stack:** Node 20 ESM, `playwright` (headless Chromium), `@supabase/supabase-js` (service role), `@aws-sdk/client-s3` (R2). All already in `package.json`.

## Global Constraints

- Script lives at `scripts/scrape-meigen.mjs`, run as `node scripts/scrape-meigen.mjs [flags]`. No build step.
- Reuse the exact `.env.local` loader block from `scripts/migrate-to-supabase.mjs` (lines 10-20). Required env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- meigen API: `GET https://www.meigen.ai/api/images?sort={newest|featured|popular}&offset=N&limit=20`. Page size 20.
- Dedup key is `source_id` (meigen `id`). DB insert uses `upsert(..., { onConflict: 'source_id' })`.
- R2 object key for an image: `"<source_id>.jpg"`. Public URL: `${R2_PUBLIC_URL}/<source_id>.jpg` (R2_PUBLIC_URL has trailing slash stripped).
- Do NOT use `playwright-extra` or `playwright-extra-plugin-stealth` (the installed stealth pkg is broken). Use plain `playwright`'s `chromium` with a desktop UA.
- New row defaults: `featured=false`, `published=true`, `likes`/`views` from stats (fallback 0), `gradient_from/to` from the pastel palette hashed by `id`, `aspect_ratio` = `"<w>/<h>"` (fallback `"4/3"`), `author_name` fallback `'Unknown'`, `handle` = raw `author.username`.
- Skip any item where `prompt` is empty/whitespace or `promptReady !== true`.
- Generated row `id`: `"p" + String(n).padStart(4,'0')` where `n` continues from the current max numeric id in the table.
- The script must be idempotent: re-running inserts nothing already present.

---

## File Structure

- **Create:** `scripts/scrape-meigen.mjs` — the entire scraper (single file, matches the existing one-file script convention in `scripts/`).
- **Create:** `scripts/scrape-meigen.test.mjs` — Node built-in test runner (`node:test`) unit tests for the pure mapping/helper functions exported from the script.
- **Reference (read-only):** `scripts/migrate-to-supabase.mjs` (env loader + client setup pattern), `lib/db.ts` (column names via `toRow`), `data/db.json` (pastel gradient palette, model→tab/category combos).

The script is structured so pure logic (mapping, palette, id sequencing, sort/flag parsing) is **exported** and unit-tested without network/DB. The `main()` orchestration (browser, Supabase, R2) runs only when the file is the entry module.

---

## Task 1: Pure helpers — model map, gradient palette, aspect ratio, id sequencing

**Files:**
- Create: `scripts/scrape-meigen.mjs` (helpers + exports only; no `main()` yet)
- Test: `scripts/scrape-meigen.test.mjs`

**Interfaces:**
- Produces (all exported from `scrape-meigen.mjs`):
  - `mapModel(meigenModel: string) => { model: string, tab: string, category: string, unmapped: boolean }`
  - `GRADIENTS: Array<[string, string]>` — 12 `[from, to]` pastel pairs
  - `gradientForId(id: string) => { gradientFrom: string, gradientTo: string }`
  - `aspectRatio(w: number|undefined, h: number|undefined) => string`
  - `makeIdSequencer(maxExistingNum: number) => () => string` — returns a function yielding `p####` ids, incrementing each call
  - `maxPromptNum(ids: string[]) => number` — largest N across `p####` ids (0 if none)

- [ ] **Step 1: Write the failing test**

```js
// scripts/scrape-meigen.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapModel, GRADIENTS, gradientForId, aspectRatio, makeIdSequencer, maxPromptNum,
} from './scrape-meigen.mjs';

test('mapModel: known models', () => {
  assert.deepEqual(mapModel('GPT Image'), { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: false });
  assert.deepEqual(mapModel('Nanobanana Pro'), { model: 'Nanobanana Pro', tab: 'Nanobanana', category: 'Nanobanana', unmapped: false });
  assert.deepEqual(mapModel('Nanobanana 2'), { model: 'Nanobanana Pro', tab: 'Nanobanana', category: 'Nanobanana', unmapped: false });
  assert.deepEqual(mapModel('Midjourney V8.1'), { model: 'Midjourney', tab: 'Midjourney', category: 'Midjourney', unmapped: false });
  assert.deepEqual(mapModel('Seedance 2.0'), { model: 'Seedance 2.0', tab: 'Seedance', category: 'Seedance', unmapped: false });
  assert.deepEqual(mapModel('Flux'), { model: 'Flux', tab: 'Flux', category: 'Flux', unmapped: false });
  assert.deepEqual(mapModel('Gemini Omni'), { model: 'Gemini', tab: 'Gemini', category: 'Gemini', unmapped: false });
});

test('mapModel: unknown falls back to ChatGPT and flags unmapped', () => {
  assert.deepEqual(mapModel('Happy Horse 1.0'), { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: true });
  assert.deepEqual(mapModel(''), { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: true });
  assert.deepEqual(mapModel(undefined), { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: true });
});

test('gradientForId: deterministic and within palette', () => {
  const g1 = gradientForId('2068539170935738802');
  const g2 = gradientForId('2068539170935738802');
  assert.deepEqual(g1, g2);
  assert.ok(GRADIENTS.some(([f, t]) => f === g1.gradientFrom && t === g1.gradientTo));
  assert.equal(GRADIENTS.length, 12);
});

test('aspectRatio', () => {
  assert.equal(aspectRatio(676, 1200), '676/1200');
  assert.equal(aspectRatio(undefined, 1200), '4/3');
  assert.equal(aspectRatio(676, 0), '4/3');
});

test('maxPromptNum + makeIdSequencer', () => {
  assert.equal(maxPromptNum(['p0001', 'p1977', 'pXYZ', 'p0500']), 1977);
  assert.equal(maxPromptNum([]), 0);
  const next = makeIdSequencer(1977);
  assert.equal(next(), 'p1978');
  assert.equal(next(), 'p1979');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/scrape-meigen.test.mjs`
Expected: FAIL — `Cannot find module './scrape-meigen.mjs'` / named exports undefined.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/scrape-meigen.mjs
// --- Pure helpers (exported for tests) ---

// meigen model string -> our { model, tab, category }. Prefix/keyword match, case-insensitive.
const MODEL_RULES = [
  { test: /^(gpt image|chatgpt|dall)/i, model: 'ChatGPT',        tab: 'ChatGPT',     category: 'ChatGPT' },
  { test: /^nanobanana/i,               model: 'Nanobanana Pro', tab: 'Nanobanana',  category: 'Nanobanana' },
  { test: /^midjourney/i,               model: 'Midjourney',     tab: 'Midjourney',  category: 'Midjourney' },
  { test: /^seedance/i,                 model: 'Seedance 2.0',   tab: 'Seedance',    category: 'Seedance' },
  { test: /^flux/i,                     model: 'Flux',           tab: 'Flux',        category: 'Flux' },
  { test: /^gemini/i,                   model: 'Gemini',         tab: 'Gemini',      category: 'Gemini' },
];

export function mapModel(meigenModel) {
  const s = (meigenModel || '').trim();
  for (const r of MODEL_RULES) {
    if (r.test.test(s)) return { model: r.model, tab: r.tab, category: r.category, unmapped: false };
  }
  return { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: true };
}

// Pastel palette as stored in data/db.json (NOT lib/utils.ts vivid palette).
export const GRADIENTS = [
  ['#b4d4f5', '#f5d4b4'], ['#b4d4e8', '#f5c7b4'], ['#c7b4e8', '#f5f0b4'],
  ['#f5e8b4', '#b4c7f5'], ['#e8b4b8', '#c7e3f5'], ['#e8c7b4', '#b4b4f5'],
  ['#d4f5b4', '#f5b4e8'], ['#d4e8b4', '#e8d4b4'], ['#f5b4d4', '#b4f5e8'],
  ['#e8d4f5', '#b4e8d4'], ['#f5c7d4', '#c7f5b4'], ['#b4e8c7', '#f5b4b4'],
];

export function gradientForId(id) {
  let hash = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const [gradientFrom, gradientTo] = GRADIENTS[hash % GRADIENTS.length];
  return { gradientFrom, gradientTo };
}

export function aspectRatio(w, h) {
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return `${w}/${h}`;
  return '4/3';
}

export function maxPromptNum(ids) {
  let max = 0;
  for (const id of ids) {
    const m = /^p(\d+)$/.exec(id || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

export function makeIdSequencer(maxExistingNum) {
  let n = maxExistingNum;
  return () => 'p' + String(++n).padStart(4, '0');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/scrape-meigen.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape-meigen.mjs scripts/scrape-meigen.test.mjs
git commit -m "feat: meigen scraper pure helpers (model map, gradients, ids)"
```

---

## Task 2: Item mapping + CLI flag parsing

**Files:**
- Modify: `scripts/scrape-meigen.mjs` (add exports below the Task 1 helpers)
- Test: `scripts/scrape-meigen.test.mjs` (append tests)

**Interfaces:**
- Consumes: `mapModel`, `gradientForId`, `aspectRatio` (Task 1)
- Produces (exported):
  - `mapItemToRow(item, { id, r2PublicUrl }) => { row, unmapped }` — pure transform of one meigen API item into a Supabase row object (snake_case columns) plus the `unmapped` flag. Does NOT set timestamps (DB defaults handle those).
  - `isIngestable(item) => boolean` — true if `promptReady === true` and `prompt` is a non-empty trimmed string.
  - `parseArgs(argv: string[]) => { dryRun: boolean, limit: number|null, sort: string }` — defaults `{ dryRun:false, limit:null, sort:'newest' }`. Recognizes `--dry-run`, `--limit=N`, `--sort=newest|featured|popular`. Invalid sort throws `Error`.

- [ ] **Step 1: Write the failing test**

```js
// append to scripts/scrape-meigen.test.mjs
import { mapItemToRow, isIngestable, parseArgs } from './scrape-meigen.mjs';

const SAMPLE = {
  id: '2068539170935738802',
  image: 'https://images.meigen.ai/tweets/2068539170935738802/0.jpg',
  images: ['https://images.meigen.ai/tweets/2068539170935738802/0.jpg', '.../1.jpg'],
  prompt: 'Ultra-detailed caricature sports portrait',
  promptReady: true,
  author: { name: 'Simply Ray', username: 'kingofdairyque' },
  stats: { likes: 145, views: 5595, retweets: 15 },
  model: 'GPT Image',
  imageWidth: 676, imageHeight: 1200,
};

test('isIngestable', () => {
  assert.equal(isIngestable(SAMPLE), true);
  assert.equal(isIngestable({ ...SAMPLE, promptReady: false }), false);
  assert.equal(isIngestable({ ...SAMPLE, prompt: '   ' }), false);
  assert.equal(isIngestable({ ...SAMPLE, prompt: undefined }), false);
});

test('mapItemToRow: full mapping', () => {
  const { row, unmapped } = mapItemToRow(SAMPLE, { id: 'p1978', r2PublicUrl: 'https://pub-x.r2.dev' });
  assert.equal(unmapped, false);
  assert.equal(row.id, 'p1978');
  assert.equal(row.source_id, '2068539170935738802');
  assert.equal(row.prompt_text, 'Ultra-detailed caricature sports portrait');
  assert.equal(row.image_url, 'https://images.meigen.ai/tweets/2068539170935738802/0.jpg');
  assert.equal(row.local_img, 'https://pub-x.r2.dev/2068539170935738802.jpg');
  assert.equal(row.author_name, 'Simply Ray');
  assert.equal(row.handle, 'kingofdairyque');
  assert.equal(row.model, 'ChatGPT');
  assert.equal(row.tab, 'ChatGPT');
  assert.equal(row.category, 'ChatGPT');
  assert.equal(row.likes, 145);
  assert.equal(row.views, 5595);
  assert.equal(row.aspect_ratio, '676/1200');
  assert.equal(row.featured, false);
  assert.equal(row.published, true);
  assert.match(row.gradient_from, /^#[0-9a-f]{6}$/);
  assert.match(row.gradient_to, /^#[0-9a-f]{6}$/);
});

test('mapItemToRow: missing author/stats fall back', () => {
  const { row } = mapItemToRow({ ...SAMPLE, author: {}, stats: {} }, { id: 'p1', r2PublicUrl: 'https://x' });
  assert.equal(row.author_name, 'Unknown');
  assert.equal(row.handle, '');
  assert.equal(row.likes, 0);
  assert.equal(row.views, 0);
});

test('parseArgs', () => {
  assert.deepEqual(parseArgs([]), { dryRun: false, limit: null, sort: 'newest' });
  assert.deepEqual(parseArgs(['--dry-run', '--limit=50', '--sort=featured']),
    { dryRun: true, limit: 50, sort: 'featured' });
  assert.throws(() => parseArgs(['--sort=bogus']), /sort/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/scrape-meigen.test.mjs`
Expected: FAIL — `mapItemToRow` / `isIngestable` / `parseArgs` are not exported.

- [ ] **Step 3: Write minimal implementation**

```js
// append to scripts/scrape-meigen.mjs (after Task 1 helpers)

export function isIngestable(item) {
  return item?.promptReady === true && typeof item.prompt === 'string' && item.prompt.trim().length > 0;
}

export function mapItemToRow(item, { id, r2PublicUrl }) {
  const { model, tab, category, unmapped } = mapModel(item.model);
  const { gradientFrom, gradientTo } = gradientForId(item.id);
  const base = r2PublicUrl.replace(/\/$/, '');
  const row = {
    id,
    source_id:     String(item.id),
    prompt_text:   item.prompt,
    image_url:     item.image || '',
    local_img:     `${base}/${item.id}.jpg`,
    author_name:   item.author?.name || 'Unknown',
    handle:        item.author?.username || '',
    model, tab, category,
    likes:         item.stats?.likes ?? 0,
    views:         item.stats?.views ?? 0,
    gradient_from: gradientFrom,
    gradient_to:   gradientTo,
    aspect_ratio:  aspectRatio(item.imageWidth, item.imageHeight),
    featured:      false,
    published:     true,
  };
  return { row, unmapped };
}

export function parseArgs(argv) {
  const out = { dryRun: false, limit: null, sort: 'newest' };
  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true;
    else if (a.startsWith('--limit=')) out.limit = parseInt(a.slice('--limit='.length), 10);
    else if (a.startsWith('--sort=')) out.sort = a.slice('--sort='.length);
  }
  if (!['newest', 'featured', 'popular'].includes(out.sort)) {
    throw new Error(`invalid --sort: ${out.sort} (use newest|featured|popular)`);
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/scrape-meigen.test.mjs`
Expected: PASS (9 tests total).

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape-meigen.mjs scripts/scrape-meigen.test.mjs
git commit -m "feat: meigen item->row mapping and CLI flag parsing"
```

---

## Task 3: Infrastructure wiring — env, clients, existing-id load, browser fetch, R2 upload

**Files:**
- Modify: `scripts/scrape-meigen.mjs` (add infra functions + `main()`; guard `main()` so it only runs as entry module)

**Interfaces:**
- Consumes: all Task 1 + Task 2 exports.
- Produces (exported, but network/DB-bound — exercised in Task 4 live run, not unit-tested):
  - `loadEnv(rootDir)` — populate `process.env` from `.env.local` (copy of migrate script block); throw if any required var missing.
  - `loadExistingSourceIds(supabase) => Promise<Set<string>>` — paginate `select('id,source_id')`, returns set of source_ids; also expose max prompt-number via a returned object `{ ids: Set, maxNum: number }`.
  - `fetchPage(page, { sort, offset, limit }) => Promise<{ images, hasMore, totalCount }>` — runs `fetch` inside the Playwright page.
  - `uploadImageToR2(r2, { bucket, sourceId, buffer }) => Promise<void>`
  - `objectExists(r2, { bucket, key }) => Promise<boolean>` — HEAD; false on 404.
  - `main()` — orchestrates the full run.

- [ ] **Step 1: Add env loader + client setup**

Add near the top of `scripts/scrape-meigen.mjs` (imports) and below helpers:

```js
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { chromium } from 'playwright';

const REQUIRED_ENV = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','CLOUDFLARE_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME','R2_PUBLIC_URL'];

export function loadEnv(rootDir) {
  try {
    const env = readFileSync(join(rootDir, '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const eq = line.indexOf('=');
      if (eq < 1 || line.startsWith('#')) continue;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* assume already set */ }
  for (const k of REQUIRED_ENV) {
    if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
  }
}
```

- [ ] **Step 2: Add Supabase id-load, page fetch, and R2 helpers**

```js
export async function loadExistingSourceIds(supabase) {
  const PAGE = 1000;
  const ids = new Set();
  const allIds = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('prompts').select('id,source_id').range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const r of data) {
      if (r.source_id) ids.add(String(r.source_id));
      if (r.id) allIds.push(r.id);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return { ids, maxNum: maxPromptNum(allIds) };
}

export async function fetchPage(page, { sort, offset, limit }) {
  return page.evaluate(async ({ sort, offset, limit }) => {
    const res = await fetch(`/api/images?sort=${sort}&offset=${offset}&limit=${limit}`);
    if (!res.ok) throw new Error(`api ${res.status}`);
    return res.json();
  }, { sort, offset, limit });
}

export async function objectExists(r2, { bucket, key }) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (e) {
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === 'NotFound') return false;
    throw e;
  }
}

export async function uploadImageToR2(r2, { bucket, sourceId, buffer }) {
  await r2.send(new PutObjectCommand({
    Bucket: bucket, Key: `${sourceId}.jpg`, Body: buffer, ContentType: 'image/jpeg',
  }));
}
```

- [ ] **Step 3: Add `main()` orchestration + entry guard**

```js
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

export async function main() {
  const __dir = dirname(fileURLToPath(import.meta.url));
  const root = join(__dir, '..');
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  console.log(`\n=== meigen scraper === sort=${args.sort} limit=${args.limit ?? '∞'} dryRun=${args.dryRun}`);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
  const R2_BUCKET = process.env.R2_BUCKET_NAME;
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL.replace(/\/$/, '');

  console.log('Loading existing source_ids...');
  const { ids: seen, maxNum } = await loadExistingSourceIds(supabase);
  console.log(`  ${seen.size} existing source_ids, max id = p${String(maxNum).padStart(4,'0')}`);
  const nextId = makeIdSequencer(maxNum);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36' });
  const page = await ctx.newPage();
  await page.goto('https://www.meigen.ai/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  const newRows = [];
  const unmappedModels = new Set();
  let scanned = 0, uploaded = 0, offset = 0, stop = false;
  const LIMIT = args.limit ?? Infinity;

  while (!stop) {
    let body;
    try { body = await fetchPage(page, { sort: args.sort, offset, limit: 20 }); }
    catch (e) { await SLEEP(1500); body = await fetchPage(page, { sort: args.sort, offset, limit: 20 }); }
    const items = body.images || [];
    if (items.length === 0) break;

    let newOnPage = 0;
    for (const item of items) {
      scanned++;
      const sid = String(item.id);
      if (seen.has(sid) || !isIngestable(item)) continue;
      seen.add(sid);
      newOnPage++;
      const id = nextId();
      const { row, unmapped } = mapItemToRow(item, { id, r2PublicUrl: R2_PUBLIC_URL });
      if (unmapped) unmappedModels.add(item.model || '(empty)');

      if (!args.dryRun) {
        const key = `${sid}.jpg`;
        if (!(await objectExists(r2, { bucket: R2_BUCKET, key }))) {
          try {
            const res = await fetch(item.image);
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              await uploadImageToR2(r2, { bucket: R2_BUCKET, sourceId: sid, buffer: buf });
              uploaded++;
            } else { console.warn(`  ⚠ image ${sid}: HTTP ${res.status}`); }
          } catch (e) { console.warn(`  ⚠ image ${sid}: ${e.message}`); }
        }
      }
      newRows.push(row);
      if (newRows.length >= LIMIT) { stop = true; break; }
    }
    process.stdout.write(`\r  scanned ${scanned}, new ${newRows.length}, uploaded ${uploaded}`);
    if (!stop && newOnPage === 0 && args.sort === 'newest') { stop = true; } // incremental stop
    if (!stop && !body.hasMore) stop = true;
    offset += 20;
    await SLEEP(400);
  }
  console.log('');
  await browser.close();

  if (unmappedModels.size) console.log(`  ⚠ unmapped models -> ChatGPT fallback: ${[...unmappedModels].join(', ')}`);

  if (args.dryRun) {
    console.log(`\n[DRY RUN] ${newRows.length} new prompts would be inserted. Sample:`);
    console.log(JSON.stringify(newRows[0] ?? null, null, 2));
    console.log('\n=== dry run complete (no writes) ===\n');
    return;
  }

  console.log(`\nUpserting ${newRows.length} prompts...`);
  let inserted = 0;
  const BATCH = 100;
  for (let i = 0; i < newRows.length; i += BATCH) {
    const batch = newRows.slice(i, i + BATCH);
    const { error } = await supabase.from('prompts').upsert(batch, { onConflict: 'source_id' });
    if (error) console.warn(`  ⚠ batch ${i}: ${error.message}`);
    else { inserted += batch.length; process.stdout.write(`\r  ✓ ${inserted}/${newRows.length}`); }
  }
  console.log(`\n\n=== done: ${inserted} inserted, ${uploaded} images uploaded ===\n`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('scrape-meigen.mjs')) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 4: Verify the file still loads and unit tests still pass**

Run: `node --check scripts/scrape-meigen.mjs && node --test scripts/scrape-meigen.test.mjs`
Expected: no syntax errors; PASS (9 tests). (Importing the module must NOT trigger `main()` — the entry guard prevents it.)

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape-meigen.mjs
git commit -m "feat: meigen scraper infra wiring and main orchestration"
```

---

## Task 4: Add unique index, dry-run against production, then live run

**Files:**
- Create: `scripts/sql/add-source-id-unique-index.sql` (documented one-time migration)
- Run-only task (no new app code).

**Interfaces:**
- Consumes: the completed `scripts/scrape-meigen.mjs`.

- [ ] **Step 1: Write the unique-index SQL**

```sql
-- scripts/sql/add-source-id-unique-index.sql
-- One-time: enforce dedup + enable upsert(onConflict: 'source_id').
-- Partial index tolerates any legacy NULL source_id rows.
CREATE UNIQUE INDEX IF NOT EXISTS prompts_source_id_key
  ON prompts (source_id)
  WHERE source_id IS NOT NULL;
```

- [ ] **Step 2: Apply the index to production**

Apply the SQL via the Supabase SQL editor (or `mcp__claude_ai_Supabase__apply_migration` if the connected project matches `SUPABASE_URL`). Confirm success.
Expected: `CREATE INDEX` succeeds; re-running is a no-op.
**Note:** if the upsert in Step 4 errors with `there is no unique or exclusion constraint matching the ON CONFLICT`, the index was not applied to the right project — stop and resolve before retrying.

- [ ] **Step 3: Dry run against production**

Run: `node scripts/scrape-meigen.mjs --dry-run --limit=200`
Expected: prints `scanned … new …`, any unmapped-model warnings, a sample row JSON, and `dry run complete (no writes)`. **No** rows written, **no** R2 uploads. Review the sample row's `model/tab/category/aspect_ratio/local_img` for correctness. **Pause here for user review of the numbers before any real write.**

- [ ] **Step 4: Live incremental run**

Run: `node scripts/scrape-meigen.mjs`
Expected: images upload to R2, prompts upsert into Supabase, summary prints `done: N inserted, M images uploaded`.

- [ ] **Step 5: Verify idempotency + spot-check data**

Run again: `node scripts/scrape-meigen.mjs`
Expected: `0 inserted` (everything already seen). Then spot-check in Supabase that a new prompt's `local_img` resolves to a real R2 image and the row renders in the gallery.

- [ ] **Step 6: Commit**

```bash
git add scripts/sql/add-source-id-unique-index.sql
git commit -m "feat: source_id unique index + run meigen scraper"
```

---

## Self-Review

**Spec coverage:**
- Reusable script `scripts/scrape-meigen.mjs` → Tasks 1-3. ✓
- Incremental scope (sort=newest, dedup, stop on all-known page) → Task 3 `main()` incremental-stop. ✓
- Headless-browser-driven API (no stealth) → Task 3 `fetchPage` + plain `chromium`. ✓
- Mirror images to R2, skip existing objects → Task 3 `objectExists`/`uploadImageToR2`. ✓
- Field mapping table → Task 2 `mapItemToRow` (tested). ✓
- Model→tab/category map + logged fallback → Task 1 `mapModel` + Task 3 `unmappedModels` log. ✓
- Pastel gradient palette deterministic by id → Task 1 `GRADIENTS`/`gradientForId`. ✓
- First-image-only → `item.image` (the `/0.jpg`) used; `images[]` ignored. ✓
- `--dry-run`/`--limit`/`--sort`, idempotent, polite delay, retry-once → Task 2 `parseArgs` + Task 3 `main()`. ✓
- Unique `source_id` index → Task 4. ✓
- Skip empty/not-ready prompts → Task 2 `isIngestable`. ✓
- Sequential `p####` ids from max → Task 1 `maxPromptNum`/`makeIdSequencer`, Task 3 wiring. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `mapModel` shape `{model,tab,category,unmapped}` consumed identically in `mapItemToRow` and `main`. `loadExistingSourceIds` returns `{ids,maxNum}` consumed in `main`. Row column names match `lib/db.ts` `toRow` snake_case. `nextId()`/`makeIdSequencer` names consistent. ✓
