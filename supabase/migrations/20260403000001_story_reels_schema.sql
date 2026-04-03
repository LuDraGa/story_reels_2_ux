-- Migration: Move all tables from public schema to story_reels schema
-- Data: test data only, no migration needed — tables are dropped and recreated

-- Drop old public schema tables (cascade removes dependent RLS policies)
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.video_assets CASCADE;
DROP TABLE IF EXISTS public.audio_assets CASCADE;
DROP TABLE IF EXISTS public.background_assets CASCADE;
DROP TABLE IF EXISTS public.script_versions CASCADE;
DROP TABLE IF EXISTS public.source_items CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS story_reels;

-- Grant schema-level access
GRANT USAGE ON SCHEMA story_reels TO anon, authenticated, service_role;

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS story_reels.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_reels.source_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES story_reels.projects(id) ON DELETE CASCADE,
  raw_text TEXT,
  platform TEXT,
  url TEXT,
  community TEXT,
  original_author TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_reels.script_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES story_reels.projects(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  structure_json JSONB,
  estimated_duration_sec INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_reels.audio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES story_reels.projects(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('speaker', 'clone')),
  speaker_id TEXT,
  storage_path TEXT NOT NULL,
  duration_sec FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_reels.background_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tags TEXT[],
  storage_path TEXT NOT NULL,
  duration_sec FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_reels.video_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES story_reels.projects(id) ON DELETE CASCADE,
  background_asset_id UUID REFERENCES story_reels.background_assets(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  srt_path TEXT,
  render_settings_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_reels.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES story_reels.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('script', 'tts', 'render')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  progress INTEGER DEFAULT 0,
  error TEXT,
  logs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE story_reels.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reels.source_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reels.script_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reels.audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reels.video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reels.background_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reels.jobs ENABLE ROW LEVEL SECURITY;

-- projects
CREATE POLICY "Users can view own projects"
  ON story_reels.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON story_reels.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON story_reels.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON story_reels.projects FOR DELETE
  USING (auth.uid() = user_id);

-- source_items
CREATE POLICY "Users can view own source_items"
  ON story_reels.source_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = source_items.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own source_items"
  ON story_reels.source_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = source_items.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own source_items"
  ON story_reels.source_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = source_items.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own source_items"
  ON story_reels.source_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = source_items.project_id AND projects.user_id = auth.uid()
  ));

-- script_versions
CREATE POLICY "Users can view own script_versions"
  ON story_reels.script_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = script_versions.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own script_versions"
  ON story_reels.script_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = script_versions.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own script_versions"
  ON story_reels.script_versions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = script_versions.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own script_versions"
  ON story_reels.script_versions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = script_versions.project_id AND projects.user_id = auth.uid()
  ));

-- audio_assets
CREATE POLICY "Users can view own audio_assets"
  ON story_reels.audio_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = audio_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own audio_assets"
  ON story_reels.audio_assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = audio_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own audio_assets"
  ON story_reels.audio_assets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = audio_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own audio_assets"
  ON story_reels.audio_assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = audio_assets.project_id AND projects.user_id = auth.uid()
  ));

-- background_assets
CREATE POLICY "Users can view own background_assets"
  ON story_reels.background_assets FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own background_assets"
  ON story_reels.background_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own background_assets"
  ON story_reels.background_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own background_assets"
  ON story_reels.background_assets FOR DELETE
  USING (auth.uid() = user_id);

-- video_assets
CREATE POLICY "Users can view own video_assets"
  ON story_reels.video_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = video_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own video_assets"
  ON story_reels.video_assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = video_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own video_assets"
  ON story_reels.video_assets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = video_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own video_assets"
  ON story_reels.video_assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM story_reels.projects
    WHERE projects.id = video_assets.project_id AND projects.user_id = auth.uid()
  ));

-- jobs
CREATE POLICY "Users can view own jobs"
  ON story_reels.jobs FOR SELECT
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM story_reels.projects
      WHERE projects.id = jobs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own jobs"
  ON story_reels.jobs FOR INSERT
  WITH CHECK (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM story_reels.projects
      WHERE projects.id = jobs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own jobs"
  ON story_reels.jobs FOR UPDATE
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM story_reels.projects
      WHERE projects.id = jobs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own jobs"
  ON story_reels.jobs FOR DELETE
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM story_reels.projects
      WHERE projects.id = jobs.project_id AND projects.user_id = auth.uid()
    )
  );

-- ============================================================
-- Grant table-level permissions
-- ============================================================

GRANT ALL ON ALL TABLES IN SCHEMA story_reels TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA story_reels TO anon, authenticated, service_role;
