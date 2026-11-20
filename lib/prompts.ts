import type { DbPrompt } from './db.ts';
import { isSafeHref } from './security.ts';
import type { Prompt } from './types.ts';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

/**
 * Validates and normalizes `w/h` aspect ratios so malformed DB strings never produce `NaN%`.
 */
export function safeAspectRatio(raw?: string): string {
  if (!raw) return '4/3';
  const parts = raw.split('/');
  if (parts.length !== 2) return '4/3';
  const w = Number(parts[0]);
  const h = Number(parts[1]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return '4/3';
  // Clamp extreme ratios to keep masonry layout stable
  const ratio = w / h;
  if (ratio < 0.35 || ratio > 2.8) return '4/3';
  return `${w}/${h}`;
}

export function aspectRatioPaddingBottom(raw?: string): string {
  const safe = safeAspectRatio(raw);
  const [w, h] = safe.split('/').map(Number);
  return `${((h / w) * 100).toFixed(2)}%`;
}

/**
 * Shared mapper from `DbPrompt` row to public `Prompt` card shape.
 */
export function toPrompt(p: DbPrompt): Prompt {
  const name = p.authorName || 'Creator';
  const handle = p.handle
    ? (p.handle.startsWith('@') ? p.handle : `@${p.handle}`)
    : '@creator';
  const words = name.trim().split(/\s+/);
  const initials = words.map((w) => w[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;

  const fallbackExternal =
    p.imageUrl && isSafeHref(p.imageUrl) && !p.imageUrl.includes('meigen.ai')
      ? p.imageUrl
      : '';
  const primaryImg = p.localImg || fallbackExternal;

  return {
    id:            p.id,
    title:         p.title || undefined,
    author:        { name, handle, initials, avatarColor: AVATAR_COLORS[Math.abs(hash)] },
    model:         p.model as Prompt['model'],
    category:      p.category as Prompt['category'],
    tab:           p.tab as Prompt['tab'],
    likes:         p.likes,
    views:         p.views,
    promptText:    p.promptText,
    aspectRatio:   safeAspectRatio(p.aspectRatio),
    gradientFrom:  p.gradientFrom,
    gradientTo:    p.gradientTo,
    localImg:      primaryImg,
    codeSnippet:   p.codeSnippet || undefined,
    codeLanguage:  p.codeLanguage || undefined,
    stackTags:     p.stackTags && p.stackTags.length > 0 ? p.stackTags : undefined,
    galleryImages: p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : undefined,
    previewUrl:    p.previewUrl || undefined,
    hasCode:       Boolean(p.hasCode || (p.codeSnippet && p.codeSnippet.trim().length > 0)),
    relatedIds:    [],
    createdAt:     (p.createdAt || '').slice(0, 10),
  };
}
