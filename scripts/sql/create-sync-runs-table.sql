-- Run once in the Supabase SQL editor to enable audit logging for the sync script.
-- The sync script writes to this table non-fatally — if the table doesn't exist the sync
-- run completes normally and only writes to the local scripts/sync-log.json file.

CREATE TABLE IF NOT EXISTS sync_runs (
  id          SERIAL PRIMARY KEY,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort        TEXT,
  scanned     INTEGER DEFAULT 0,
  inserted    INTEGER DEFAULT 0,
  skipped     INTEGER DEFAULT 0,
  fallback    INTEGER DEFAULT 0,
  uploaded    INTEGER DEFAULT 0,
  errors      JSONB    DEFAULT '[]'::jsonb,
  dry_run     BOOLEAN  DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: restrict direct reads to the service role only
-- ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
