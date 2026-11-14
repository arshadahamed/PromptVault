/**
 * Lightweight in-memory sliding-window rate limiter for API routes.
 * Protects login and search endpoints from brute-force and scraping spikes.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  { maxAttempts, windowMs }: { maxAttempts: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();

  // Opportunistic pruning so long-lived processes don't leak memory
  if (store.size > MAX_BUCKETS) {
    for (const [k, b] of store) {
      if (b.resetAt <= now) store.delete(k);
    }
  }

  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, maxAttempts - 1), retryAfterSec: 0 };
  }

  if (current.count >= maxAttempts) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, maxAttempts - current.count),
    retryAfterSec: 0,
  };
}
