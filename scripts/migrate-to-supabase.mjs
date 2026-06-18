import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..');

// Load .env.local
try {
  const env = readFileSync(join(root, '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const eq = line.indexOf('=');
    if (eq < 1 || line.startsWith('#')) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found — assume env vars already set */ }

// Validate env
const required = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','CLOUDFLARE_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME','R2_PUBLIC_URL'];
for (const k of required) {
  if (!process.env[k]) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const R2_BUCKET     = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL.replace(/\/$/, '');

// Read local data
const dbPath = join(root, 'data', 'db.json');
const db = JSON.parse(readFileSync(dbPath, 'utf8'));
const prompts    = db.prompts    || [];
const categories = db.categories || [];

const settingsPath = join(root, 'data', 'settings.json');
const settings = existsSync(settingsPath)
  ? JSON.parse(readFileSync(settingsPath, 'utf8'))
  : {};

console.log(`\n=== PromptVault → Supabase + R2 Migration ===`);
console.log(`Prompts: ${prompts.length}, Categories: ${categories.length}`);

// 1. Insert categories
console.log('\n[1/4] Inserting categories...');
let catOk = 0, catSkip = 0;
for (const cat of categories) {
  const { error } = await supabase
    .from('categories')
    .upsert({ id: cat.id, name: cat.name, created_at: cat.createdAt });
  if (error) { console.warn(`  ⚠ category ${cat.name}: ${error.message}`); catSkip++; }
  else catOk++;
}
console.log(`  ✓ ${catOk} inserted, ${catSkip} failed`);

// 2. Insert prompts (in batches of 100)
console.log('\n[2/4] Inserting prompts...');
let pOk = 0, pSkip = 0;
const BATCH = 100;
for (let i = 0; i < prompts.length; i += BATCH) {
  const batch = prompts.slice(i, i + BATCH).map((p) => ({
    id:           p.id,
    source_id:    p.sourceId   ?? null,
    prompt_text:  p.promptText || '',
    image_url:    p.imageUrl   || '',
    local_img:    p.localImg   || '',
    author_name:  p.authorName || 'Admin',
    handle:       p.handle     || '@admin',
    model:        p.model      || 'ChatGPT',
    tab:          p.tab        || 'ChatGPT',
    category:     p.category   || 'ChatGPT',
    likes:        p.likes      || 0,
    views:        p.views      || 0,
    gradient_from: p.gradientFrom || '#d4f5b4',
    gradient_to:   p.gradientTo   || '#f5b4e8',
    aspect_ratio:  p.aspectRatio  || '4/3',
    featured:     p.featured  ?? false,
    published:    p.published ?? true,
    created_at:   p.createdAt || new Date().toISOString(),
    updated_at:   p.updatedAt || new Date().toISOString(),
  }));
  const { error } = await supabase.from('prompts').upsert(batch);
  if (error) {
    console.warn(`  ⚠ batch ${i}–${i + batch.length}: ${error.message}`);
    pSkip += batch.length;
  } else {
    pOk += batch.length;
    process.stdout.write(`\r  ✓ ${pOk}/${prompts.length}`);
  }
}
console.log(`\n  Done: ${pOk} inserted, ${pSkip} failed`);

// 3. Upsert settings
console.log('\n[3/4] Upserting settings...');
const { error: sErr } = await supabase
  .from('settings')
  .upsert({ id: 1, data: settings, updated_at: settings.updatedAt || new Date().toISOString() });
if (sErr) console.warn(`  ⚠ settings: ${sErr.message}`);
else      console.log('  ✓ settings saved');

// 4. Upload images to R2 and update local_img in Supabase
const imgDir = join(root, 'public', 'images');
const imageExists = existsSync(imgDir);
if (!imageExists) {
  console.log('\n[4/4] No public/images directory found — skipping image upload');
} else {
  const files = readdirSync(imgDir);
  console.log(`\n[4/4] Uploading ${files.length} images to R2...`);
  let imgOk = 0, imgSkip = 0;

  for (const file of files) {
    try {
      const { readFileSync: rfs } = await import('fs');
      const buf  = rfs(join(imgDir, file));
      const ext  = file.split('.').pop()?.toLowerCase() || '';
      const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }[ext] || 'application/octet-stream';

      await r2.send(new PutObjectCommand({
        Bucket:      R2_BUCKET,
        Key:         file,
        Body:        buf,
        ContentType: mime,
      }));

      const newUrl = `${R2_PUBLIC_URL}/${file}`;
      await supabase
        .from('prompts')
        .update({ local_img: newUrl })
        .eq('local_img', `/images/${file}`);

      imgOk++;
      if (imgOk % 50 === 0) process.stdout.write(`\r  ✓ ${imgOk}/${files.length}`);
    } catch (e) {
      console.warn(`\n  ⚠ ${file}: ${e.message}`);
      imgSkip++;
    }
  }
  console.log(`\n  Done: ${imgOk} uploaded, ${imgSkip} failed`);
}

console.log('\n=== Migration complete ===\n');
