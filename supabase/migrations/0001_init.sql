-- Reel Story Studio - Initial Schema Migration
-- Creates 8 tables with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Source items table
CREATE TABLE source_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  platform TEXT,
  url TEXT,
  community TEXT,
  original_author TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_source_items_project_id ON source_items(project_id);

-- Script versions table
CREATE TABLE script_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  structure_json JSONB,
  estimated_duration_sec INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_script_versions_project_id ON script_versions(project_id);
CREATE INDEX idx_script_versions_created_at ON script_versions(created_at DESC);

-- Audio assets table
CREATE TABLE audio_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('speaker', 'clone')),
  speaker_id TEXT,
  storage_path TEXT NOT NULL,
  duration_sec FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audio_assets_project_id ON audio_assets(project_id);
CREATE INDEX idx_audio_assets_created_at ON audio_assets(created_at DESC);

-- Video assets table
CREATE TABLE video_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  background_asset_id UUID REFERENCES background_assets(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  srt_path TEXT,
  render_settings_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_assets_project_id ON video_assets(project_id);
CREATE INDEX idx_video_assets_created_at ON video_assets(created_at DESC);

-- Background assets table
CREATE TABLE background_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  storage_path TEXT NOT NULL,
  duration_sec FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_background_assets_user_id ON background_assets(user_id);
CREATE INDEX idx_background_assets_tags ON background_assets USING GIN(tags);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('script', 'tts', 'render')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error TEXT,
  logs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Projects policies
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

-- Source items policies (inherits from projects)
CREATE POLICY "Users can view own source items"
  ON source_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = source_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own source items"
  ON source_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = source_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own source items"
  ON source_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = source_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own source items"
  ON source_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = source_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Script versions policies
CREATE POLICY "Users can view own script versions"
  ON script_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = script_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own script versions"
  ON script_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = script_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own script versions"
  ON script_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = script_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own script versions"
  ON script_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = script_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Audio assets policies
CREATE POLICY "Users can view own audio assets"
  ON audio_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = audio_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own audio assets"
  ON audio_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = audio_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own audio assets"
  ON audio_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = audio_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own audio assets"
  ON audio_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = audio_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Video assets policies
CREATE POLICY "Users can view own video assets"
  ON video_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = video_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own video assets"
  ON video_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = video_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own video assets"
  ON video_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = video_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own video assets"
  ON video_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = video_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Background assets policies
CREATE POLICY "Users can view own or shared background assets"
  ON background_assets FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own background assets"
  ON background_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own background assets"
  ON background_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own background assets"
  ON background_assets FOR DELETE
  USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = jobs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = jobs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = jobs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = jobs.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('backgrounds', 'backgrounds', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('projects', 'projects', false);

-- Storage policies for backgrounds bucket
CREATE POLICY "Authenticated users can view backgrounds"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'backgrounds' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload to own backgrounds folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'backgrounds'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own backgrounds"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'backgrounds'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for projects bucket
CREATE POLICY "Users can view own project files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'projects'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text OR
      (storage.foldername(name))[1] = 'oneoff'
    )
  );

CREATE POLICY "Users can upload to own project folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'projects'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text OR
      (storage.foldername(name))[1] = 'oneoff'
    )
  );

CREATE POLICY "Users can delete own project files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'projects'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text OR
      (storage.foldername(name))[1] = 'oneoff'
    )
  );
