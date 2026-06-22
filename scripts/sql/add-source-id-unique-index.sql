-- One-time: enforce dedup + enable upsert(onConflict: 'source_id').
-- A plain UNIQUE CONSTRAINT (not a partial index) is required for Supabase's
-- onConflict to work. PostgreSQL allows multiple NULLs in a unique constraint,
-- so legacy rows with NULL source_id are safely tolerated.
ALTER TABLE prompts ADD CONSTRAINT prompts_source_id_key UNIQUE (source_id);
