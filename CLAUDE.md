# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

- **[docs/PROJECT_PROMPTS.md](docs/PROJECT_PROMPTS.md)**: Original prompts and requirements for each build phase (essential for new sessions)
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Tech stack, routes, database schema, Supabase setup
- **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)**: 60-30-10 colors, typography, spacing (edit one file to change all)
- **[docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)**: Modal Coqui TTS API integration (CRITICAL - external API)
- **[docs/WORKFLOWS.md](docs/WORKFLOWS.md)**: Pipeline modules, job queue, common patterns, testing
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Vercel deployment, GitHub Actions heartbeat
- **[docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md)**: Database migrations, CLI commands, troubleshooting
- **[docs/HEARTBEAT.md](docs/HEARTBEAT.md)**: GitHub Actions keep-alive to prevent Supabase Free tier from pausing after 7 days
- **[docs/CODE_SEARCH.md](docs/CODE_SEARCH.md)**: Code search tools and strategies
- **[docs/HANDOFF_GUIDE.md](docs/HANDOFF_GUIDE.md)**: How to create ideal handoff documents (based on HANDOFF_PHASE_2.md critique)
- **[execution_docs/](execution_docs/)**: Task planning and execution tracking
- **[HANDOFF_PHASE_2.md](HANDOFF_PHASE_2.md)**: Phase 1→2 handoff (example of ideal handoff doc)

## Project Overview

**Reel Story Studio** - Modular story→audio→reel pipeline. Each project supports step-by-step modules (Ingest → Script → TTS → Video → Export). Run independently OR end-to-end.

**Stack**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (@supabase/ssr) + Vercel

**Design**: Calm, minimalist aesthetic (Lovable-style): off-white bg, subtle gradients, rounded-2xl cards, sage/lavender/mist-blue accents, lots of whitespace.

## Key Concepts

### Routes

- `/` = One-off Studio (NO login, localStorage persistence)
- `/login` = Supabase auth
- `/app` = Projects Dashboard (auth-gated)
- `/app/projects/[id]` = Project Workspace
- `/app/assets` = Background video manager
- `/app/queue` = Render Queue (jobs, retry, logs)

### External APIs

**Modal Coqui TTS API** (ALREADY EXISTS - do NOT rebuild):
- Base URL: `https://abhirooprasad--coqui-apis-fastapi-app.modal.run`
- Endpoints: `/health`, `/speakers`, `/tts`, `/voice-clone`
- **Integration only** - see [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)

### Database

7 tables: `projects`, `source_items`, `script_versions`, `audio_assets`, `video_assets`, `background_assets`, `jobs`

RLS policies required. Migration: `supabase/migrations/20260208211959_initial_schema.sql`

**Migration Commands**: See [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md) for CLI commands

**Schema Details**: See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full schema

### Pipeline Modules

5 modules (UI Cards): Ingest → Script → TTS → Video → Export

Each card: status badge, Run button, Use existing, Re-run, Advanced section

Top CTA: "Run all steps"

See [docs/WORKFLOWS.md](docs/WORKFLOWS.md) for UI patterns.

## Development Commands

```bash
# Development
pnpm install          # Install dependencies
pnpm dev              # Start dev server (USER RUNS THIS)
pnpm build            # Production build (USER RUNS THIS)

# Code Quality
pnpm lint             # Lint (YOU CAN RUN)
pnpm type-check       # Type check (YOU CAN RUN)
npx tsc --noEmit      # Type check (YOU CAN RUN)

# Supabase Migrations (see docs/SUPABASE_MIGRATIONS.md for details)
supabase migration list           # Check migration status (YOU CAN RUN)
supabase db push                  # Push migrations to remote (ASK USER FIRST)
supabase db pull                  # Pull remote schema (ASK USER FIRST)
supabase migration new NAME       # Create new migration (YOU CAN RUN)
supabase db remote shell          # Connect to remote DB (YOU CAN RUN)
```

## Critical Rules

### ✅ DO
- Read [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md) FIRST before touching TTS/voice code
- Use `ast-grep` for code search (see [CODE_SEARCH.md](docs/CODE_SEARCH.md))
- Use `rg` (ripgrep) for text search
- Run `pnpm lint` and `npx tsc --noEmit` before changes
- Update `execution_docs/_active/execution.md` in real-time
- Request user to run: `pnpm dev`, `pnpm build`, deployments
- Use `@supabase/ssr` for server-side auth (NOT old packages)
- All Modal API calls MUST be server-side (API routes only)

### ❌ NEVER
- Run `pnpm dev`, `pnpm start`, `pnpm build` automatically
- Use plain `grep` (use `rg` or `ast-grep`)
- Skip execution doc updates
- Code without planning in `execution_docs/_active/planning.md`
- Call Modal API from browser (CORS/security issue)
- Rebuild TTS engine (it already exists - integrate only)

## Workflow

**Starting a new session?** Check [docs/PROJECT_PROMPTS.md](docs/PROJECT_PROMPTS.md) first to understand original requirements and project history.

1. **Plan** → `execution_docs/_active/planning.md`
2. **Execute** → `execution_docs/_active/execution.md` (track tasks)
3. **Archive** → Move to `execution_docs/archive/` when done

See [docs/WORKFLOWS.md](docs/WORKFLOWS.md) for detailed patterns.

## Essential Patterns

**Supabase Client** (use @supabase/ssr):
```typescript
// Client component
import { createBrowserClient } from '@supabase/ssr'

// Server component / API route
import { createServerClient } from '@supabase/ssr'
```

**Auth Guard** (middleware.ts):
```typescript
// Redirect /app/* to /login if unauthenticated
if (pathname.startsWith('/app') && !session) {
  redirect('/login')
}
```

**Modal API Wrapper** (server-side only):
```typescript
// app/api/voice/tts/route.ts
export async function POST(req: Request) {
  // 1. Call Modal API
  const response = await fetch(`${COQUI_API_BASE_URL}/tts`, {...})
  const audioBuffer = await response.arrayBuffer()

  // 2. Store in Supabase Storage
  const path = `projects/${userId}/${projectId}/audio/${timestamp}.wav`
  await supabase.storage.from('projects').upload(path, audioBuffer)

  // 3. Return URL
  return Response.json({ audioUrl, storagePath })
}
```

**Job Pattern**:
```typescript
// Create job
const job = await createJob({ project_id, type: 'render' })

// Poll status (UI)
useQuery(['job', jobId], fetchJob, {
  refetchInterval: job?.status === 'running' ? 2000 : false
})
```

**localStorage (One-off Studio)**:
```typescript
// Persist state for non-authenticated users
localStorage.setItem('studio-state', JSON.stringify(state))
const saved = localStorage.getItem('studio-state')
```

## File Structure

```
app/
├── (public)/                # Public route group
│   ├── page.tsx            # One-off Studio
│   ├── loading.tsx
│   └── error.tsx
├── login/page.tsx
├── (app)/                  # Auth-gated route group
│   └── app/
│       ├── page.tsx        # Dashboard
│       ├── projects/[id]/page.tsx
│       ├── assets/page.tsx
│       ├── queue/page.tsx
│       ├── loading.tsx
│       └── error.tsx
└── api/voice/              # Internal API wrappers
    ├── speakers/route.ts
    ├── tts/route.ts
    ├── clone/route.ts
    └── health/route.ts

lib/
├── supabase/
│   ├── client.ts           # Browser client
│   ├── server.ts           # Server client
│   ├── middleware.ts       # Auth middleware
│   └── database.types.ts   # Generated types
├── api/
│   ├── coqui.ts            # Modal API wrapper (typed)
│   └── jobs.ts             # Job queue utils
└── utils/

supabase/
└── migrations/
    └── 20260208211959_initial_schema.sql  # Schema + RLS

execution_docs/
├── _active/
│   ├── planning.md
│   └── execution.md
└── archive/
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # SERVER ONLY

# Modal Coqui TTS API (external)
COQUI_API_BASE_URL=https://abhirooprasad--coqui-apis-fastapi-app.modal.run
```

See `.env.example` for template.

## More Details

- **Project Prompts**: [docs/PROJECT_PROMPTS.md](docs/PROJECT_PROMPTS.md) - Original requirements for each phase
- **Architecture & Schema**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Modal API Integration**: [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md) ⚠️ **READ THIS FIRST**
- **Pipeline & Patterns**: [docs/WORKFLOWS.md](docs/WORKFLOWS.md)
- **Deployment**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Supabase Migrations**: [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md)
- **Code Search**: [docs/CODE_SEARCH.md](docs/CODE_SEARCH.md)

## Important Notes

- **One-off Studio**: Fully functional WITHOUT login (localStorage + API routes)
- **Project Versions**: Multiple scripts/audio/video per project, one active of each
- **Async Jobs**: Video rendering uses job queue (poll status, show progress)
- **RLS**: Row-level security on all user-scoped tables
- **Storage**: One-off uses `projects/oneoff/{sessionId}/`, logged-in uses `projects/{userId}/{projectId}/`
- **Design**: Match calm, minimalist aesthetic (see ARCHITECTURE.md)
- **External API**: Modal Coqui TTS already exists - integrate, don't rebuild
