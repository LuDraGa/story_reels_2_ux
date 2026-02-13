# Deployment Fixes & Production Setup

**Date**: 2025-02-09
**Status**: ✅ Complete
**Context**: Fixed critical deployment issues after initial Vercel deployment

---

## Summary

Successfully resolved all blocking issues preventing the app from working in production. The app is now fully functional with real Supabase credentials, database tables created, storage configured, and audio generation working end-to-end.

---

## Issues Resolved

### 1. Database Tables Missing ✅

**Problem**: No tables existed in Supabase - migration file was empty (0 bytes)

**Root Cause**:
- Previous migration `20260208211648_remote_schema.sql` was empty
- Tables were never created in remote database

**Solution**:
1. Deleted empty migration file
2. Created new migration: `supabase migration new initial_schema`
3. Added complete schema with 7 tables:
   - `projects`
   - `source_items`
   - `script_versions`
   - `audio_assets`
   - `video_assets`
   - `background_assets`
   - `jobs`
4. Fixed UUID function: Changed `uuid_generate_v4()` → `gen_random_uuid()` (Supabase default)
5. Pushed migration: `supabase db push`

**Files Changed**:
- `supabase/migrations/20260208211959_initial_schema.sql` (created)
- Deleted: `supabase/migrations/20260208211648_remote_schema.sql`

**Verification**:
```bash
supabase migration list
# Shows migration applied both locally and remotely
```

---

### 2. Script Module Not Editable ✅

**Problem**: After saving text in Ingest module, Script module remained empty/uneditable

**Root Cause**:
- `ScriptModule` and `IngestModule` used `useState(prop)` which only sets initial value
- When parent updated the prop, local state didn't sync
- Missing auto-copy logic from Ingest → Script

**Solution**:
1. Added `useEffect` to sync local state with props in both modules
2. Added `handleSourceTextSave` in project page to auto-copy to script (if empty)
3. Updated IngestModule to use new handler

**Files Changed**:
- `components/studio/ScriptModule.tsx` - Added `useEffect` to sync `script` prop
- `components/studio/IngestModule.tsx` - Added `useEffect` to sync `sourceText` prop
- `app/(app)/app/projects/[id]/page.tsx` - Added `handleSourceTextSave` handler

**Code Pattern**:
```typescript
// Before (broken)
const [text, setText] = useState(script)

// After (fixed)
const [text, setText] = useState(script)
useEffect(() => {
  setText(script)
}, [script])
```

---

### 3. Storage Buckets Not Created ✅

**Problem**: Audio generation failed with "Bucket not found" error

**Root Cause**:
- Storage buckets cannot be created via SQL migrations
- Must be created manually in Supabase Dashboard

**Solution**:
1. Created `projects` bucket (Private) - for audio/video files
2. Created `backgrounds` bucket (Public) - for background videos

**Steps**:
- Go to Supabase Dashboard → Storage → Buckets
- Click "New bucket"
- Name: `projects`, Privacy: Private
- Name: `backgrounds`, Privacy: Public

---

### 4. Storage Bucket Policies Missing ✅

**Problem**: Audio upload failed with 403/500 errors - "Policy not found"

**Root Cause**:
- Private storage buckets require RLS policies
- No policies existed on `projects` bucket
- Authenticated users couldn't upload files

**Solution**:
Added storage policies via Supabase Dashboard:

**Policy Configuration**:
- **Allowed operations**: SELECT, INSERT, UPDATE, DELETE
- **Target role**: `authenticated`
- **Policy definition**: `bucket_id = 'projects'`

This allows authenticated users to:
- Upload files (INSERT)
- Read files (SELECT)
- Update files (UPDATE)
- Delete files (DELETE)

---

### 5. Audio Playback Failed (Private Bucket) ✅

**Problem**:
- Audio uploaded successfully but couldn't play
- Player showed 0:00 duration
- 404 error: "Bucket not found"

**Root Cause**:
- `projects` bucket was set to Private
- Code used `getPublicUrl()` which only works for Public buckets
- Public URLs don't work for private buckets

**Solution**:
Updated TTS API route to use **signed URLs** instead of public URLs:

**Code Change** (`app/api/voice/tts/route.ts`):
```typescript
// Before (broken for private buckets)
const { data: urlData } = supabase.storage
  .from('projects')
  .getPublicUrl(storagePath)

// After (works for both public and private)
const { data: urlData, error: urlError } = await supabase.storage
  .from('projects')
  .createSignedUrl(storagePath, 31536000) // 1 year validity
```

**Why This Works**:
- Signed URLs include authentication token in URL
- Valid for 1 year (31536000 seconds)
- Works for both public and private buckets
- More secure than making bucket public

---

### 6. Audio Download Navigation Issue ✅

**Problem**:
- Clicking "Download" button navigated to audio URL in same tab
- Audio played in browser instead of downloading
- URL opened in player view, not downloaded

**Root Cause**:
- HTML `<a download>` attribute doesn't work for cross-origin URLs
- Supabase Storage URLs are cross-origin (different domain)
- Browser security restriction

**Solution**:
Fetch audio as blob, then download from blob URL (same-origin):

**Code Change** (`components/studio/ExportModule.tsx`):
```typescript
// Before (broken for cross-origin)
const link = document.createElement('a')
link.href = audioUrl // Cross-origin URL
link.download = `voiceover-${Date.now()}.wav`
link.click()

// After (works for cross-origin)
const response = await fetch(audioUrl)
const blob = await response.blob()
const blobUrl = URL.createObjectURL(blob)

const link = document.createElement('a')
link.href = blobUrl // Same-origin blob URL
link.download = `voiceover-${Date.now()}.wav`
link.click()

URL.revokeObjectURL(blobUrl) // Clean up
```

**Why This Works**:
- Fetch converts cross-origin URL to blob
- Blob URL is same-origin (created locally)
- `download` attribute works for same-origin URLs
- Cleans up blob URL after download

---

### 7. Documentation Added ✅

**Created New Documentation**:

**`docs/SUPABASE_MIGRATIONS.md`**:
- Complete Supabase CLI guide
- Essential commands (migration list, db push, db pull)
- Common workflows (initial setup, adding tables, troubleshooting)
- How to verify database state
- Current project schema reference
- Important notes (UUID functions, RLS policies, storage buckets)

**Updated `CLAUDE.md`**:
- Added deep-link to SUPABASE_MIGRATIONS.md in Quick Reference
- Updated Database section with migration commands reference
- Added Supabase migration commands to Development Commands
- Fixed migration file path in File Structure
- Added link in More Details section

---

## Technical Decisions

### Why Signed URLs (Not Public Bucket)?

**Considered Options**:
1. Make `projects` bucket public
2. Use signed URLs with private bucket

**Decision**: Signed URLs with private bucket

**Reasoning**:
- ✅ More secure (URLs expire, include auth token)
- ✅ Works with existing private bucket
- ✅ No additional Supabase configuration needed
- ✅ Can revoke access by changing keys
- ✅ Follows security best practices
- ❌ Public bucket would expose all files

**Trade-offs**:
- Signed URLs require server-side generation
- URLs are longer (include token)
- URLs expire (1 year is sufficient)

---

### Why Blob Download (Not Direct Link)?

**Considered Options**:
1. Direct `<a href={audioUrl} download>`
2. Fetch as blob, then download

**Decision**: Fetch as blob, then download

**Reasoning**:
- ✅ Works for cross-origin URLs (Supabase)
- ✅ Download attribute works on blob URLs
- ✅ Better user experience (actual download)
- ✅ No browser navigation
- ❌ Direct link only works for same-origin

**Trade-offs**:
- Slightly slower (fetch then download)
- Uses more memory (blob in browser)
- Requires async/await handling

---

## Migration Commands Reference

### Check Status
```bash
supabase migration list
```

### Push to Remote
```bash
supabase db push
```

### Pull from Remote
```bash
supabase db pull
```

### Create New Migration
```bash
supabase migration new migration_name
```

### Verify Remote State
```bash
supabase db remote shell
\dt  # List tables
\d+ projects  # Show table schema
```

### Repair History (if out of sync)
```bash
supabase migration repair --status reverted MIGRATION_ID
supabase migration repair --status applied MIGRATION_ID
```

---

## Files Modified

### Database
- ✅ `supabase/migrations/20260208211959_initial_schema.sql` (created)

### Components
- ✅ `components/studio/ScriptModule.tsx` (fixed prop sync)
- ✅ `components/studio/IngestModule.tsx` (fixed prop sync)
- ✅ `components/studio/ExportModule.tsx` (fixed download)

### API Routes
- ✅ `app/api/voice/tts/route.ts` (signed URLs)

### Pages
- ✅ `app/(app)/app/projects/[id]/page.tsx` (auto-copy logic)

### Documentation
- ✅ `docs/SUPABASE_MIGRATIONS.md` (created)
- ✅ `CLAUDE.md` (updated with migration references)

---

## Verification Checklist

### Database
- [x] Migration pushed to remote
- [x] All 7 tables created
- [x] RLS policies enabled on all tables
- [x] Migration shows in `supabase migration list`

### Storage
- [x] `projects` bucket created (Private)
- [x] `backgrounds` bucket created (Public)
- [x] Storage policies added for authenticated users
- [x] Policies allow INSERT, SELECT, UPDATE, DELETE

### Project Workspace
- [x] Can create projects
- [x] Can add text in Ingest module
- [x] Script auto-populates from Ingest
- [x] Can edit script
- [x] Script saves to database

### Audio Generation
- [x] Can select voice/speaker
- [x] Can generate audio (takes 1-2 minutes)
- [x] Audio uploads to Supabase Storage
- [x] Audio URL returned (signed URL)
- [x] Audio player shows correct duration
- [x] Can play audio in browser
- [x] Can download audio file

---

## Current Status

### ✅ Fully Functional
- Database tables created
- Storage buckets configured
- Project creation/management
- Script editing workflow
- Audio generation end-to-end
- Audio playback
- Audio download

### ⚠️ Known Limitations (MVP)
- Video rendering is stubbed (no real FFmpeg)
- No video thumbnails
- No automated tests
- Basic error handling

### 🚀 Ready For
- Production use
- User testing
- Feature development (video rendering)

---

## Next Steps (Post-MVP)

### Immediate
- [ ] Test full workflow with multiple projects
- [ ] Monitor Modal API costs
- [ ] Set up error tracking (Sentry)

### Soon
- [ ] Implement real FFmpeg video rendering
- [ ] Add video thumbnails in assets
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Optimize performance

### Later
- [ ] Mobile-specific UX improvements
- [ ] Version history UI for scripts
- [ ] Advanced rendering options
- [ ] Batch audio generation

---

## Lessons Learned

### Database Migrations
- ✅ Always verify migration file contents (not just existence)
- ✅ Use `gen_random_uuid()` for Supabase (not `uuid_generate_v4()`)
- ✅ Test migrations locally before pushing to prod
- ✅ Storage buckets must be created manually (not via SQL)

### Storage Configuration
- ✅ Private buckets require RLS policies
- ✅ Signed URLs are more secure than public buckets
- ✅ Test storage access after creating policies
- ✅ Verify bucket privacy settings match use case

### React State Management
- ✅ `useState(prop)` only sets initial value
- ✅ Use `useEffect` to sync state with props
- ✅ Consider when state should be controlled vs uncontrolled
- ✅ Test component re-renders with prop changes

### Cross-Origin Downloads
- ✅ HTML `download` attribute doesn't work cross-origin
- ✅ Fetch as blob first, then create blob URL
- ✅ Always clean up blob URLs (memory leak prevention)
- ✅ Add error handling for network failures

---

## Related Documentation

- **Migration Guide**: [docs/SUPABASE_MIGRATIONS.md](../docs/SUPABASE_MIGRATIONS.md)
- **Architecture**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **Main Config**: [CLAUDE.md](../CLAUDE.md)
- **Handoff Doc**: [HANDOFF.md](../HANDOFF.md)

---

**Deployment**: Vercel (auto-deploy on push)
**Database**: Supabase PostgreSQL
**Storage**: Supabase Storage (signed URLs)
**External API**: Modal Coqui TTS

**Status**: ✅ Production Ready
