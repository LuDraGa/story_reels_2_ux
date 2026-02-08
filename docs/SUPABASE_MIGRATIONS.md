# Supabase Migrations Guide

## Prerequisites

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

## Essential Commands

### Check Migration Status

```bash
# List all migrations (local and remote)
supabase migration list

# Output shows:
#   Local          | Remote         | Time (UTC)
#  ----------------|----------------|---------------------
#   20260208211959 | 20260208211959 | 2026-02-08 21:19:59
```

### Pull Remote Schema

```bash
# Pull remote database schema to local migration file
# Note: Requires Docker Desktop running
supabase db pull

# Creates a new migration file with remote schema differences
```

### Push Migrations to Remote

```bash
# Push all pending local migrations to remote database
supabase db push

# This will:
# 1. Show which migrations will be applied
# 2. Ask for confirmation [Y/n]
# 3. Apply migrations in order
# 4. Update migration history table
```

### Create New Migration

```bash
# Create a new empty migration file
supabase migration new migration_name

# Creates: supabase/migrations/TIMESTAMP_migration_name.sql
# Then edit the file with your schema changes
```

### Check Remote Database State

```bash
# Option 1: Use Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
# Check: Table Editor to see all tables

# Option 2: Use psql (direct database connection)
supabase db remote shell

# Then run SQL queries:
# \dt           -- List all tables
# \d+ projects  -- Show table schema
# SELECT * FROM projects LIMIT 5;
```

### Repair Migration History

```bash
# If migration history gets out of sync, mark a migration as applied/reverted

# Mark as applied (already run on remote)
supabase migration repair --status applied MIGRATION_TIMESTAMP

# Mark as reverted (needs to be re-run)
supabase migration repair --status reverted MIGRATION_TIMESTAMP

# Example:
supabase migration repair --status reverted 20260208211648
```

## Common Workflows

### Initial Setup (New Developer)

```bash
# 1. Install and login
brew install supabase/tap/supabase
supabase login

# 2. Link to project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Check what migrations exist
supabase migration list

# 4. If remote is ahead, pull schema
supabase db pull

# 5. If local is ahead, push migrations
supabase db push
```

### Adding New Tables/Columns

```bash
# 1. Create new migration
supabase migration new add_user_profiles

# 2. Edit the generated file:
#    supabase/migrations/TIMESTAMP_add_user_profiles.sql

# 3. Add your SQL:
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

# 4. Push to remote
supabase db push

# 5. Verify tables exist
supabase migration list
```

### Troubleshooting Out-of-Sync State

```bash
# Scenario: Remote has migration that local doesn't recognize

# 1. Check current state
supabase migration list

# 2. If migration exists remotely but local file is wrong:
#    Option A: Mark as reverted and re-run
supabase migration repair --status reverted MIGRATION_ID
supabase db push

#    Option B: Pull remote schema to local
supabase db pull
```

### Verify Database State After Migration

```bash
# 1. Check migration was applied
supabase migration list
# Look for migration in both Local and Remote columns

# 2. Connect to remote database
supabase db remote shell

# 3. Verify tables exist
\dt

# 4. Check table structure
\d+ projects
\d+ script_versions
\d+ audio_assets

# 5. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('projects', 'script_versions', 'audio_assets')
ORDER BY tablename, policyname;

# 6. Exit psql
\q
```

## Current Project Schema

**Tables** (7 total):
- `projects` - User projects
- `source_items` - Raw ingested text
- `script_versions` - Script edits with version history
- `audio_assets` - Generated audio files
- `video_assets` - Rendered videos
- `background_assets` - Background video library
- `jobs` - Async job queue

**RLS Policies**: Enabled on all tables with user-scoped access

**Storage Buckets**:
- `backgrounds` - Background videos (public/authenticated)
- `projects` - Audio and video files (private, per-user)

**Migration File**: `supabase/migrations/20260208211959_initial_schema.sql`

## Important Notes

### UUID Functions

Supabase uses `gen_random_uuid()` by default (not `uuid_generate_v4()`).

❌ Wrong:
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);
```

✅ Correct:
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
```

### Storage Buckets

Storage buckets are NOT created via migrations. Create them manually:

1. Go to Supabase Dashboard → Storage
2. Create bucket: `backgrounds` (public)
3. Create bucket: `projects` (private)

### RLS Policies

Always enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Migration Naming

Use descriptive, snake_case names:
- ✅ `add_user_profiles`
- ✅ `add_tags_to_assets`
- ✅ `create_notifications_table`
- ❌ `migration1`
- ❌ `update`

## Quick Reference

| Command | Purpose |
|---------|---------|
| `supabase login` | Authenticate CLI |
| `supabase link` | Connect to remote project |
| `supabase migration list` | Check migration status |
| `supabase migration new NAME` | Create new migration |
| `supabase db push` | Apply local migrations to remote |
| `supabase db pull` | Pull remote schema to local |
| `supabase db remote shell` | Connect to remote database (psql) |
| `supabase migration repair --status STATUS ID` | Fix migration history |

## Related Files

- **Migration**: `supabase/migrations/20260208211959_initial_schema.sql`
- **Schema Docs**: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- **Environment Vars**: `.env.local`
