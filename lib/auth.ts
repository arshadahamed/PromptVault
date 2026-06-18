import { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

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
    const sig     = token.slice(lastDot + 1);
    const expected = await sign(payload);
    // Constant-time comparison — prevents timing attacks on HMAC signature
    const expBuf = Buffer.from(expected, 'hex');
    const sigBuf = Buffer.from(sig,      'hex');
    if (expBuf.length !== sigBuf.length) return false;
    if (!timingSafeEqual(expBuf, sigBuf)) return false;
    const exp = parseInt(payload.split(':')[1] || '0');
    return Math.floor(Date.now() / 1000) < exp;
  } catch {
    return false;
  }
}

// Constant-time string equality — prevents timing attacks on username/password
function safeEq(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  // Always run timingSafeEqual (even on length mismatch) to avoid length oracle
  if (A.length !== B.length) {
    timingSafeEqual(A, A);
    return false;
  }
  return timingSafeEqual(A, B);
}

export async function checkCredentials(username: string, password: string): Promise<boolean> {
  const adminUser = process.env.ADMIN_USERNAME;
  if (!adminUser) return false;
  if (!safeEq(username, adminUser)) return false;

  // Check dedicated credentials table for a bcrypt hash set via the UI
  try {
    const { data } = await supabase.from('admin_credentials').select('password_hash').eq('id', 1).maybeSingle();
    if (data?.password_hash) return bcrypt.compare(password, data.password_hash);
  } catch { /* fall through to env var */ }

  // Fall back to ADMIN_PASSWORD env var (plain-text, set at deploy time)
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) return false;
  return safeEq(password, adminPass);
}
