/**
 * Security utilities: input sanitization, URL/SSRF validation, and field allowlisting.
 */

const POSTGREST_CONTROL_CHARS = /[(),.*"'\\%_]/g;

/**
 * Sanitizes a user search term before interpolating into a PostgREST `.or(...)` filter
 * or SQL `ilike` pattern, preventing filter-AST injection and wildcard flooding.
 */
export function sanitizeSearchQuery(raw: unknown, maxLen = 100): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(POSTGREST_CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Allows only relative paths (`/path`, `#hash`) or explicit `http:` / `https:` URLs.
 * Blocks `javascript:`, `data:`, `vbscript:`, and protocol-relative `//evil.com`.
 */
export function isSafeHref(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const s = raw.trim();
  if (!s) return false;
  if (s === '#') return true;
  if (s.startsWith('#') && !s.startsWith('#//')) return true;
  if (s.startsWith('/') && !s.startsWith('//')) return true;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function safeHref(raw: unknown, fallback = '#'): string {
  return isSafeHref(raw) ? String(raw).trim() : fallback;
}

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^127\./,
  /^10\./,
  /^0\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
  /^\[?fc00:/i,
  /^\[?fd/i,
];

/**
 * SSRF guard for server-side `fetch()` on admin-configured asset URLs (e.g. favicon proxy).
 * Requires `https:` and rejects loopback, link-local, metadata, and private RFC1918 hosts.
 */
export function isSafePublicFetchUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return false;
    if (u.username || u.password) return false;
    const host = u.hostname.toLowerCase();
    if (!host || PRIVATE_HOST_PATTERNS.some((re) => re.test(host))) return false;
    return true;
  } catch {
    return false;
  }
}

const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export function sanitizePromptIds(raw: unknown, max = 50): string[] {
  if (typeof raw !== 'string') return [];
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (SAFE_ID_RE.test(id)) seen.add(id);
    if (seen.size >= max) break;
  }
  return [...seen];
}

export function parsePositiveInt(raw: string | null | undefined, fallback: number, max = 1000): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export function pickAllowedFields<T extends object>(
  input: unknown,
  allowed: readonly (keyof T)[]
): Partial<T> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const src = input as Record<string, unknown>;
  const out: Partial<T> = {};
  for (const key of allowed) {
    const k = String(key);
    if (Object.prototype.hasOwnProperty.call(src, k) && src[k] !== undefined) {
      out[key] = src[k] as T[keyof T];
    }
  }
  return out;
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
