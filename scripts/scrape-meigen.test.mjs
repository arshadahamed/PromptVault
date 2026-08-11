import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapModel, GRADIENTS, gradientForId, aspectRatio, makeIdSequencer, maxPromptNum,
  mapItemToRow, parseArgs,
  // New helpers
  isIngestableOrFallback, withBackoff,
} from './scrape-meigen.mjs';

// ─── Legacy tests (unchanged) ─────────────────────────────────────────────────

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

test('parseArgs (legacy: newest|featured|popular)', () => {
  assert.deepEqual(parseArgs([]), { dryRun: false, limit: null, sort: 'newest' });
  assert.deepEqual(parseArgs(['--dry-run', '--limit=50', '--sort=featured']),
    { dryRun: true, limit: 50, sort: 'featured' });
  assert.throws(() => parseArgs(['--sort=bogus']), /sort/);
});

// ─── New tests ────────────────────────────────────────────────────────────────

test('parseArgs: --sort=all and --sort=popular', () => {
  assert.deepEqual(parseArgs(['--sort=all']), { dryRun: false, limit: null, sort: 'all' });
  assert.deepEqual(parseArgs(['--sort=popular']), { dryRun: false, limit: null, sort: 'popular' });
});

test('isIngestableOrFallback: promptReady=true returns ok=true, needsFallback=false', () => {
  const result = isIngestableOrFallback(SAMPLE);
  assert.deepEqual(result, { ok: true, needsFallback: false });
});

test('isIngestableOrFallback: promptReady=false but has image → needsFallback=true', () => {
  const item = { ...SAMPLE, promptReady: false };
  const result = isIngestableOrFallback(item);
  assert.deepEqual(result, { ok: true, needsFallback: true });
});

test('isIngestableOrFallback: promptReady=false and empty prompt but still has image', () => {
  const item = { ...SAMPLE, promptReady: false, prompt: '' };
  const result = isIngestableOrFallback(item);
  assert.deepEqual(result, { ok: true, needsFallback: true });
});

test('isIngestableOrFallback: no image and no prompt → ok=false', () => {
  const item = { ...SAMPLE, promptReady: false, image: '' };
  const result = isIngestableOrFallback(item);
  assert.deepEqual(result, { ok: false, needsFallback: false });
});

test('isIngestableOrFallback: null item → ok=false', () => {
  assert.deepEqual(isIngestableOrFallback(null), { ok: false, needsFallback: false });
  assert.deepEqual(isIngestableOrFallback(undefined), { ok: false, needsFallback: false });
});

test('isIngestableOrFallback: whitespace-only prompt with promptReady=true → needsFallback=true', () => {
  const item = { ...SAMPLE, prompt: '   ', promptReady: true };
  const result = isIngestableOrFallback(item);
  // promptReady=true but prompt is blank — treated as needing fallback
  assert.deepEqual(result, { ok: true, needsFallback: true });
});

test('withBackoff: succeeds on first attempt', async () => {
  let calls = 0;
  const result = await withBackoff(async () => { calls++; return 'ok'; }, { maxAttempts: 3, baseMs: 1 });
  assert.equal(result, 'ok');
  assert.equal(calls, 1);
});

test('withBackoff: succeeds after one failure', async () => {
  let calls = 0;
  const result = await withBackoff(async () => {
    calls++;
    if (calls < 2) throw new Error('transient');
    return 'ok';
  }, { maxAttempts: 3, baseMs: 1 });
  assert.equal(result, 'ok');
  assert.equal(calls, 2);
});

test('withBackoff: throws after all attempts exhausted', async () => {
  let calls = 0;
  await assert.rejects(
    () => withBackoff(async () => { calls++; throw new Error('permanent'); }, { maxAttempts: 3, baseMs: 1 }),
    /permanent/
  );
  assert.equal(calls, 3);
});

test('withBackoff: respects maxAttempts=1 (no retry)', async () => {
  let calls = 0;
  await assert.rejects(
    () => withBackoff(async () => { calls++; throw new Error('err'); }, { maxAttempts: 1, baseMs: 1 }),
    /err/
  );
  assert.equal(calls, 1);
});
