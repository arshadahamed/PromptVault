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
