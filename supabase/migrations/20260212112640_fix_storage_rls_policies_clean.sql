-- FIX Storage RLS Policies - Correct Folder Indices
-- The previous migration had incorrect folder indices
--
-- Path: backgrounds/{user_id}/file.mp4 => folders[1]='backgrounds', folders[2]=user_id
-- Path: assets/videos/{user_id}/file.mp4 => folders[1]='assets', folders[3]=user_id
-- Path: projects/{user_id}/file.mp4 => folders[1]='projects', folders[2]=user_id

-- Drop all existing policies
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

-- Policies for backgrounds bucket (path: backgrounds/{user_id}/...)
CREATE POLICY "Users can upload to own backgrounds folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backgrounds' AND
  (storage.foldername(name))[1] = 'backgrounds' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read own backgrounds"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'backgrounds' AND
  (storage.foldername(name))[1] = 'backgrounds' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update own backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'backgrounds' AND
  (storage.foldername(name))[1] = 'backgrounds' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backgrounds' AND
  (storage.foldername(name))[1] = 'backgrounds' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policies for projects bucket
CREATE POLICY "Users can upload to own projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'projects' AND
  (
    (
      (storage.foldername(name))[1] = 'projects' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
    OR
    (
      (storage.foldername(name))[1] = 'assets' AND
      (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can read own projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'projects' AND
  (
    (
      (storage.foldername(name))[1] = 'projects' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
    OR
    (
      (storage.foldername(name))[1] = 'assets' AND
      (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can update own projects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'projects' AND
  (
    (
      (storage.foldername(name))[1] = 'projects' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
    OR
    (
      (storage.foldername(name))[1] = 'assets' AND
      (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can delete own projects"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'projects' AND
  (
    (
      (storage.foldername(name))[1] = 'projects' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
    OR
    (
      (storage.foldername(name))[1] = 'assets' AND
      (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);

-- Policies for anonymous oneoff studio
CREATE POLICY "Anonymous can upload to oneoff folder"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'projects' AND
  (storage.foldername(name))[1] = 'projects' AND
  (storage.foldername(name))[2] = 'oneoff'
);

CREATE POLICY "Anonymous can read oneoff files"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'projects' AND
  (storage.foldername(name))[1] = 'projects' AND
  (storage.foldername(name))[2] = 'oneoff'
);

CREATE POLICY "Anonymous can delete oneoff files"
ON storage.objects FOR DELETE
TO anon
USING (
  bucket_id = 'projects' AND
  (storage.foldername(name))[1] = 'projects' AND
  (storage.foldername(name))[2] = 'oneoff'
);
