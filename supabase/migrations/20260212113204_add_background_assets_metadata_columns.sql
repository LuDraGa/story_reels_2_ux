-- Add missing metadata columns to background_assets table
-- These columns are used by the new asset management system

ALTER TABLE background_assets
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS file_size_mb FLOAT;

-- Backfill file_name from name column for existing rows
UPDATE background_assets
SET file_name = name
WHERE file_name IS NULL AND name IS NOT NULL;
