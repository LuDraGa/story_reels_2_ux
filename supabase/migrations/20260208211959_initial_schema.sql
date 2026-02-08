-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Source items table
CREATE TABLE IF NOT EXISTS source_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  raw_text TEXT,
  platform TEXT,
  url TEXT,
  community TEXT,
  original_author TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Script versions table
CREATE TABLE IF NOT EXISTS script_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  structure_json JSONB,
  estimated_duration_sec INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audio assets table
CREATE TABLE IF NOT EXISTS audio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('speaker', 'clone')),
  speaker_id TEXT,
  storage_path TEXT NOT NULL,
  duration_sec FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Background assets table
CREATE TABLE IF NOT EXISTS background_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tags TEXT[],
  storage_path TEXT NOT NULL,
  duration_sec FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Video assets table
CREATE TABLE IF NOT EXISTS video_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  background_asset_id UUID REFERENCES background_assets(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  srt_path TEXT,
  render_settings_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('script', 'tts', 'render')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  progress INTEGER DEFAULT 0,
  error TEXT,
  logs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for source_items
CREATE POLICY "Users can view own source_items"
  ON source_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = source_items.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own source_items"
  ON source_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = source_items.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own source_items"
  ON source_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = source_items.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own source_items"
  ON source_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = source_items.project_id AND projects.user_id = auth.uid()
  ));

-- RLS Policies for script_versions
CREATE POLICY "Users can view own script_versions"
  ON script_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = script_versions.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own script_versions"
  ON script_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = script_versions.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own script_versions"
  ON script_versions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = script_versions.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own script_versions"
  ON script_versions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = script_versions.project_id AND projects.user_id = auth.uid()
  ));

-- RLS Policies for audio_assets
CREATE POLICY "Users can view own audio_assets"
  ON audio_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = audio_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own audio_assets"
  ON audio_assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = audio_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own audio_assets"
  ON audio_assets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = audio_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own audio_assets"
  ON audio_assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = audio_assets.project_id AND projects.user_id = auth.uid()
  ));

-- RLS Policies for video_assets
CREATE POLICY "Users can view own video_assets"
  ON video_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = video_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own video_assets"
  ON video_assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = video_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own video_assets"
  ON video_assets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = video_assets.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own video_assets"
  ON video_assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = video_assets.project_id AND projects.user_id = auth.uid()
  ));

-- RLS Policies for background_assets
CREATE POLICY "Users can view own background_assets"
  ON background_assets FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own background_assets"
  ON background_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own background_assets"
  ON background_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own background_assets"
  ON background_assets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for jobs
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = jobs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = jobs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = jobs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = jobs.project_id AND projects.user_id = auth.uid()
    )
  );

-- Create storage buckets (Note: Storage buckets are typically managed via Supabase Dashboard or API)
-- This is for documentation purposes
-- Buckets needed:
-- 1. "backgrounds" - for background video loops (public or authenticated)
-- 2. "projects" - for audio assets and video renders (private, per-user)
