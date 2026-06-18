export const COOKIE = 'meigen_admin';
const TTL = 60 * 60 * 24 * 7;

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) throw new Error('JWT_SECRET env var required (min 16 chars)');
  return globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const buf = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createToken(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const payload = `admin:${exp}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot < 0) return false;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const expected = await sign(payload);
    if (expected !== sig) return false;
    const exp = parseInt(payload.split(':')[1] || '0');
    return Math.floor(Date.now() / 1000) < exp;
  } catch {
    return false;
  }
}

export function checkCredentials(username: string, password: string): boolean {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return false;
  return username === adminUser && password === adminPass;
}
