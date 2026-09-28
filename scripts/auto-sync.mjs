/**
 * auto-sync.mjs — Wrapper for scheduled meigen.ai → Supabase sync
 * Appends a dated log to scripts/auto-sync-log.txt on every run.
 * Usage: node scripts/auto-sync.mjs [--sort=newest|all]
 */

import { appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { main } from './scrape-meigen.mjs';

const __dir  = dirname(fileURLToPath(import.meta.url));
const logFile = join(__dir, 'auto-sync-log.txt');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(logFile, line + '\n'); } catch {}
}

log('=== Auto-sync started ===');

try {
  await main();
  log('=== Auto-sync finished successfully ===');
} catch (e) {
  log(`=== Auto-sync FAILED: ${e.message} ===`);
  process.exit(1);
}
