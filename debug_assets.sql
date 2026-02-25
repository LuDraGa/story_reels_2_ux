-- Check existing background_assets and their storage paths
SELECT 
  id,
  file_name,
  file_type,
  storage_path,
  duration_sec,
  created_at
FROM background_assets
ORDER BY created_at DESC
LIMIT 10;
