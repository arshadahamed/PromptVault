/**
 * meigen.ai → PromptVault Supabase sync
 *
 * Pipeline:
 *   1. Load existing source_ids from Supabase (dedup gate).
 *   2. For each sort order (newest | featured | popular | all):
 *        a. Open meigen.ai in a headless Playwright context (bypasses Cloudflare).
 *        b. Call GET /api/images?sort=&offset=&limit= via page.evaluate (same-origin).
 *        c. For each new item:
 *             - If promptReady=true → ingest directly.
 *             - If promptReady=false but has an image → open detail page and scrape prompt (fallback).
 *             - Otherwise → skip.
 *        d. Upload image to Cloudflare R2 (skipped if key already exists).
 *        e. Stop the sort when N consecutive all-seen pages are encountered.
 *   3. Upsert all collected rows into Supabase in batches of 100.
 *   4. Write a local sync-log.json and upsert a sync_runs row (non-fatal if table missing).
 *
 * Usage:
 *   node scripts/scrape-meigen.mjs [--sort=newest|featured|popular|all] [--limit=N] [--dry-run]
 */

import { readFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { chromium } from 'playwright';

// ─── Module-level constants ──────────────────────────────────────────────────

const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));
const EMPTY_PAGES_BEFORE_STOP = 3; // stop sort after N consecutive all-seen pages
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

// ─── Pure helpers (exported for unit tests) ──────────────────────────────────

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

// Pastel palette as stored in data/db.json
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

/**
 * Determines whether an item can be ingested, and whether a DOM fallback is needed.
 *
 * - ok=true, needsFallback=false  → item has promptReady=true and a non-empty prompt
 * - ok=true, needsFallback=true   → item is missing prompt but has an image; scrape detail page
 * - ok=false                      → item has no usable data; skip entirely
 */
export function isIngestableOrFallback(item) {
  if (!item || typeof item !== 'object') return { ok: false, needsFallback: false };
  const hasPrompt = item.promptReady === true &&
    typeof item.prompt === 'string' &&
    item.prompt.trim().length > 0;
  if (hasPrompt) return { ok: true, needsFallback: false };

  // No ready prompt — can we at least scrape the detail page?
  const hasImage = typeof item.image === 'string' && item.image.trim().length > 0;
  const hasId    = typeof item.id === 'string' && item.id.trim().length > 0;
  if (hasImage && hasId) return { ok: true, needsFallback: true };

  return { ok: false, needsFallback: false };
}

/**
 * Wraps an async fn with exponential back-off.
 * Attempts: maxAttempts total. Delays: baseMs, baseMs*3, baseMs*9, …
 * Re-throws after final failure.
 */
export async function withBackoff(fn, { maxAttempts = 3, baseMs = 2000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < maxAttempts) {
        const delay = baseMs * Math.pow(3, attempt - 1);
        await SLEEP(delay);
      }
    }
  }
  throw lastErr;
}

export function mapItemToRow(item, { id, r2PublicUrl }) {
  const { model, tab, category, unmapped } = mapModel(item.model);
  const { gradientFrom, gradientTo } = gradientForId(item.id);
  const base = r2PublicUrl.replace(/\/$/, '');
  const row = {
    id,
    source_id:     String(item.id),
    prompt_text:   (item.prompt || '').trim(),
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

/**
 * Parses CLI args.
 * --sort=newest|featured|popular|all   (default: newest)
 * --limit=N                            (default: unlimited)
 * --dry-run
 * --full                               crawl the entire catalogue (no early stop on
 *                                      already-seen pages) — use to backfill gaps
 */
export function parseArgs(argv) {
  const out = { dryRun: false, limit: null, sort: 'newest', full: false };
  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--full') out.full = true;
    else if (a.startsWith('--limit=')) out.limit = parseInt(a.slice('--limit='.length), 10);
    else if (a.startsWith('--sort=')) out.sort = a.slice('--sort='.length);
  }
  const VALID_SORTS = ['newest', 'latest', 'featured', 'popular', 'all'];
  if (!VALID_SORTS.includes(out.sort)) {
    throw new Error(`invalid --sort: ${out.sort} (use ${VALID_SORTS.join('|')})`);
  }
  return out;
}

// ─── Infrastructure helpers (exported for external re-use) ────────────────────

const REQUIRED_ENV = [
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'CLOUDFLARE_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME', 'R2_PUBLIC_URL',
];

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
  const apiSort = sort === 'newest' ? 'latest' : sort;
  return page.evaluate(async ({ apiSort, offset, limit }) => {
    const res = await fetch(`/api/images?sort=${apiSort}&offset=${offset}&limit=${limit}`);
    if (!res.ok) throw new Error(`api ${res.status}`);
    return res.json();
  }, { apiSort, offset, limit });
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

// ─── Fallback DOM scraper ─────────────────────────────────────────────────────

/**
 * Opens the meigen.ai detail page for `item.id` and extracts the prompt text
 * from the DOM. Used when the API returns an item with promptReady=false.
 *
 * Returns the scraped prompt string (may be empty string on failure).
 */
export async function scrapePromptFallback(page, item) {
  try {
    await page.goto(`https://www.meigen.ai/prompt/${item.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });
    await SLEEP(1200);

    const raw = await page.evaluate(() => {
      let prompt = '';

      // Priority selectors — most reliable first
      const SELECTORS = [
        '[class*="prompt-text"]', '[class*="promptText"]', '[class*="prompt_text"]',
        '[data-testid="prompt"]', 'pre', 'code.prompt',
        'article .content', '.prose', '[class*="description"]',
        'textarea', '[contenteditable]',
      ];
      for (const sel of SELECTORS) {
        for (const el of document.querySelectorAll(sel)) {
          const t = el.textContent?.trim() || '';
          if (t.length > 80 && t.length > prompt.length && t.length < 30000) prompt = t;
        }
      }

      // Fallback: largest paragraph-like text block without UI noise
      if (prompt.length < 80) {
        const blocks = [...document.querySelectorAll('div, p, section')]
          .filter(el => el.children.length <= 3)
          .map(el => el.textContent?.trim() || '')
          .filter(t =>
            t.length > 100 && t.length < 30000 &&
            !t.includes('Sign in') && !t.includes('Privacy Policy') && !t.includes('©')
          )
          .sort((a, b) => b.length - a.length);
        if (blocks.length) prompt = blocks[0];
      }

      return prompt;
    });
    return isPlausiblePrompt(raw) ? raw : '';
  } catch {
    return ''; // non-fatal — caller will skip this item's prompt but still upload image
  }
}

/**
 * Rejects text scraped from page chrome (nav, JSON-LD, editor UI) or the
 * "No prompt available" placeholder, which the DOM fallback can otherwise
 * pick up as the "largest text block".
 */
const UI_MARKERS = [
  'HomeSearch', 'No prompt available', 'Drag a card to apply a prompt',
  '"@context"', 'schema.org', 'Related creations', 'Add reference images',
  'AI generated image by',
];
export function isPlausiblePrompt(text) {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 20) return false;
  return !UI_MARKERS.some((m) => t.includes(m));
}

// ─── Per-sort loop ────────────────────────────────────────────────────────────

/**
 * Runs a single sort-order scrape loop.
 *
 * @param {import('playwright').Browser} browser
 * @param {string} sort        - 'newest' | 'featured' | 'popular'
 * @param {Set<string>} seen   - mutable set of already-known source_ids
 * @param {Function} nextId    - sequencer that returns the next DB id
 * @param {object} r2          - S3Client pointed at R2
 * @param {object} args        - parsed CLI args
 * @param {string} R2_BUCKET
 * @param {string} R2_PUBLIC_URL
 *
 * @returns {{ newRows: object[], uploaded: number, fallbackUsed: number, errors: string[] }}
 */
export async function runSort(browser, sort, seen, nextId, r2, args, R2_BUCKET, R2_PUBLIC_URL) {
  console.log(`\n📡 Sort="${sort}" — starting (fast parallel mode)…`);
  const newRows = [];
  const errors = [];
  let uploaded = 0;
  let fallbackUsed = 0;
  let offset = 0;
  let emptyPages = 0;
  let flushedCount = 0;
  const LIMIT = args.limit ?? Infinity;
  const unmappedModels = new Set();
  const PAGES_PER_BATCH = 5; // fetch 5 pages (100 items) per round

  let sharedCtx = null;
  let sharedPage = null;

  const ensureSession = async (forceNew = false) => {
    if (forceNew && sharedCtx) {
      try { await sharedCtx.close(); } catch {}
      sharedCtx = null;
      sharedPage = null;
    }
    if (!sharedPage) {
      sharedCtx = await browser.newContext({ userAgent: UA });
      sharedPage = await sharedCtx.newPage();
      await sharedPage.goto('https://www.meigen.ai/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    return sharedPage;
  };

  const fetchBatch = async (startOffset) => {
    const offsets = Array.from({ length: PAGES_PER_BATCH }, (_, i) => startOffset + i * 20);
    try {
      const page = await ensureSession(false);
      return await Promise.all(offsets.map((off) => fetchPage(page, { sort, offset: off, limit: 20 })));
    } catch {
      // Refresh session on error and retry once
      const page = await ensureSession(true);
      return await Promise.all(offsets.map((off) => fetchPage(page, { sort, offset: off, limit: 20 })));
    }
  };

  const uploadItemImage = async (sid, imageUrl) => {
    if (args.dryRun || !imageUrl) return false;
    const key = `${sid}.jpg`;
    try {
      if (!(await objectExists(r2, { bucket: R2_BUCKET, key }))) {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          await uploadImageToR2(r2, { bucket: R2_BUCKET, sourceId: sid, buffer: buf });
          return true;
        } else {
          console.warn(`  image ${sid}: HTTP ${imgRes.status}`);
        }
      }
    } catch (e) {
      console.warn(`  image ${sid}: ${e.message}`);
    }
    return false;
  };

  try {
    let reachedEnd = false;
    while (newRows.length < LIMIT && !reachedEnd) {
      let bodies;
      try {
        bodies = await withBackoff(
          () => fetchBatch(offset),
          { maxAttempts: 3, baseMs: 1000 }
        );
      } catch (e) {
        const msg = `offset=${offset} sort=${sort}: ${e.message}`;
        console.warn(`  ⚠ ${msg}`);
        errors.push(msg);
        break;
      }

      const pendingUploads = [];

      for (let bIdx = 0; bIdx < bodies.length; bIdx++) {
        const body = bodies[bIdx];
        const pageOffset = offset + bIdx * 20;
        const items = body?.images || [];
        if (items.length === 0) {
          reachedEnd = true;
          break;
        }

        let newOnPage = 0;
        for (const item of items) {
          const sid = String(item.id || '');
          if (!sid || seen.has(sid)) continue;

          // Only ingest items with a ready, non-empty prompt directly
          const hasPrompt = item.promptReady === true &&
            typeof item.prompt === 'string' &&
            item.prompt.trim().length > 0;
          if (!hasPrompt) continue;

          seen.add(sid);
          newOnPage++;
          const id = nextId();
          const { row, unmapped } = mapItemToRow(item, { id, r2PublicUrl: R2_PUBLIC_URL });
          if (unmapped) unmappedModels.add(item.model || '(empty)');

          pendingUploads.push(uploadItemImage(sid, item.image));
          newRows.push(row);
          if (newRows.length >= LIMIT) break;
        }

        if (newOnPage === 0 && !args.full) {
          emptyPages++;
          if (emptyPages >= EMPTY_PAGES_BEFORE_STOP) {
            console.log(`\n  ✅ ${EMPTY_PAGES_BEFORE_STOP} consecutive all-seen pages at offset=${pageOffset} — stopping sort`);
            reachedEnd = true;
            break;
          }
        } else {
          emptyPages = 0;
        }

        if (!body.hasMore) {
          console.log(`\n  ✅ API reports hasMore=false at offset=${pageOffset} — end of results`);
          reachedEnd = true;
          break;
        }

        if (newRows.length >= LIMIT) break;
      }

      // Await all R2 uploads for this 5-page batch in parallel
      if (pendingUploads.length > 0) {
        const results = await Promise.all(pendingUploads);
        uploaded += results.filter(Boolean).length;
      }

      // Incremental persist so a crash mid-crawl doesn't lose uploaded work
      if (typeof args.flush === 'function' && newRows.length > flushedCount) {
        await args.flush(newRows.slice(flushedCount));
        flushedCount = newRows.length;
      }

      offset += PAGES_PER_BATCH * 20;
      process.stdout.write(
        `\r  scanned offset=${offset}, new=${newRows.length}, uploaded=${uploaded}    `
      );
    }
  } finally {
    if (sharedCtx) {
      try { await sharedCtx.close(); } catch {}
    }
  }

  if (unmappedModels.size) {
    console.log(`\n  unmapped models → ChatGPT fallback: ${[...unmappedModels].join(', ')}`);
  }
  console.log(`\n  Sort="${sort}" done — ${newRows.length} new rows, ${fallbackUsed} fallbacks, ${uploaded} uploaded`);
  return { newRows, uploaded, fallbackUsed, errors };
}

// ─── Audit logger ─────────────────────────────────────────────────────────────

/**
 * Writes a JSON entry to scripts/sync-log.json and (non-fatally) upserts
 * a row into the Supabase `sync_runs` table if it exists.
 */
export async function writeSyncLog(supabase, rootDir, entry) {
  const logPath = join(rootDir, 'scripts', 'sync-log.json');
  const line = JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n';
  try {
    appendFileSync(logPath, line);
  } catch (e) {
    console.warn(`  ⚠ Could not write sync-log.json: ${e.message}`);
  }

  // Non-fatal: sync_runs table may not exist
  try {
    await supabase.from('sync_runs').insert({
      started_at:  entry.startedAt,
      sort:        entry.sort,
      scanned:     entry.scanned,
      inserted:    entry.inserted,
      skipped:     entry.skipped,
      fallback:    entry.fallback,
      uploaded:    entry.uploaded,
      errors:      entry.errors ?? [],
      dry_run:     entry.dryRun ?? false,
    });
  } catch { /* sync_runs table not present — silently ignore */ }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function main() {
  const __dir = dirname(fileURLToPath(import.meta.url));
  const root  = join(__dir, '..');
  loadEnv(root);

  const args = parseArgs(process.argv.slice(2));
  const SORTS = args.sort === 'all' ? ['newest', 'featured', 'popular'] : [args.sort];
  const startedAt = new Date().toISOString();

  console.log(`\n=== meigen → PromptVault sync ===`);
  console.log(`  sorts=${SORTS.join(',')} | limit=${args.limit ?? '∞'} | dryRun=${args.dryRun} | full=${args.full}`);

  const supabase   = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const r2         = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  const R2_BUCKET     = process.env.R2_BUCKET_NAME;
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL.replace(/\/$/, '');

  console.log('\nLoading existing source_ids from Supabase…');
  const { ids: seen, maxNum } = await loadExistingSourceIds(supabase);
  console.log(`  ${seen.size} existing source_ids, max id = p${String(maxNum).padStart(4, '0')}`);
  const nextId = makeIdSequencer(maxNum);

  const browser = await chromium.launch({ headless: true });

  let allRows       = [];
  let totalUploaded = 0;
  let totalFallback = 0;
  const allErrors   = [];
  let inserted      = 0;

  // Upsert rows to Supabase as each batch is processed (not in dry-run)
  const upsertRows = async (rows) => {
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      try {
        await withBackoff(async () => {
          const { error } = await supabase.from('prompts').upsert(batch, { onConflict: 'source_id' });
          if (error) throw new Error(error.message);
        }, { maxAttempts: 3, baseMs: 1000 });
        inserted += batch.length;
      } catch (e) {
        console.warn(`\n  ⚠ upsert: ${e.message}`);
        allErrors.push(`upsert: ${e.message}`);
      }
    }
  };
  if (!args.dryRun) args.flush = upsertRows;

  try {
    for (const sort of SORTS) {
      const { newRows, uploaded, fallbackUsed, errors } = await runSort(
        browser, sort, seen, nextId, r2, args, R2_BUCKET, R2_PUBLIC_URL
      );
      allRows       = allRows.concat(newRows);
      totalUploaded += uploaded;
      totalFallback += fallbackUsed;
      allErrors.push(...errors);
    }
  } finally {
    await browser.close();
  }

  // ── Dry-run exit ──
  if (args.dryRun) {
    console.log(`\n[DRY RUN] ${allRows.length} new prompts would be inserted. Sample:`);
    console.log(JSON.stringify(allRows[0] ?? null, null, 2));
    console.log('\n=== dry run complete (no writes) ===\n');
    return;
  }

  // Rows were upserted incrementally via args.flush during runSort
  const skipped = seen.size - inserted; // approximate
  console.log(`\n\n=== Sync complete ===`);
  console.log(`  ➕ Inserted:   ${inserted}`);
  console.log(`  🔄 Fallbacks:  ${totalFallback}`);
  console.log(`  📤 Uploaded:   ${totalUploaded}`);
  console.log(`  ⚠  Errors:     ${allErrors.length}`);

  await writeSyncLog(supabase, root, {
    startedAt,
    sort:      args.sort,
    scanned:   allRows.length + skipped,
    inserted,
    skipped,
    fallback:  totalFallback,
    uploaded:  totalUploaded,
    errors:    allErrors,
    dryRun:    false,
  });
  console.log(`  📝 Run logged to scripts/sync-log.json\n`);
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('scrape-meigen.mjs')
) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
