# Design: Incremental meigen.ai Prompt Scraper

**Date:** 2026-06-22
**Project:** meigen-gallery (PromptVault)
**Status:** Approved (pending spec review)

## Goal

A reusable script that scrapes **new** AI prompts + their images from meigen.ai
and ingests them into the production database (Supabase `prompts` table) with
images mirrored to Cloudflare R2 — keeping the gallery fresh without manual entry.

## Decisions (locked with user)

| Question | Decision |
| --- | --- |
| Image storage | **Mirror to Cloudflare R2** (matches all 1977 existing rows) |
| Scrape scope | **Incremental** — only `source_id`s not already in DB |
| Deliverable | **Reusable script** `scripts/scrape-meigen.mjs` |
| Multi-image tweets | **First image only** (`/0.jpg`), one prompt = one row |
| Dedup guarantee | **Add `UNIQUE(source_id)` index** + `upsert(onConflict)` |

## Data source

meigen.ai is Cloudflare bot-protected (plain `fetch` → 403). Its gallery is
backed by an internal JSON API discovered via browser network capture:

```
GET https://www.meigen.ai/api/images?sort={newest|featured|popular}&offset=N&limit=20
```

Response shape:

```jsonc
{
  "images": [{
    "id": "2068539170935738802",         // tweet id → source_id (dedup key)
    "image": "https://images.meigen.ai/tweets/<id>/0.jpg",
    "images": ["...0.jpg", "...1.jpg"],   // multi-image; we use [0] only
    "prompt": "Ultra-detailed caricature ...",
    "promptReady": true,                   // skip if false / empty prompt
    "title": "Ultra-detailed ...",
    "author": { "name": "Simply Ray", "username": "kingofdairyque", ... },
    "stats": { "likes": 145, "views": 5595, "retweets": 15 },
    "model": "GPT Image",
    "imageWidth": 676, "imageHeight": 1200,
    "source": "twitter"
  }],
  "hasMore": true,
  "totalCount": 2587
}
```

As of design time: `totalCount` ≈ **2587** vs **1977** rows in DB → ~600 candidates.

Images are served from `images.meigen.ai` (separate CDN, no bot wall).

## Architecture

Single ESM script `scripts/scrape-meigen.mjs`, following the conventions of the
existing `scripts/migrate-to-supabase.mjs`:

- Manual `.env.local` loader (same code block).
- Supabase **service-role** client (`@supabase/supabase-js`).
- R2 **S3 client** (`@aws-sdk/client-s3`).
- meigen API driven from inside a **stealth Chromium** page
  (`playwright-extra` + `playwright-extra-plugin-stealth`, already deps) —
  navigate once to `https://www.meigen.ai/` to obtain Cloudflare clearance, then
  run the paging fetch loop via `page.evaluate(fetch ...)`, which is proven to
  return 200 in recon.

### Data flow

```
1. Load existing source_ids  → paginate SELECT source_id FROM prompts → Set<string>
2. Launch stealth browser, navigate to meigen.ai (clearance)
3. Page the API (sort=newest, limit=20), offset += 20:
     - map each item; keep where id ∉ Set AND prompt non-empty AND promptReady
     - STOP when a full page yields 0 new ids, or hasMore=false, or --limit reached
4. Per new item:
     a. download images.meigen.ai/tweets/<id>/0.jpg (via node fetch)
     b. HEAD R2 key "<id>.jpg" — skip upload if it already exists
     c. PutObject to R2 (ContentType image/jpeg)
     d. build prompt row
5. Batch upsert rows into Supabase prompts (chunks of 100, onConflict source_id)
6. Print summary: scanned / new / uploaded / inserted / skipped / unmapped-models
```

## Field mapping (meigen item → `prompts` row)

| meigen | column | rule |
| --- | --- | --- |
| `id` | `source_id` | dedup key / onConflict target |
| (generated) | `id` | `p` + zero-padded sequential from current max id |
| `prompt` | `prompt_text` | **skip row** if empty or `promptReady !== true` |
| `image` | `image_url` | original meigen CDN url (kept for reference) |
| R2 upload | `local_img` | `${R2_PUBLIC_URL}/<id>.jpg` |
| `author.name` | `author_name` | fallback `'Unknown'` |
| `author.username` | `handle` | raw, no `@` prefix |
| `model` (mapped) | `model`, `tab`, `category` | see map below |
| `stats.likes` | `likes` | fallback 0 |
| `stats.views` | `views` | fallback 0 |
| `imageWidth/imageHeight` | `aspect_ratio` | `"<w>/<h>"`, fallback `"4/3"` |
| (deterministic) | `gradient_from`, `gradient_to` | pastel palette hashed from `id` |
| const | `featured` | `false` |
| const | `published` | `true` |

### Model → (model / tab / category)

| meigen `model` (matched case-insensitively, prefix) | model | tab | category |
| --- | --- | --- | --- |
| `GPT Image`, `ChatGPT`, `DALL-E` | ChatGPT | ChatGPT | ChatGPT |
| `Nanobanana*` | Nanobanana Pro | Nanobanana | Nanobanana |
| `Midjourney*` | Midjourney | Midjourney | Midjourney |
| `Seedance*` | Seedance 2.0 | Seedance | Seedance |
| `Flux*` | Flux | Flux | Flux |
| `Gemini*` | Gemini | Gemini | Gemini |
| **fallback (unmatched)** | ChatGPT | ChatGPT | ChatGPT |

- Unmatched models are still ingested under the ChatGPT fallback **and** logged
  as `⚠ unmapped model: "<value>"` so the map can be extended later.
- `Seedance`/`Flux` are used as `tab` values even though absent from the current
  `Tab` TS union — this follows the **stored data** (existing rows already use
  them), not the stale type. No type change required for the script (it writes
  raw rows), but `lib/types.ts` Tab union may later be widened (out of scope).

### Gradient palette

The 12 pastel `from>to` pairs observed in `data/db.json` (e.g. `#b4d4f5>#f5d4b4`)
— **not** the vivid palette in `lib/utils.ts` (which the production data does not
use). Assigned deterministically: `hash(id) % 12`. Exact reproduction of the
original per-id assignment is not required; matching the palette keeps new cards
visually consistent with existing ones.

## Safety & idempotency

- **`--dry-run`**: fetch + map + report counts and a sample row; **no** writes to
  Supabase or R2. Run first against production before any real write; show numbers
  to user for confirmation.
- **`--limit=N`**: cap number of new prompts processed this run.
- **`--sort=newest|featured|popular`**: default `newest`.
- Idempotent re-runs: existing `source_id`s skipped in-memory; R2 objects skipped
  if key exists; DB insert via `upsert(onConflict: 'source_id')`.
- Politeness: short delay between API pages; retry-once on transient fetch errors;
  continue-on-error per item (one bad image/row never aborts the batch).

### Precondition: DB schema

The `prompts` table must have a `source_id TEXT` column (already inserted by the
existing migration script) and a **unique index**:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS prompts_source_id_key
  ON prompts (source_id)
  WHERE source_id IS NOT NULL;
```

Implementation will verify the column exists and apply this index (partial, to
tolerate legacy null `source_id` rows if any) before the first real ingest.

## Out of scope

- Backfilling all ~2587 historical prompts (this run is incremental only).
- Scheduling/cron automation (script is re-runnable by hand; scheduling later).
- Widening `lib/types.ts` Tab/Category unions.
- Mirroring secondary images from multi-image tweets.

## Files

- **New:** `scripts/scrape-meigen.mjs`
- **New (if needed):** one-time SQL for the unique index (run via Supabase or a
  guarded step in the script).
