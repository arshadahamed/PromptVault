import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { chromium } from 'playwright';

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

// --- Infrastructure functions (exported for external re-use) ---

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

// --- Main orchestration ---

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

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
  const browser = await chromium.launch({ headless: true });

  // Cloudflare bot detection tracks API calls within a session; a fresh context
  // (new clearance token) per page bypasses that pattern reliably.
  const fetchPageFresh = async (params) => {
    const ctx = await browser.newContext({ userAgent: UA });
    const page = await ctx.newPage();
    await page.goto('https://www.meigen.ai/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    try { return await fetchPage(page, params); }
    finally { await ctx.close(); }
  };

  const newRows = [];
  const unmappedModels = new Set();
  let scanned = 0, uploaded = 0, offset = 0, stop = false;
  const LIMIT = args.limit ?? Infinity;

  while (!stop) {
    let body;
    try { body = await fetchPageFresh({ sort: args.sort, offset, limit: 20 }); }
    catch (e) { await SLEEP(2000); body = await fetchPageFresh({ sort: args.sort, offset, limit: 20 }); }
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
            } else { console.warn(`  image ${sid}: HTTP ${res.status}`); }
          } catch (e) { console.warn(`  image ${sid}: ${e.message}`); }
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
  await browser.close(); // closes all contexts

  if (unmappedModels.size) console.log(`  unmapped models -> ChatGPT fallback: ${[...unmappedModels].join(', ')}`);

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
    if (error) console.warn(`  batch ${i}: ${error.message}`);
    else { inserted += batch.length; process.stdout.write(`\r  ${inserted}/${newRows.length}`); }
  }
  console.log(`\n\n=== done: ${inserted} inserted, ${uploaded} images uploaded ===\n`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('scrape-meigen.mjs')) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
