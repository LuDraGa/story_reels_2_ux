-- Backfill file_type for existing background_assets
-- Legacy assets uploaded without file_type should default to 'video'

UPDATE background_assets
SET file_type = 'video'
WHERE file_type IS NULL;

-- Also backfill file_name from name if missing
UPDATE background_assets
SET file_name = name
WHERE file_name IS NULL AND name IS NOT NULL;

-- Set a default file_size_mb if missing (0 means unknown)
UPDATE background_assets
SET file_size_mb = 0
WHERE file_size_mb IS NULL;
