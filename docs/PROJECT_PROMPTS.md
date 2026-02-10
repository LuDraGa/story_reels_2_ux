# Project Prompts History

This document tracks the original prompts used to build this project, in chronological order. Use this to understand the project requirements and evolution across sessions.

---

## Prompt 1: Initial Project Build (Phase 1-9)

**Date**: 2026-02-08
**Status**: ✅ Complete (95% - video rendering stubbed)

### Requirements

Build a production-lean "Reel Story Studio" web app using Next.js (App Router) + React + Tailwind + shadcn/ui. Host on Vercel. Use Supabase for Auth + Postgres + Storage.

**CORE IDEA / UX**: This is a modular story→audio→reel pipeline. Each project supports step-by-step modules (Ingest → Script → TTS → Video → Export). User can run each module independently OR run end-to-end automatically.

**DESIGN REQUIREMENT**: Match a calm, peaceful, minimalist aesthetic similar to a soft Lovable-style portfolio: off-white background, subtle radial gradients, rounded-2xl cards, thin borders, soft shadows, lots of whitespace, muted accent colors (sage/lavender/mist-blue), gentle hover lift, no harsh contrast. Keep typography airy, with relaxed heading sizes and comfortable line-height.

### Routes / Pages

1. `/` = One-off Studio (NO login required): user can paste text → generate script → TTS → render reel → preview → download. Persist one-off state in localStorage so refresh doesn't lose work.
2. `/login` = Supabase auth (email magic link or email+password; pick one and scaffold).
3. `/app` = Auth-gated Projects Dashboard backed by Supabase DB + Storage.
4. `/app/projects/[id]` = Project Workspace (same stepper modules, but backed by Supabase).
5. `/app/assets` = Background video loops manager (upload to Supabase Storage, tag, list, select).
6. `/app/queue` = Render Queue (job list with statuses, retry button, logs).

### App Behavior

- **Without login**: one-off flow must fully work (create → render → download) using local-only persistence, and can still call API routes for TTS/render.
- **With login**: show dashboard of projects; store scripts/audio/video assets in Supabase storage and metadata in Postgres.
- **Projects have versions**: multiple scripts, multiple audio outputs, multiple video renders; one active of each.

### Supabase Integration Requirements

- Use `@supabase/ssr` for server-side auth session and route protection.
- Auth guard: any `/app/*` route redirects to `/login` if unauthenticated.
- Storage buckets: `backgrounds` (public or authenticated), `projects` (private per-user).
- Define DB schema (SQL migration file in `/supabase/migrations/0001_init.sql`) including tables:
  - `projects` (id, user_id nullable for one-off? but for DB-backed projects require user_id, title, status fields, created_at)
  - `source_items` (project_id, raw_text, platform, url, community, original_author, captured_at)
  - `script_versions` (project_id, text, structure_json, estimated_duration_sec, created_at)
  - `audio_assets` (project_id, mode speaker|clone, speaker_id nullable, storage_path, duration_sec, created_at)
  - `video_assets` (project_id, background_asset_id, storage_path, srt_path nullable, render_settings_json, created_at)
  - `background_assets` (id, user_id nullable if shared, name, tags[], storage_path, duration_sec, created_at)
  - `jobs` (id, project_id nullable for one-off jobs, type: script|tts|render, status: queued|running|succeeded|failed, progress int, error text, logs text, created_at, updated_at)
- Include RLS policies (in the migration) so users can only access their own rows (user_id = auth.uid()) and their private storage paths.

### Pipeline Modules (UI)

- Each module is a Card with: status badge, Run button, Use existing asset, Re-run (creates a new version), and an expandable "Advanced" section.
- Provide a "Run all steps" primary CTA at the top.
- Provide preview area: script preview, audio player, video player.
- Use skeleton loaders and "loading.tsx" for route-level lazy loading.
- Add robust empty states.

### API Plug-in Ease (IMPORTANT)

Create clean server-side API routes as wrappers so external APIs can be swapped easily later.

### External Voice / TTS (ALREADY EXISTS — MUST INTEGRATE, NOT REBUILD)

The following Modal Coqui voice APIs already exist and are ready to use. Do NOT implement your own TTS/voice-clone engine. Only build integration + wrappers + UI wiring.

**Base URL**: `COQUI_API_BASE_URL="https://abhirooprasad--coqui-apis-fastapi-app.modal.run"`

**Existing endpoints** (use these exactly):
- `GET ${COQUI_API_BASE_URL}/api-info`
- `GET ${COQUI_API_BASE_URL}/health`
- `GET ${COQUI_API_BASE_URL}/speakers`
- `POST ${COQUI_API_BASE_URL}/tts` (JSON `{ text, speaker_id, language }` → returns WAV bytes)
- `POST ${COQUI_API_BASE_URL}/voice-clone` (multipart form: text, language, reference_audio file → returns WAV bytes)

### Internal API Wrappers (BUILD THESE)

Create server-side Next.js route handlers that call the above Modal endpoints and then store outputs in Supabase Storage so the UI always deals with URLs (not raw bytes).

- `GET /api/voice/speakers` → calls `/speakers` and returns JSON list
- `POST /api/voice/tts` → calls `/tts`, stores WAV in Supabase Storage, returns `{ audioUrl, storagePath, durationSec? }`
- `POST /api/voice/clone` → calls `/voice-clone`, stores WAV in Supabase Storage, returns `{ audioUrl, storagePath, durationSec? }`
- `GET /api/voice/health` → calls `/health` and returns status for UI diagnostics (optional UI panel)

### Important Implementation Notes

- All calls to Modal must happen server-side only (never from browser).
- Store audio under Storage paths:
  - one-off: `projects/oneoff/{sessionId}/audio/{timestamp}.wav`
  - logged-in: `projects/{userId}/{projectId}/audio/{timestamp}.wav`
- Provide a lightweight conversion step (optional) to create preview-friendly format (.m4a or .mp3) using FFmpeg later; for now WAV playback should still work.
- Add clear TODO comments where future audio conversion/duration detection will be implemented.

### Rendering

- Treat rendering as async job. UI polls job status.
- For now, implement a stub renderer that "simulates" progress and outputs a placeholder MP4 URL saved to storage (so the full UX works). Add TODO comments where actual FFmpeg/worker integration will go.

### Error Boundaries / Resilience

- Add error.tsx per major route group and a global error boundary.
- Add toast notifications for success/failure.
- All API calls should have retries/backoff and show user-friendly errors.

### Performance / Loading

- Use dynamic imports for heavy components (video preview, waveform).
- Use Suspense + skeletons and route-level loading.tsx.

### Output Files

Generate the full codebase structure with these files present:
- `app/(public)/page.tsx` (one-off studio)
- `app/login/page.tsx`
- `app/(app)/app/page.tsx` (dashboard)
- `app/(app)/app/projects/[id]/page.tsx`
- `app/(app)/app/assets/page.tsx`
- `app/(app)/app/queue/page.tsx`
- `app/(public)/loading.tsx`, `app/(app)/app/loading.tsx`
- `app/(public)/error.tsx`, `app/(app)/app/error.tsx`
- `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`
- `lib/api/coqui.ts` (typed wrapper)
- `lib/api/jobs.ts`
- `supabase/migrations/0001_init.sql`
- `.env.example` listing: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `COQUI_API_BASE_URL`

Use TypeScript everywhere. Keep code clean, modular, and easy to extend.

### Implementation Status

✅ **Complete**: All routes, authentication, TTS integration, job queue, assets manager, database schema, RLS policies
🟡 **Stub**: Video rendering (placeholder only)
❌ **Not Started**: Automated testing

**See**: [HANDOFF.md](../HANDOFF.md) for full status

---

## Prompt 2: Supabase Heartbeat Keep-Alive

**Date**: 2026-02-09
**Status**: ✅ Complete (deployed and tested)

### Requirements

Add a free keep-alive heartbeat for Supabase using GitHub Actions and an RPC function to prevent Free tier from pausing after 7 days of inactivity.

### Implementation Details

1. **In `supabase/migrations/0002_heartbeat.sql`**, create a SQL function:
   - `public.heartbeat()` returns JSON like `{ ok: true, ts: now() }` (~~stable~~ VOLATILE SQL)
   - Function should INSERT into `heartbeat_log` table to track pings

2. **Add a GitHub Actions workflow file** at `.github/workflows/supabase-heartbeat.yml` that runs every ~~48~~ 120 hours (5 days) and calls:
   - `POST ${SUPABASE_URL}/rest/v1/rpc/heartbeat`
   - Headers:
     - `apikey: ${SUPABASE_ANON_KEY}`
     - `Authorization: Bearer ${SUPABASE_ANON_KEY}`
     - `Content-Type: application/json`
   - Body: `{}`

3. **Update `.env.example`** to include `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the workflow instructions.

4. **Add a short `docs/HEARTBEAT.md`** describing how to add the repo secrets in GitHub Actions and why it exists.

### Changes Made During Implementation

- **SQL function changed from `STABLE` to `VOLATILE`**: Initial migration had `STABLE` which blocked `INSERT` operations. Fixed in migration `20260209000001_fix_heartbeat_volatile.sql`.
- **Cron schedule changed to every 5 days** (instead of 2 days) to reduce API calls while maintaining 2-day safety margin.
- **Added `heartbeat_log` table** to track all pings for debugging and monitoring.
- **Added error handling** in GitHub Actions workflow with HTTP status validation.

### Files Created

- `supabase/migrations/20260209000000_heartbeat.sql` (initial - had bug)
- `supabase/migrations/20260209000001_fix_heartbeat_volatile.sql` (fix)
- `.github/workflows/supabase-heartbeat.yml`
- `docs/HEARTBEAT.md`
- Updated `.env.example`

### Manual Actions Required

1. Add GitHub repository secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
2. Push to GitHub to activate workflow
3. Manually test workflow via Actions tab

**See**: [docs/HEARTBEAT.md](HEARTBEAT.md) for full setup guide

---

## Future Prompts

When adding new features, document the original prompt here with:
- Date and status
- Requirements summary
- Implementation notes
- Files changed
- Manual actions needed
