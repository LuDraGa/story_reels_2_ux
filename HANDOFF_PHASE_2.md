# Phase 1 → Phase 2 Handoff Document

**Date**: 2025-02-07
**Project**: Reel Story Studio - AI-powered short-form video reel generator
**Status**: Phase 1 COMPLETE ✅ | Ready for Phase 2

**Working Directory**: `/Users/abhiroopprasad/code/personal/story_reels`
**Node Version**: 20 (use `nvm use 20`)
**Package Manager**: pnpm

---

## 🎯 Original Project Vision

Build a production-lean "Reel Story Studio" web app with:

### Core Concept
**Modular story→audio→reel pipeline** with two modes:
1. **One-off Studio** (no login) - localStorage-based, fully functional
2. **Authenticated Projects** (Supabase-backed) - full dashboard, multiple projects

### Key Requirements (from original spec)
- **Modular Pipeline**: Ingest → Script → TTS → Video → Export
- **Run independently OR end-to-end** (user's choice)
- **Design**: Calm, minimalist, Lovable-style aesthetic (off-white bg, sage/lavender/mist accents)
- **Two modes work simultaneously**: public + authenticated
- **Supabase**: Auth + Postgres + Storage + RLS
- **External API**: Modal Coqui TTS (ALREADY EXISTS - integrate only, don't rebuild)
- **Deployment**: Vercel
- **GitHub Actions**: Supabase heartbeat cron (keep free tier alive)

### Tech Stack Requirements
- Next.js 14 (App Router)
- React 18+
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (@supabase/ssr for server-side auth)
- pnpm (package manager)
- Node 20+

---

## ✅ Phase 1: Foundation - COMPLETED

### What Was Built

#### 1. Project Setup
- ✅ Next.js 14 initialized with TypeScript, App Router, Tailwind
- ✅ pnpm workspace configured
- ✅ Node 20 environment
- ✅ All core dependencies installed

#### 2. Design System (60-30-10 Rule)
**File**: `tailwind.config.ts`

**Color Palette**:
- **60% Primary** (backgrounds): Off-white/cream (`primary-100` main bg, `primary-300` cards)
- **30% Secondary** (text): Soft grays (`secondary-500` body, `secondary-700` headings)
- **10% Accent**:
  - **Sage** `#7ab598` (primary CTA - buttons)
  - **Lavender** `#b8a1d3` (secondary actions - badges)
  - **Mist Blue** `#8db9d3` (info/links)

**Typography**:
- **Display** (headings): Space Grotesk
- **Sans** (body): Inter
- **Mono** (code/labels): JetBrains Mono

**Key Styles**:
- `rounded-2xl` cards
- Soft shadows (low opacity)
- Subtle gradients (`bg-gradient-mesh`)
- Gentle hover lift effects
- Lots of whitespace

**Implementation**: ALL tokens in `tailwind.config.ts` - edit once, changes everywhere!

#### 3. Supabase Integration
**Files Created**:
- `lib/supabase/client.ts` - Browser client (uses `createBrowserClient`)
- `lib/supabase/server.ts` - Server client (uses `createServerClient` with cookies)
- `lib/supabase/middleware.ts` - Auth session refresh and route protection
- `lib/supabase/database.types.ts` - TypeScript types for 8 tables

**Auth Middleware**: `middleware.ts` in root
- Protects `/app/*` routes (redirects to `/login` if unauthenticated)
- Allows public routes: `/`, `/login`
- Session refresh on every request

#### 4. Database Schema
**File**: `supabase/migrations/0001_init.sql`

**8 Tables**:
1. `projects` - user_id, title, status (draft|processing|ready)
2. `source_items` - project_id, raw_text, platform, url, community, author
3. `script_versions` - project_id, text, structure_json, estimated_duration_sec
4. `audio_assets` - project_id, mode (speaker|clone), speaker_id, storage_path, duration_sec
5. `video_assets` - project_id, background_asset_id, storage_path, srt_path, render_settings_json
6. `background_assets` - user_id (nullable), name, tags[], storage_path, duration_sec
7. `jobs` - project_id (nullable), type (script|tts|render), status (queued|running|succeeded|failed), progress, error, logs

**RLS Policies**: Users can only access their own rows (auth.uid() = user_id)

**Storage Buckets**:
- `backgrounds` (public) - background video loops
- `projects` (private) - audio and video assets
  - One-off: `projects/oneoff/{sessionId}/audio/{timestamp}.wav`
  - Logged-in: `projects/{userId}/{projectId}/audio/{timestamp}.wav`

#### 5. Route Structure
**Files Created**:

**Public Routes** (no auth required):
- `app/(public)/page.tsx` - Home/One-off Studio (main entry)
- `app/(public)/loading.tsx` - Loading state
- `app/(public)/error.tsx` - Error boundary
- `app/(public)/layout.tsx` - Public layout (minimal)

**Login**:
- `app/login/page.tsx` - Magic link auth page (placeholder)

**App Routes** (auth-gated):
- `app/(app)/app/page.tsx` - Dashboard (projects list)
- `app/(app)/app/projects/[id]/page.tsx` - Project Workspace (5 pipeline modules)
- `app/(app)/app/assets/page.tsx` - Background Assets Manager
- `app/(app)/app/queue/page.tsx` - Render Queue (job statuses)
- `app/(app)/app/loading.tsx` - Loading state
- `app/(app)/app/error.tsx` - Error boundary
- `app/(app)/layout.tsx` - App layout with navigation

**API Routes** (placeholders - Phase 2 will implement):
- `app/api/voice/speakers/route.ts` - GET speakers list
- `app/api/voice/tts/route.ts` - POST text-to-speech
- `app/api/voice/clone/route.ts` - POST voice cloning
- `app/api/voice/health/route.ts` - GET health check

#### 6. UI Components
**shadcn/ui installed**:
- Button
- Card
- Input
- Toast (with Toaster)

**Utility**:
- `lib/utils.ts` - `cn()` function (clsx + tailwind-merge)

#### 7. Environment Setup
**File**: `.env.local` (dummy credentials)
```env
NEXT_PUBLIC_SUPABASE_URL=https://dummy-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...DUMMY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...DUMMY_SERVICE_ROLE

COQUI_API_BASE_URL=https://abhirooprasad--coqui-apis-fastapi-app.modal.run
```

**File**: `.env.example` (template for real credentials)

### Current State (What Works)

**✅ Working**:
- All routes render correctly
- Design system applied (off-white bg, sage buttons, clean typography)
- Navigation between routes
- Auth middleware redirects `/app/*` to `/login` (tested)
- TypeScript compilation passes (no errors)
- ESLint passes (no warnings)

**❌ Not Working (Expected)**:
- Buttons have no functionality (placeholders)
- No API calls (placeholders return mock data)
- No database connection (dummy credentials)
- No authentication flow (no real Supabase project)

**User Tested Routes**:
- `/` (home) - Displays correctly
- `/login` - Displays correctly
- `/app` - Redirects to `/login` (correct behavior)

---

## 🎯 Phase 2: Modal Coqui API Integration

### Goal
Build working API wrappers to integrate with the EXISTING Modal Coqui TTS API.

### Critical: Modal Coqui API Details

**IMPORTANT**: This API ALREADY EXISTS. Do NOT rebuild it. Only integrate.

**Base URL**:
```
https://abhirooprasad--coqui-apis-fastapi-app.modal.run
```

**Existing Endpoints** (use these exactly):

1. **GET /speakers**
   - Returns: Array of speaker objects
   - Example response:
   ```json
   [
     { "id": "speaker_id", "name": "Speaker Name", "language": "en", "gender": "male" }
   ]
   ```

2. **POST /tts**
   - Content-Type: `application/json`
   - Body:
   ```json
   {
     "text": "Text to synthesize",
     "speaker_id": "speaker_id",
     "language": "en"
   }
   ```
   - Returns: WAV audio bytes (binary)

3. **POST /voice-clone**
   - Content-Type: `multipart/form-data`
   - Form fields:
     - `text`: "Text to synthesize"
     - `language`: "en"
     - `reference_audio`: <audio file>
   - Returns: WAV audio bytes (binary)

4. **GET /health**
   - Returns: Health status object
   - Example:
   ```json
   {
     "status": "healthy",
     "version": "1.0.0"
   }
   ```

### What to Build in Phase 2

#### 1. Internal API Wrappers (Next.js Route Handlers)

These wrap Modal endpoints and handle Supabase Storage.

**GET /api/voice/speakers**
- Calls Modal `/speakers`
- Returns JSON list
- Error handling with retries

**POST /api/voice/tts**
- Accepts: `{ text, speaker_id, language, projectId, userId }`
- Calls Modal `/tts`
- Stores WAV in Supabase Storage (`projects` bucket)
- Returns: `{ audioUrl, storagePath, durationSec }`
- TODO comments for duration detection (FFprobe later)

**POST /api/voice/clone**
- Accepts: FormData with `text`, `language`, `reference_audio`, `projectId`, `userId`
- Forwards to Modal `/voice-clone`
- Stores WAV in Supabase Storage
- Returns: `{ audioUrl, storagePath, durationSec }`

**GET /api/voice/health**
- Calls Modal `/health`
- Returns status for UI diagnostics

#### 2. Storage Path Logic

**One-off projects** (no userId):
```
projects/oneoff/{sessionId}/audio/{timestamp}.wav
```

**Logged-in projects**:
```
projects/{userId}/{projectId}/audio/{timestamp}.wav
```

**Session ID generation**: `crypto.randomUUID()` (browser)

#### 3. Type Definitions

**File**: `lib/api/coqui.ts`

```typescript
export interface Speaker {
  id: string
  name: string
  language?: string
  gender?: string
}

export interface TTSRequest {
  text: string
  speaker_id: string
  language: string
  projectId?: string
  userId?: string
}

export interface VoiceCloneRequest {
  text: string
  language: string
  reference_audio: File
  projectId?: string
  userId?: string
}

export interface AudioResponse {
  audioUrl: string
  storagePath: string
  durationSec: number | null  // TODO: implement duration detection
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  version?: string
}
```

#### 4. Error Handling

**Retries with exponential backoff**:
```typescript
async function callModalWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }
}
```

**User-friendly errors**:
```typescript
return NextResponse.json(
  { error: 'Failed to generate audio. Please try again.' },
  { status: 500 }
)
```

#### 5. Implementation Notes

**CRITICAL RULES**:
- ALL Modal API calls MUST be server-side (Next.js API routes ONLY)
- NEVER call Modal API from browser (CORS issues, security)
- Store ALL audio in Supabase Storage (never serve raw bytes to client)
- Always return URLs (not bytes)

**TODO Comments to Add**:
```typescript
// TODO: Detect audio duration using FFprobe
// Example: ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 audio.wav

// TODO: Convert WAV to M4A/MP3 for smaller previews
// Example: ffmpeg -i input.wav -c:a aac -b:a 128k output.m4a
```

### Phase 2 Deliverables

✅ Working `/api/voice/speakers` endpoint
✅ Working `/api/voice/tts` endpoint (generates + stores audio)
✅ Working `/api/voice/clone` endpoint
✅ Working `/api/voice/health` endpoint
✅ Type definitions (`lib/api/coqui.ts`)
✅ Error handling with retries
✅ Supabase Storage integration

**After Phase 2**: API layer complete, ready to call from UI components.

---

## 📁 Current File Structure

```
story_reels/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Home/One-off Studio
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── layout.tsx
│   ├── login/
│   │   └── page.tsx              # Magic link auth
│   ├── (app)/
│   │   └── app/
│   │       ├── page.tsx          # Dashboard
│   │       ├── projects/[id]/page.tsx  # Project Workspace
│   │       ├── assets/page.tsx   # Background Assets
│   │       ├── queue/page.tsx    # Render Queue
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       └── layout.tsx        # App layout with nav
│   ├── api/voice/
│   │   ├── speakers/route.ts     # GET speakers (placeholder)
│   │   ├── tts/route.ts          # POST TTS (placeholder)
│   │   ├── clone/route.ts        # POST clone (placeholder)
│   │   └── health/route.ts       # GET health (placeholder)
│   ├── layout.tsx                # Root layout with fonts
│   └── globals.css               # Global styles + fonts
├── components/ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── toast.tsx
│   └── toaster.tsx
├── hooks/
│   └── use-toast.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── middleware.ts         # Auth middleware helper
│   │   └── database.types.ts     # TypeScript types (8 tables)
│   └── utils.ts                  # cn() utility
├── supabase/migrations/
│   └── 0001_init.sql             # Schema + RLS + Storage
├── docs/
│   ├── ARCHITECTURE.md           # Tech stack, routes, schema
│   ├── DESIGN_SYSTEM.md          # 60-30-10 colors, typography
│   ├── API_INTEGRATION.md        # Modal Coqui API details
│   ├── WORKFLOWS.md              # Pipeline modules, patterns
│   ├── DEPLOYMENT.md             # Vercel + GitHub Actions
│   └── CODE_SEARCH.md            # Search strategies
├── execution_docs/
│   └── _active/
│       ├── planning.md           # Phase 1 planning
│       └── execution.md          # Phase 1 execution (complete)
├── CLAUDE.md                     # Main project guide
├── HANDOFF_PHASE_2.md            # THIS FILE
├── tailwind.config.ts            # Design system tokens
├── middleware.ts                 # Auth protection
├── .env.local                    # Dummy credentials
├── .env.example                  # Template
├── package.json
├── tsconfig.json
├── next.config.js
└── components.json               # shadcn/ui config
```

---

## 🔑 Key Decisions Made

1. **Design System**: Used WereCode project's 60-30-10 rule with calm aesthetic (sage/lavender/mist)
2. **Auth**: Magic link (simpler than email+password for MVP)
3. **Script Generation**: Manual editing only (no AI generation in MVP)
4. **Video Rendering**: Stub renderer initially (simulate progress, placeholder MP4)
5. **Package Manager**: pnpm (faster, efficient)
6. **Supabase**: @supabase/ssr for proper server-side auth (not old packages)
7. **Route Groups**: `(public)` and `(app)` for clean separation
8. **API Wrapper Pattern**: Server-side wrappers that return URLs (not raw bytes)

---

## 📚 Important Documentation References

**Read FIRST before Phase 2**:
- `docs/API_INTEGRATION.md` - Complete Modal Coqui API integration guide (CRITICAL)
- `docs/ARCHITECTURE.md` - Database schema, storage paths
- `docs/WORKFLOWS.md` - Pipeline module patterns

**Design Reference**:
- `docs/DESIGN_SYSTEM.md` - Complete color palette, typography, component patterns

**Supabase Reference**:
- `lib/supabase/client.ts` - Browser client usage
- `lib/supabase/server.ts` - Server client usage
- `supabase/migrations/0001_init.sql` - Database schema

---

## ⚠️ Critical Reminders for Phase 2

1. **Do NOT rebuild Modal Coqui API** - It exists! Only integrate.
2. **All Modal calls server-side** - NEVER from browser
3. **Always store in Supabase Storage** - Return URLs, not bytes
4. **Use dummy credentials for now** - Real ones added on Vercel deployment
5. **Add TODO comments** - For duration detection, format conversion
6. **Error handling with retries** - Exponential backoff pattern
7. **User-friendly error messages** - "Failed to generate audio. Please try again."
8. **Follow storage path logic** - One-off vs logged-in paths

---

## ✅ Pre-Phase 2 Checklist

Run these commands to verify Phase 1 state:
```bash
cd /Users/abhiroopprasad/code/personal/story_reels
nvm use 20
pnpm type-check  # Should pass
pnpm lint        # Should pass
pnpm dev         # Should start on localhost:3000
```

Visit routes:
- http://localhost:3000 (home page)
- http://localhost:3000/app (redirects to login)

If ANY fail, stop and debug Phase 1 first.

## 🎯 Phase 2: Step-by-Step Implementation

### Step 1: Health Check (15 min)
**File**: `app/api/voice/health/route.ts`

```typescript
const response = await fetch(`${process.env.COQUI_API_BASE_URL}/health`)
const data = await response.json()
return NextResponse.json(data)
```

**Test**: `curl http://localhost:3000/api/voice/health`

### Step 2: List Speakers (20 min)
**File**: `app/api/voice/speakers/route.ts`

Same pattern as health. Add retry logic.

### Step 3: TTS Endpoint (45 min) - CRITICAL
**File**: `app/api/voice/tts/route.ts`

**Binary data handling**:
```typescript
// 1. Call Modal API
const response = await fetch(`${COQUI_API_BASE_URL}/tts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, speaker_id, language })
})

// 2. Get binary audio
const audioBuffer = await response.arrayBuffer()

// 3. Upload to Supabase Storage
const timestamp = Date.now()
const path = userId
  ? `projects/${userId}/${projectId}/audio/${timestamp}.wav`
  : `projects/oneoff/${sessionId}/audio/${timestamp}.wav`

const { error } = await supabase.storage
  .from('projects')
  .upload(path, audioBuffer, {
    contentType: 'audio/wav',
    upsert: false
  })

// 4. Get public URL
const { data: urlData } = supabase.storage.from('projects').getPublicUrl(path)

return NextResponse.json({
  audioUrl: urlData.publicUrl,
  storagePath: path,
  durationSec: null  // TODO: FFprobe
})
```

**Session ID** (one-off projects):
```typescript
// Client passes sessionId in request body
// Generated: crypto.randomUUID() on client, stored in localStorage
```

### Step 4: Voice Clone (30 min)
**File**: `app/api/voice/clone/route.ts`

Same pattern as TTS but accept FormData.

### Step 5: Testing (15 min)
- `pnpm type-check` (must pass)
- `pnpm lint` (must pass)
- Test each endpoint with curl

**Acceptance**: Endpoint returns valid Supabase Storage URL that plays audio.

## ⚠️ Common Pitfalls

1. **Modal API calls MUST be server-side** - Never from browser
2. **Don't return binary data** - Store in Supabase, return URL
3. **Content-Type required** - `contentType: 'audio/wav'` on upload
4. **Service role key server-only** - Never expose to client
5. **One-off storage paths** - Use `projects/oneoff/{sessionId}/`

## 🚀 How to Start Phase 2

**Paste this entire document** into a fresh Claude Code session and say:

> "I've completed Phase 1. Please review this handoff document and proceed with Phase 2: Modal Coqui API Integration. Start by implementing the `/api/voice/speakers` endpoint, then move to TTS and voice cloning."

**Expected Phase 2 Duration**: 1-2 hours focused work

## 🗺️ Future Phases Roadmap

### Phase 3: One-Off Studio UI (localStorage-based)
**Goal**: Make home page (`/`) fully functional without login

**Build**:
1. **State management** - localStorage for script, audio, video state
2. **5 module cards** on home page (Ingest → Script → TTS → Video → Export)
3. **Ingest module** - Textarea for text input, save to localStorage
4. **Script module** - Editable textarea, word count, estimate duration
5. **TTS module** - Speaker dropdown (call `/api/voice/speakers`), generate button (call `/api/voice/tts`), audio player preview
6. **Video module** - Background selector (stub for now), render button (stub creates placeholder), video player preview
7. **Export module** - Download button (download from Supabase Storage URL)
8. **Session ID** - Generate `crypto.randomUUID()`, store in localStorage, pass to API calls
9. **Toast notifications** - Success/error feedback for each action

**Key Files**:
- `app/(public)/page.tsx` - Replace placeholder with working studio
- `components/studio/IngestModule.tsx`
- `components/studio/ScriptModule.tsx`
- `components/studio/TTSModule.tsx`
- `components/studio/VideoModule.tsx`
- `components/studio/ExportModule.tsx`
- `hooks/useStudioState.ts` - localStorage persistence

**Acceptance**: User can paste text → edit script → generate audio → hear audio → download placeholder video (all without login)

---

### Phase 4: Authentication Flow (Supabase magic link)
**Goal**: Working login → dashboard flow

**Build**:
1. **Login page** (`/login`) - Email input, "Send Magic Link" button
2. **Magic link handler** - Supabase auth.signInWithOtp()
3. **Callback handler** - `app/auth/callback/route.ts` (verify token, set session)
4. **Sign out** - Button in app layout, calls auth.signOut()
5. **Protected routes** - Verify middleware redirects work
6. **User profile** - Store user metadata in Supabase

**Key Files**:
- `app/login/page.tsx` - Implement magic link flow
- `app/auth/callback/route.ts` - Token verification
- `app/(app)/layout.tsx` - Add sign out functionality
- `lib/auth/actions.ts` - Server actions for auth

**Acceptance**: User enters email → receives link → clicks → lands on dashboard → can sign out

---

### Phase 5: Authenticated Dashboard (projects CRUD)
**Goal**: `/app` dashboard with project management

**Build**:
1. **Project list** - Fetch from `projects` table, display as cards
2. **Create project** - Modal with title input, creates row in DB
3. **Delete project** - Confirm dialog, deletes row + cascades
4. **Project card** - Title, status badge, last updated, thumbnail
5. **Navigate to project** - Click card → `/app/projects/[id]`
6. **Empty state** - "Create first project" CTA

**Key Files**:
- `app/(app)/app/page.tsx` - Implement project list + CRUD
- `app/(app)/app/actions.ts` - Server actions (create, delete)
- `components/dashboard/ProjectCard.tsx`
- `components/dashboard/CreateProjectModal.tsx`

**Acceptance**: User creates project → sees in list → can delete → can navigate to workspace

---

### Phase 6: Pipeline Modules UI (project workspace)
**Goal**: `/app/projects/[id]` with 5 working modules

**Build**:
1. **Fetch project data** - Load from DB (project, latest script, audio, video)
2. **5 module cards** - Same as Phase 3 but backed by Supabase DB
3. **Version management** - Display dropdown to select previous script/audio versions
4. **"Run All Steps" button** - Execute pipeline end-to-end
5. **Module state** - Idle → Processing → Ready → Error
6. **Real-time updates** - Supabase subscriptions for job status changes

**Key Files**:
- `app/(app)/app/projects/[id]/page.tsx` - Implement pipeline workspace
- `components/pipeline/PipelineModule.tsx` (reusable)
- `hooks/useProjectPipeline.ts` - State management + Supabase queries

**Acceptance**: User runs module → status updates → result stored in DB → can re-run → can view old versions

---

### Phase 7: Job Queue System (async rendering)
**Goal**: `/app/queue` shows jobs, video rendering actually works

**Build**:
1. **Job creation** - TTS/render actions create `jobs` table row
2. **Job list** - Fetch from `jobs` table, display status (queued/running/succeeded/failed)
3. **Polling** - UI polls job status every 2s while running
4. **Progress bar** - Show 0-100% progress
5. **Logs display** - Expandable logs textarea
6. **Retry button** - Re-run failed jobs
7. **Stub renderer → Real FFmpeg** - Replace placeholder with actual video composition
   - Fetch audio from Storage
   - Fetch background video from Storage
   - Overlay audio on video (FFmpeg command)
   - Upload result to Storage
   - Update job status

**Key Files**:
- `app/(app)/app/queue/page.tsx` - Implement job list UI
- `app/api/jobs/[id]/route.ts` - GET job status
- `app/api/render/route.ts` - POST create render job (replaces stub)
- `lib/video/renderer.ts` - FFmpeg wrapper (TODO: complex)

**Acceptance**: User triggers render → job appears in queue → status updates → video playable → can retry failed

---

### Phase 8: Background Assets Manager
**Goal**: `/app/assets` with upload/manage backgrounds

**Build**:
1. **Upload button** - File input (accept video), uploads to `backgrounds` bucket
2. **Asset grid** - Display thumbnails (video first frame or placeholder)
3. **Tag system** - Add/remove tags, filter by tags
4. **Delete asset** - Remove from Storage + DB
5. **Select for project** - Used in video module's background selector
6. **Shared assets** - Admin can mark as shared (user_id null)

**Key Files**:
- `app/(app)/app/assets/page.tsx` - Implement asset manager
- `app/(app)/app/assets/actions.ts` - Server actions (upload, delete)
- `components/assets/AssetCard.tsx`
- `components/assets/UploadDialog.tsx`

**Acceptance**: User uploads video → sees in grid → can tag → can delete → can select in project

---

### Phase 9: Polish & Testing
**Goal**: Production-ready app

**Tasks**:
1. **Error boundaries** - Graceful error handling on all pages
2. **Loading states** - Skeletons everywhere
3. **Empty states** - Helpful messaging + CTAs
4. **Responsive design** - Mobile/tablet optimization
5. **Accessibility** - Keyboard nav, ARIA labels, color contrast
6. **Performance** - Code splitting, image optimization, lazy loading
7. **SEO** - Metadata, OG tags, sitemap
8. **Analytics** (optional) - Posthog/Vercel Analytics
9. **Real Supabase credentials** - Create production project, migrate schema, update env vars
10. **Vercel deployment** - Deploy, test production
11. **GitHub Actions heartbeat** - Cron job to keep Supabase active
12. **User testing** - Dogfood the app, fix UX issues

**Acceptance**: App is deployed, functional, fast, accessible, and handles errors gracefully

---

## Phase Dependencies

```
Phase 1 (Foundation) ✅
  └─> Phase 2 (API Integration) ← YOU ARE HERE
       ├─> Phase 3 (One-off Studio) ← Can start immediately after Phase 2
       └─> Phase 4 (Auth) ← Can start parallel to Phase 3
            └─> Phase 5 (Dashboard) ← Needs Phase 4
                 └─> Phase 6 (Pipeline Modules) ← Needs Phase 5
                      └─> Phase 7 (Job Queue) ← Needs Phase 6
                           └─> Phase 8 (Assets) ← Can parallel with Phase 7
                                └─> Phase 9 (Polish) ← Needs all above
```

**Parallel Work Opportunities**:
- Phase 3 + Phase 4 can be built simultaneously (one is public, one is auth)
- Phase 7 + Phase 8 can overlap (both are independent features)

---

## ✅ Phase 1 Success Criteria (All Met)

- ✅ Next.js app runs without errors (`pnpm dev` works)
- ✅ All routes render correctly
- ✅ Design system applied (60-30-10 rule visible)
- ✅ Auth middleware redirects `/app/*` to `/login`
- ✅ TypeScript compilation passes (`pnpm type-check`)
- ✅ ESLint passes (`pnpm lint`)
- ✅ Supabase integration ready (clients + types)
- ✅ Database schema defined (8 tables + RLS)
- ✅ Route structure complete (public + app + API)

---

**END OF HANDOFF DOCUMENT**

Ready for Phase 2! 🎯
