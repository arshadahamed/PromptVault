import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeSearchQuery,
  isSafeHref,
  safeHref,
  isSafePublicFetchUrl,
  sanitizePromptIds,
  parsePositiveInt,
  pickAllowedFields,
  getClientIp,
} from './security.ts';
import { rateLimit } from './rate-limit.ts';
import { safeAspectRatio, aspectRatioPaddingBottom, toPrompt } from './prompts.ts';

test('sanitizeSearchQuery strips PostgREST filter operators and truncates', () => {
  assert.equal(sanitizeSearchQuery('cyberpunk),published.eq.false,id.gt.0'), 'cyberpunk published eq false id gt 0');
  assert.equal(sanitizeSearchQuery('  %portrait_100% *\\test*  '), 'portrait 100 test');
  assert.equal(sanitizeSearchQuery(null), '');
  assert.equal(sanitizeSearchQuery({ bad: true }), '');
  assert.equal(sanitizeSearchQuery('a'.repeat(200), 50).length, 50);
});

test('isSafeHref and safeHref allow safe URLs and block script/data/protocol-relative payloads', () => {
  assert.equal(isSafeHref('/prompt/abc_1'), true);
  assert.equal(isSafeHref('#section'), true);
  assert.equal(isSafeHref('https://example.com/path?a=1'), true);
  assert.equal(isSafeHref('http://example.com'), true);

  assert.equal(isSafeHref('javascript:alert(1)'), false);
  assert.equal(isSafeHref('  JaVaScRiPt:alert(1)'), false);
  assert.equal(isSafeHref('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeHref('vbscript:msgbox(1)'), false);
  assert.equal(isSafeHref('//evil.example/steal'), false);
  assert.equal(isSafeHref('#//evil.example'), false);
  assert.equal(isSafeHref(''), false);

  assert.equal(safeHref('javascript:alert(1)'), '#');
  assert.equal(safeHref('https://safe.example/ok'), 'https://safe.example/ok');
});

test('isSafePublicFetchUrl blocks SSRF vectors (http, credentials, loopback, RFC1918, metadata)', () => {
  assert.equal(isSafePublicFetchUrl('https://cdn.example.com/favicon.png'), true);

  assert.equal(isSafePublicFetchUrl('http://cdn.example.com/favicon.png'), false);
  assert.equal(isSafePublicFetchUrl('https://user:pass@cdn.example.com/favicon.png'), false);
  assert.equal(isSafePublicFetchUrl('https://localhost/admin'), false);
  assert.equal(isSafePublicFetchUrl('https://127.0.0.1:8080/'), false);
  assert.equal(isSafePublicFetchUrl('https://169.254.169.254/latest/meta-data/'), false);
  assert.equal(isSafePublicFetchUrl('https://10.0.0.5/secret'), false);
  assert.equal(isSafePublicFetchUrl('https://192.168.1.10/router'), false);
  assert.equal(isSafePublicFetchUrl('https://172.16.0.1/internal'), false);
  assert.equal(isSafePublicFetchUrl('https://[::1]/'), false);
  assert.equal(isSafePublicFetchUrl('https://[fe80::1]/'), false);
  assert.equal(isSafePublicFetchUrl('https://db.internal/health'), false);
  assert.equal(isSafePublicFetchUrl('https://printer.local/'), false);
});

test('sanitizePromptIds filters malformed IDs, deduplicates, and caps size', () => {
  assert.deepEqual(
    sanitizePromptIds('p_1, mg-2, p_1, bad/id, ../etc, script(), ok_3'),
    ['p_1', 'mg-2', 'ok_3']
  );
  const many = Array.from({ length: 10 }, (_, i) => `id_${i}`).join(',');
  assert.equal(sanitizePromptIds(many, 4).length, 4);
  assert.deepEqual(sanitizePromptIds(12345), []);
});

test('parsePositiveInt falls back on invalid/non-positive values and clamps max', () => {
  assert.equal(parsePositiveInt('12', 1, 100), 12);
  assert.equal(parsePositiveInt('999', 1, 100), 100);
  assert.equal(parsePositiveInt('0', 5, 100), 5);
  assert.equal(parsePositiveInt('-3', 5, 100), 5);
  assert.equal(parsePositiveInt('abc', 5, 100), 5);
  assert.equal(parsePositiveInt(undefined, 5, 100), 5);
});

test('pickAllowedFields strips disallowed fields and undefined values', () => {
  const input = { title: 'ok', isAdmin: true, extra: undefined, role: 'superuser' };
  assert.deepEqual(pickAllowedFields(input, ['title', 'extra']), { title: 'ok' });
  assert.deepEqual(pickAllowedFields(['not', 'object'], ['title']), {});
  assert.deepEqual(pickAllowedFields(null, ['title']), {});
});

test('getClientIp extracts first forwarded IP or falls back cleanly', () => {
  const h1 = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
  assert.equal(getClientIp(h1), '203.0.113.5');
  const h2 = new Headers({ 'x-real-ip': '198.51.100.2' });
  assert.equal(getClientIp(h2), '198.51.100.2');
  assert.equal(getClientIp(new Headers()), 'unknown');
});

test('rateLimit blocks after maxAttempts and reports retryAfterSec', async () => {
  const key = `test-rl-${Date.now()}-${Math.random()}`;
  const r1 = rateLimit(key, { maxAttempts: 2, windowMs: 200 });
  const r2 = rateLimit(key, { maxAttempts: 2, windowMs: 200 });
  const r3 = rateLimit(key, { maxAttempts: 2, windowMs: 200 });

  assert.equal(r1.ok, true);
  assert.equal(r1.remaining, 1);
  assert.equal(r2.ok, true);
  assert.equal(r2.remaining, 0);
  assert.equal(r3.ok, false);
  assert.ok(r3.retryAfterSec >= 1);

  await new Promise((r) => setTimeout(r, 220));
  const r4 = rateLimit(key, { maxAttempts: 2, windowMs: 200 });
  assert.equal(r4.ok, true);
});

test('safeAspectRatio, aspectRatioPaddingBottom, and toPrompt normalize inputs safely', () => {
  assert.equal(safeAspectRatio('16/9'), '16/9');
  assert.equal(safeAspectRatio('NaN/0'), '4/3');
  assert.equal(safeAspectRatio('100/1'), '4/3');
  assert.equal(safeAspectRatio('1/100'), '4/3');
  assert.equal(aspectRatioPaddingBottom('4/3'), '75.00%');
  assert.equal(aspectRatioPaddingBottom('bad'), '75.00%');

  const mapped = toPrompt({
    id: 'p_1',
    promptText: 'Neon cyberpunk alley',
    imageUrl: '',
    localImg: 'https://pub.example.r2.dev/1.jpg',
    authorName: 'Jane Doe',
    handle: 'janedoe',
    model: 'Midjourney',
    category: 'Cyberpunk',
    tab: 'Midjourney',
    likes: 42,
    views: 500,
    gradientFrom: '#111111',
    gradientTo: '#222222',
    aspectRatio: '3/4',
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
  });

  assert.equal(mapped.author.handle, '@janedoe');
  assert.equal(mapped.author.initials, 'JD');
  assert.equal(mapped.aspectRatio, '3/4');
  assert.equal(mapped.createdAt, '2026-11-10');
});
