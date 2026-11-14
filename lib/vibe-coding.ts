import { isSafeHref } from './security';

export const IMAGE_MODELS = [
  'ChatGPT',
  'GPT Image',
  'Nanobanana Pro',
  'Nanobanana 2',
  'Seedance 2.0',
  'Midjourney',
  'DALL-E',
  'Flux',
  'Stable Diffusion',
  'Adobe Firefly',
  'Leonardo AI',
  'Gemini',
] as const;

export const VIBE_CODING_MODELS = [
  'Claude',
  'Cursor',
  'Lovable',
  'Bolt.new',
  'v0',
  'Replit',
  'Windsurf',
  'ChatGPT',
  'Gemini',
] as const;

export const ALL_MODELS: readonly string[] = Array.from(
  new Set([...IMAGE_MODELS, ...VIBE_CODING_MODELS])
);

export const ALL_TABS: readonly string[] = [
  'Vibe Coding',
  'ChatGPT',
  'Nanobanana',
  'Seedance',
  'Midjourney',
  'Flux',
  'Gemini',
  'Adobe Firefly',
  'DALL-E',
  'Stable Diffusion',
  'Leonardo AI',
];

export interface CodeLanguageOption {
  value: string;
  label: string;
  ext: string;
}

export const CODE_LANGUAGES: readonly CodeLanguageOption[] = [
  { value: 'tsx', label: 'TSX (React / Next.js)', ext: 'tsx' },
  { value: 'html', label: 'HTML / Tailwind', ext: 'html' },
  { value: 'jsx', label: 'JSX (React)', ext: 'jsx' },
  { value: 'css', label: 'CSS / Keyframes', ext: 'css' },
  { value: 'ts', label: 'TypeScript', ext: 'ts' },
  { value: 'js', label: 'JavaScript', ext: 'js' },
  { value: 'vue', label: 'Vue SFC', ext: 'vue' },
  { value: 'svelte', label: 'Svelte', ext: 'svelte' },
];

const ALLOWED_CODE_LANGS = new Set(CODE_LANGUAGES.map((l) => l.value));

export const STACK_TAG_PRESETS = [
  'React',
  'Next.js',
  'Tailwind CSS',
  'Framer Motion',
  'GSAP',
  'Three.js',
  'HTML/CSS',
  'Hero Section',
  'Landing Page',
  'Dashboard',
  'SaaS UI',
  'Bento Grid',
  'Navbar',
  'Pricing',
  '3D / WebGL',
  'Claude',
  'Cursor',
  'Lovable',
  'Bolt.new',
  'v0',
] as const;

export function normalizeCodeLanguage(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const clean = raw.trim().toLowerCase();
  if (!clean) return '';
  return ALLOWED_CODE_LANGS.has(clean) ? clean : '';
}

export function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'htm') return 'html';
  if (ext === 'scss') return 'css';
  if (ext === 'mjs' || ext === 'cjs') return 'js';
  if (ALLOWED_CODE_LANGS.has(ext)) return ext;
  return 'tsx';
}

export function getCodeFileExtension(lang?: string): string {
  const found = CODE_LANGUAGES.find((l) => l.value === (lang || '').toLowerCase());
  return found ? found.ext : 'txt';
}

export function sanitizeStringArray(raw: unknown, maxItems = 20, maxLen = 40): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const clean = item.trim().slice(0, maxLen);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function sanitizeSafeUrls(raw: unknown, maxItems = 12): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const clean = item.trim();
    if (!clean || !isSafeHref(clean)) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
    if (out.length >= maxItems) break;
  }
  return out;
}
