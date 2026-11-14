-- Additive schema migration for Vibe Coding Website UI/UX prompts
-- Safe to run multiple times (idempotent). Does not alter existing rows.

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS code_snippet text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS code_language text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stack_tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preview_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS has_code boolean GENERATED ALWAYS AS (length(btrim(code_snippet)) > 0) STORED;

INSERT INTO public.categories (id, name)
VALUES ('cat_11', 'Vibe Coding')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_prompts_pub_vibecoding
  ON public.prompts (featured DESC, created_at DESC)
  WHERE published = true AND (tab = 'Vibe Coding' OR category = 'Vibe Coding');

CREATE INDEX IF NOT EXISTS idx_prompts_pub_has_code
  ON public.prompts (featured DESC, created_at DESC)
  WHERE published = true AND has_code = true;

CREATE INDEX IF NOT EXISTS idx_prompts_stack_tags
  ON public.prompts USING gin (stack_tags);
