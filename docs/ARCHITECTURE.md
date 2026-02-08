# Architecture

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend/Auth**: Supabase (@supabase/ssr for server-side auth)
- **Database**: Supabase PostgreSQL with RLS
- **Storage**: Supabase Storage (backgrounds, projects buckets)
- **Deployment**: Vercel
- **Package Manager**: pnpm
- **Node Version**: 20+
- **AI Services**: Modal Coqui TTS API (voice synthesis + cloning)
- **Video Processing**: FFmpeg (async job-based rendering)

## Design System

**Aesthetic**: Calm, peaceful, minimalist (Lovable-style portfolio)
- Off-white background with subtle radial gradients
- rounded-2xl cards with thin borders and soft shadows
- Lots of whitespace
- Muted accent colors: sage, lavender, mist-blue
- Gentle hover lift effects
- Airy typography with relaxed heading sizes and comfortable line-height
- No harsh contrast

## Routes

```
/ (public)                      # One-off Studio (NO login required)
                                # localStorage persistence, fully functional

/login                          # Supabase auth (magic link or email+password)

/app (auth-gated)               # Projects Dashboard
/app/projects/[id]              # Project Workspace (modular pipeline)
/app/assets                     # Background video loops manager
/app/queue                      # Render Queue (job statuses, retry, logs)
```

## Project Structure

```
story_reels/
├── app/
│   ├── (public)/               # Public route group
│   │   ├── page.tsx           # One-off Studio
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── (app)/                 # Auth-gated route group
│   │   └── app/
│   │       ├── page.tsx       # Dashboard
│   │       ├── projects/[id]/page.tsx
│   │       ├── assets/page.tsx
│   │       ├── queue/page.tsx
│   │       ├── loading.tsx
│   │       └── error.tsx
│   └── api/
│       └── voice/             # Internal API wrappers
│           ├── speakers/route.ts
│           ├── tts/route.ts
│           ├── clone/route.ts
│           └── health/route.ts
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── pipeline/              # Pipeline module components
│   └── studio/                # Studio workspace components
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Client-side Supabase
│   │   ├── server.ts          # Server-side Supabase (SSR)
│   │   ├── middleware.ts      # Auth middleware
│   │   └── database.types.ts  # Generated types
│   ├── api/
│   │   ├── coqui.ts           # Modal Coqui API wrapper (typed)
│   │   └── jobs.ts            # Job queue utilities
│   └── utils/
├── supabase/
│   └── migrations/
│       └── 0001_init.sql      # Schema + RLS policies
├── hooks/
├── public/
└── execution_docs/
```

## Database Schema

**Location**: `supabase/migrations/0001_init.sql`

### Tables

**projects**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, nullable for one-off?)
- `title` (text)
- `status` (text: draft|processing|ready)
- `created_at` (timestamptz)

**source_items**
- `id` (uuid, PK)
- `project_id` (uuid, FK)
- `raw_text` (text)
- `platform` (text)
- `url` (text)
- `community` (text)
- `original_author` (text)
- `captured_at` (timestamptz)

**script_versions**
- `id` (uuid, PK)
- `project_id` (uuid, FK)
- `text` (text)
- `structure_json` (jsonb)
- `estimated_duration_sec` (int)
- `created_at` (timestamptz)

**audio_assets**
- `id` (uuid, PK)
- `project_id` (uuid, FK)
- `mode` (text: speaker|clone)
- `speaker_id` (text, nullable)
- `storage_path` (text)
- `duration_sec` (float)
- `created_at` (timestamptz)

**video_assets**
- `id` (uuid, PK)
- `project_id` (uuid, FK)
- `background_asset_id` (uuid, FK to background_assets, nullable)
- `storage_path` (text)
- `srt_path` (text, nullable)
- `render_settings_json` (jsonb)
- `created_at` (timestamptz)

**background_assets**
- `id` (uuid, PK)
- `user_id` (uuid, nullable for shared assets)
- `name` (text)
- `tags` (text[])
- `storage_path` (text)
- `duration_sec` (float)
- `created_at` (timestamptz)

**jobs**
- `id` (uuid, PK)
- `project_id` (uuid, FK, nullable for one-off jobs)
- `type` (text: script|tts|render)
- `status` (text: queued|running|succeeded|failed)
- `progress` (int)
- `error` (text)
- `logs` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### RLS Policies

Users can only access their own rows:
```sql
-- Example for projects table
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Apply similar policies to all user-scoped tables.

## Storage Buckets

**backgrounds** (public or authenticated)
- Background video loops
- Path: `backgrounds/{userId}/{filename}`

**projects** (private, per-user)
- Audio assets
- Video renders
- Paths:
  - One-off: `projects/oneoff/{sessionId}/audio/{timestamp}.wav`
  - Logged-in: `projects/{userId}/{projectId}/audio/{timestamp}.wav`
  - Videos: `projects/{userId}/{projectId}/video/{timestamp}.mp4`

## Pipeline Modules

**Modular workflow**: Ingest → Script → TTS → Video → Export

Each module:
- Status badge (idle/processing/ready/error)
- Run button
- Use existing asset selector
- Re-run (creates new version)
- Expandable "Advanced" section

**Top-level CTA**: "Run all steps" (end-to-end automation)

**Preview area**: Script preview, audio player, video player

## App Behavior

### Without Login (One-off Studio)
- Fully functional: create → render → download
- State persisted in `localStorage` (survives refresh)
- Can call API routes for TTS/render
- Files stored under `projects/oneoff/{sessionId}/`

### With Login (Projects Dashboard)
- Projects stored in Supabase DB + Storage
- Multiple versions: scripts, audio, video (one active of each)
- Access to background assets library
- Job queue with retry and logs

## Supabase Integration

**Auth**: Use `@supabase/ssr` for server-side sessions

**Auth Guard**: `/app/*` routes redirect to `/login` if unauthenticated

**Client-side** (components with `"use client"`):
```typescript
import { createBrowserClient } from '@supabase/ssr'
// or custom wrapper
import { getSupabaseClient } from '@/lib/supabase/client'
```

**Server-side** (Server Components, API routes):
```typescript
import { createServerClient } from '@supabase/ssr'
// or custom wrapper
import { createSupabaseServerClient } from '@/lib/supabase/server'
```

**Middleware** (`lib/supabase/middleware.ts`):
```typescript
// Auth check and session refresh
// Redirect unauthenticated users from /app/* to /login
```

## Environment Variables

**Required** (`.env.local`):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # SERVER ONLY

# Modal Coqui TTS API
COQUI_API_BASE_URL=https://abhirooprasad--coqui-apis-fastapi-app.modal.run
```

See `docs/API_INTEGRATION.md` for Modal Coqui API details.
