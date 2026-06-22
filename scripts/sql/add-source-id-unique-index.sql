-- One-time: enforce dedup + enable upsert(onConflict: 'source_id').
-- Partial index tolerates any legacy NULL source_id rows.
CREATE UNIQUE INDEX IF NOT EXISTS prompts_source_id_key
  ON prompts (source_id)
  WHERE source_id IS NOT NULL;
