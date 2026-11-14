-- Run once in the Supabase SQL Editor to enforce Row-Level Security and
-- add composite partial + trigram indexes for fast gallery & search queries.

-- 1. Security: lock down private tables and allow public reads only on published prompts & categories
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny public access to admin_credentials" ON public.admin_credentials;
CREATE POLICY "Deny public access to admin_credentials"
  ON public.admin_credentials FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Deny public access to settings" ON public.settings;
CREATE POLICY "Deny public access to settings"
  ON public.settings FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Public read published prompts" ON public.prompts;
CREATE POLICY "Public read published prompts"
  ON public.prompts FOR SELECT TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);

DO $$
BEGIN
  IF to_regclass('public.sync_runs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Deny public access to sync_runs" ON public.sync_runs';
    EXECUTE 'CREATE POLICY "Deny public access to sync_runs" ON public.sync_runs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

-- 2. Performance: partial composite indexes matching gallery/API sorts + trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_prompts_pub_featured_created
  ON public.prompts (featured DESC, created_at DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_prompts_pub_created
  ON public.prompts (created_at DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_prompts_pub_likes
  ON public.prompts (likes DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_prompts_pub_tab_featured_created
  ON public.prompts (tab, featured DESC, created_at DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_prompts_pub_tab_created
  ON public.prompts (tab, created_at DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_prompts_pub_tab_likes
  ON public.prompts (tab, likes DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_prompts_pub_cat_featured
  ON public.prompts (category, featured DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_prompts_prompt_text_trgm
  ON public.prompts USING gin (prompt_text extensions.gin_trgm_ops)
  WHERE published = true;
