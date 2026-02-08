# Development Workflows

## Planning-First Development

ALL development follows this workflow:

1. **Plan** in `execution_docs/_active/planning.md`
   - Document "why" and approach
   - Explore alternatives
   - Get user approval

2. **Execute** in `execution_docs/_active/execution.md`
   - Track tasks with status indicators
   - Note blockers/deviations
   - Update in real-time

3. **Archive** after completion
   - Move to `execution_docs/archive/[date]_[task].md`

**Status Indicators**: ✅ Completed | 🔄 In Progress | ⏳ Pending | ❌ Blocked

## Pipeline Modules (UI Components)

**Modular workflow**: Ingest → Script → TTS → Video → Export

Each module is a Card component with:
- **Status badge**: idle | processing | ready | error
- **Run button**: Execute this module
- **Use existing asset**: Select from previous versions
- **Re-run button**: Creates new version
- **Advanced section**: Expandable settings (collapsed by default)

**Top-level CTA**: "Run all steps" (end-to-end automation)

**Preview area**: Script preview, audio player, video player

### Module: Ingest

**Purpose**: Capture source content (text, URL, community post)

**UI**:
- Textarea for raw text input
- URL input with metadata scraper
- Platform/community/author fields

**Output**: Creates `source_items` record

### Module: Script

**Purpose**: Generate structured script from source

**UI**:
- Script editor with structure visualization
- Estimated duration display
- Scene breakdown

**Output**: Creates `script_versions` record

### Module: TTS

**Purpose**: Generate audio from script

**UI**:
- Mode selector: Speaker (preset) | Clone (upload reference)
- Speaker dropdown (if mode=speaker)
- Reference audio upload (if mode=clone)
- Language selector
- Audio preview player

**Output**: Creates `audio_assets` record

**Backend**: Calls `/api/voice/tts` or `/api/voice/clone`

### Module: Video

**Purpose**: Render video with background + audio + subtitles

**UI**:
- Background asset selector (from library or upload)
- Subtitle toggle (SRT generation)
- Render settings (resolution, format, overlay position)
- Video preview player

**Output**: Creates `video_assets` record and `jobs` record

**Backend**: Creates async render job

### Module: Export

**Purpose**: Download final video

**UI**:
- Download button
- Format selector (MP4, MOV)
- Resolution selector (1080p, 720p, 9:16 vertical)
- Share to platform button (future)

## Job Queue Pattern

### Creating Jobs

```typescript
// lib/api/jobs.ts
export async function createJob(data: {
  project_id: string | null
  type: 'script' | 'tts' | 'render'
}) {
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      ...data,
      status: 'queued',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  return job
}
```

### Polling Job Status

```typescript
// UI component
const { data: job } = useQuery({
  queryKey: ['job', jobId],
  queryFn: async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    return data
  },
  refetchInterval: (data) =>
    data?.status === 'running' || data?.status === 'queued' ? 2000 : false
})
```

### Updating Job Progress

```typescript
// Backend (API route or worker)
await supabase
  .from('jobs')
  .update({
    status: 'running',
    progress: 50,
    updated_at: new Date().toISOString()
  })
  .eq('id', jobId)
```

## Common Patterns

### One-Off Studio (No Login)

**localStorage persistence**:
```typescript
// Store state
const saveState = (state: StudioState) => {
  localStorage.setItem('studio-state', JSON.stringify(state))
}

// Load state on mount
const loadState = (): StudioState | null => {
  const saved = localStorage.getItem('studio-state')
  return saved ? JSON.parse(saved) : null
}

// Clear on explicit user action (new project)
const clearState = () => {
  localStorage.removeItem('studio-state')
}
```

**Generate session ID**:
```typescript
const sessionId = crypto.randomUUID()
// Use for storage paths: projects/oneoff/{sessionId}/
```

### Project Versioning

**Multiple versions, one active**:
```typescript
// Get active script version
const { data: activeScript } = await supabase
  .from('script_versions')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

// Create new version (on re-run)
const { data: newScript } = await supabase
  .from('script_versions')
  .insert({
    project_id: projectId,
    text: newText,
    structure_json: structure,
    estimated_duration_sec: duration
  })
  .select()
  .single()
```

### Auth Protection

**Middleware** (`middleware.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check if route starts with /app
  if (request.nextUrl.pathname.startsWith('/app')) {
    const supabase = createServerClient(/* ... */)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*']
}
```

**Server Component** (double-check):
```typescript
// app/(app)/app/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Render dashboard
}
```

### Form with Zod Validation

```typescript
"use client"
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const schema = z.object({
  title: z.string().min(1, "Title required"),
  text: z.string().min(10, "Text too short")
})

type FormData = z.infer<typeof schema>

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { title: '', text: '' }
})

const onSubmit = async (values: FormData) => {
  try {
    const { error } = await supabase
      .from('projects')
      .insert({ ...values, user_id: session.user.id })

    if (error) throw error

    toast({ title: 'Success!', description: 'Project created' })
    router.push('/app')
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    })
  }
}
```

### File Upload to Supabase Storage

```typescript
const handleUpload = async (file: File) => {
  const userId = session?.user?.id
  const fileName = `${Date.now()}-${file.name}`
  const path = `backgrounds/${userId}/${fileName}`

  // 1. Upload file
  const { error: uploadError } = await supabase.storage
    .from('backgrounds')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // 2. Get public URL
  const { data: urlData } = supabase.storage
    .from('backgrounds')
    .getPublicUrl(path)

  // 3. Save metadata to DB
  const { error: dbError } = await supabase
    .from('background_assets')
    .insert({
      user_id: userId,
      name: file.name,
      storage_path: path,
      duration_sec: null  // TODO: detect video duration
    })

  if (dbError) throw dbError

  return urlData.publicUrl
}
```

### Loading States

**Skeleton loaders** (shadcn/ui):
```typescript
import { Skeleton } from '@/components/ui/skeleton'

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border p-6 space-y-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}
```

**Route-level loading** (`loading.tsx`):
```typescript
// app/(app)/app/loading.tsx
export default function Loading() {
  return (
    <div className="grid gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
```

**Suspense boundaries**:
```typescript
import { Suspense } from 'react'

<Suspense fallback={<VideoPlayerSkeleton />}>
  <VideoPlayer url={videoUrl} />
</Suspense>
```

### Error Handling

**Error boundaries** (`error.tsx`):
```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  )
}
```

**Toast notifications** (shadcn/ui):
```typescript
import { useToast } from '@/components/ui/use-toast'

const { toast } = useToast()

// Success
toast({ title: 'Success', description: 'Video rendered!' })

// Error
toast({
  title: 'Error',
  description: 'Failed to render video',
  variant: 'destructive'
})

// Loading (dismiss manually)
const { dismiss } = toast({
  title: 'Rendering...',
  description: 'This may take a few minutes',
  duration: Infinity
})
// Later: dismiss()
```

## Testing Checklist

### One-Off Studio
- [ ] Paste text → generate script
- [ ] Generate TTS audio
- [ ] Render video preview
- [ ] Download video
- [ ] Refresh page (state persists in localStorage)
- [ ] New project (clears localStorage)

### Authenticated Flow
- [ ] Sign up / Sign in (magic link or email+password)
- [ ] Create project
- [ ] Run pipeline modules independently
- [ ] Run end-to-end pipeline
- [ ] View job queue
- [ ] Retry failed jobs
- [ ] Upload background assets
- [ ] Select background from library
- [ ] Multiple script versions
- [ ] Multiple audio versions
- [ ] Multiple video renders
- [ ] Download final video

### Error Scenarios
- [ ] Network failure (show retry)
- [ ] TTS API down (graceful error)
- [ ] Render job timeout (show logs)
- [ ] Invalid file upload (show validation error)
- [ ] Session expired (redirect to login)
- [ ] Storage quota exceeded (user-friendly message)
