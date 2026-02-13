-- ============================================================================
-- Storage RLS Policies Setup
-- ============================================================================
-- Creates RLS policies for file uploads/downloads
--
-- NOTE: Buckets "backgrounds" and "projects" already exist (created manually)
-- This migration only adds the missing RLS policies
--
-- Buckets:
-- 1. "backgrounds" - Background video/audio assets (legacy system)
-- 2. "projects" - Project files: audio, video, captions (new system)
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload to own backgrounds folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own projects" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous can upload to oneoff folder" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous can read oneoff files" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous can delete oneoff files" ON storage.objects;

-- ============================================================================
-- RLS Policies for "backgrounds" bucket
-- ============================================================================

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own backgrounds folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own backgrounds"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- RLS Policies for "projects" bucket
-- ============================================================================

-- Allow authenticated users to upload to their own projects
CREATE POLICY "Users can upload to own projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'projects' AND
  (
    -- User's own project folder: projects/{user_id}/...
    (storage.foldername(name))[1] = 'projects' AND
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- User's asset folder: assets/videos/{user_id}/... or assets/audios/{user_id}/...
    (storage.foldername(name))[1] = 'assets' AND
    (storage.foldername(name))[3] = auth.uid()::text
  )
);

-- Allow authenticated users to read their own project files
CREATE POLICY "Users can read own projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'projects' AND
  (
    -- User's own project folder
    (storage.foldername(name))[1] = 'projects' AND
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- User's asset folder
    (storage.foldername(name))[1] = 'assets' AND
    (storage.foldername(name))[3] = auth.uid()::text
  )
);

-- Allow authenticated users to update their own project files
CREATE POLICY "Users can update own projects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'projects' AND
  (
    -- User's own project folder
    (storage.foldername(name))[1] = 'projects' AND
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- User's asset folder
    (storage.foldername(name))[1] = 'assets' AND
    (storage.foldername(name))[3] = auth.uid()::text
  )
);

-- Allow authenticated users to delete their own project files
CREATE POLICY "Users can delete own projects"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'projects' AND
  (
    -- User's own project folder
    (storage.foldername(name))[1] = 'projects' AND
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- User's asset folder
    (storage.foldername(name))[1] = 'assets' AND
    (storage.foldername(name))[3] = auth.uid()::text
  )
);

-- ============================================================================
-- Allow anonymous/one-off studio uploads to "projects" bucket
-- ============================================================================

-- Allow anonymous users (one-off studio) to upload to oneoff folder
CREATE POLICY "Anonymous can upload to oneoff folder"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'projects' AND
  (storage.foldername(name))[1] = 'projects' AND
  (storage.foldername(name))[2] = 'oneoff'
);

-- Allow anonymous users to read oneoff files (they need session ID to access)
CREATE POLICY "Anonymous can read oneoff files"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'projects' AND
  (storage.foldername(name))[1] = 'projects' AND
  (storage.foldername(name))[2] = 'oneoff'
);

-- Allow anonymous users to delete oneoff files (for cleanup)
CREATE POLICY "Anonymous can delete oneoff files"
ON storage.objects FOR DELETE
TO anon
USING (
  bucket_id = 'projects' AND
  (storage.foldername(name))[1] = 'projects' AND
  (storage.foldername(name))[2] = 'oneoff'
);
