# API Integration Guide

## Modal Coqui TTS API (External)

**IMPORTANT**: The TTS/voice-clone engine ALREADY EXISTS. Do NOT rebuild it. Only integrate.

### Base URL

```env
COQUI_API_BASE_URL=https://abhirooprasad--coqui-apis-fastapi-app.modal.run
```

### Existing Endpoints (Use These Exactly)

**Health Check**
```
GET ${COQUI_API_BASE_URL}/health
```

**API Info**
```
GET ${COQUI_API_BASE_URL}/api-info
```

**List Speakers**
```
GET ${COQUI_API_BASE_URL}/speakers

Response: Array of speaker objects
[
  { "id": "speaker_id", "name": "Speaker Name", ... }
]
```

**Text-to-Speech**
```
POST ${COQUI_API_BASE_URL}/tts

Content-Type: application/json

Body:
{
  "text": "Text to synthesize",
  "speaker_id": "speaker_id",
  "language": "en"  // or other supported language
}

Response: WAV audio bytes (binary)
```

**Voice Cloning**
```
POST ${COQUI_API_BASE_URL}/voice-clone

Content-Type: multipart/form-data

Form fields:
- text: "Text to synthesize"
- language: "en"
- reference_audio: <audio file>

Response: WAV audio bytes (binary)
```

## Internal API Wrappers (Build These)

Create Next.js API routes that wrap Modal endpoints and handle Supabase Storage.

**Location**: `app/api/voice/`

### GET /api/voice/speakers

Calls Modal `/speakers` and returns JSON list.

```typescript
// app/api/voice/speakers/route.ts
export async function GET() {
  const response = await fetch(`${COQUI_API_BASE_URL}/speakers`)
  const speakers = await response.json()
  return Response.json(speakers)
}
```

### POST /api/voice/tts

Calls Modal `/tts`, stores WAV in Supabase Storage, returns URL.

```typescript
// app/api/voice/tts/route.ts
export async function POST(request: Request) {
  const { text, speaker_id, language, projectId, userId } = await request.json()

  // 1. Call Modal TTS API
  const response = await fetch(`${COQUI_API_BASE_URL}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, speaker_id, language })
  })

  const audioBuffer = await response.arrayBuffer()

  // 2. Store in Supabase Storage
  const timestamp = Date.now()
  const path = userId
    ? `projects/${userId}/${projectId}/audio/${timestamp}.wav`
    : `projects/oneoff/${sessionId}/audio/${timestamp}.wav`

  const { data, error } = await supabase.storage
    .from('projects')
    .upload(path, audioBuffer, { contentType: 'audio/wav' })

  if (error) throw error

  // 3. Get public URL
  const { data: urlData } = supabase.storage
    .from('projects')
    .getPublicUrl(path)

  // TODO: Detect audio duration (use FFprobe or audio library)

  return Response.json({
    audioUrl: urlData.publicUrl,
    storagePath: path,
    durationSec: null  // TODO: implement duration detection
  })
}
```

### POST /api/voice/clone

Calls Modal `/voice-clone`, stores WAV in Supabase Storage, returns URL.

```typescript
// app/api/voice/clone/route.ts
export async function POST(request: Request) {
  const formData = await request.formData()

  // 1. Call Modal Voice Clone API
  const response = await fetch(`${COQUI_API_BASE_URL}/voice-clone`, {
    method: 'POST',
    body: formData  // Forward multipart form data
  })

  const audioBuffer = await response.arrayBuffer()

  // 2. Store in Supabase Storage (same pattern as TTS)
  // ... (similar to /api/voice/tts)

  return Response.json({ audioUrl, storagePath, durationSec })
}
```

### GET /api/voice/health

Calls Modal `/health` for UI diagnostics.

```typescript
// app/api/voice/health/route.ts
export async function GET() {
  const response = await fetch(`${COQUI_API_BASE_URL}/health`)
  const health = await response.json()
  return Response.json(health)
}
```

## Implementation Requirements

### Server-Side Only

**CRITICAL**: All calls to Modal API MUST happen server-side (Next.js API routes).

- ✅ Browser → Next.js API route → Modal API
- ❌ Browser → Modal API directly (CORS issues, API key exposure)

### Audio Format Conversion (TODO)

WAV files work for playback but are large. Future optimization:

```typescript
// TODO: Convert WAV to M4A/MP3 using FFmpeg for smaller previews
// Example: ffmpeg -i input.wav -c:a aac -b:a 128k output.m4a
```

Add TODO comments where conversion will be implemented.

### Duration Detection (TODO)

```typescript
// TODO: Detect audio duration using FFprobe or audio library
// Example: ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 audio.wav
```

Add TODO comments where duration detection will be implemented.

## Error Handling

### Retries and Backoff

```typescript
async function callModalWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }
}
```

### User-Friendly Errors

```typescript
try {
  // API call
} catch (error) {
  return Response.json(
    { error: 'Failed to generate audio. Please try again.' },
    { status: 500 }
  )
}
```

Show toast notifications in UI for success/failure.

## Type Definitions

**Location**: `lib/api/coqui.ts`

```typescript
// lib/api/coqui.ts

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
}

export interface VoiceCloneRequest {
  text: string
  language: string
  reference_audio: File
}

export interface AudioResponse {
  audioUrl: string
  storagePath: string
  durationSec: number | null
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  version?: string
}
```

## Testing

### Manual Testing

```bash
# Test Modal API directly (server-side only)
curl https://abhirooprasad--coqui-apis-fastapi-app.modal.run/health

# Test internal wrapper
curl http://localhost:3000/api/voice/health

# Test TTS
curl -X POST http://localhost:3000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","speaker_id":"default","language":"en"}'
```

### UI Diagnostics Panel (Optional)

Add a `/app/diagnostics` page showing:
- Modal API health status
- Supabase connection status
- Storage bucket accessibility
- Recent job statuses

## Future Enhancements

- [ ] Audio format conversion (WAV → M4A/MP3)
- [ ] Duration detection (FFprobe)
- [ ] Batch TTS processing
- [ ] Audio preview waveforms
- [ ] Speaker preview samples
- [ ] Voice cloning quality validation
