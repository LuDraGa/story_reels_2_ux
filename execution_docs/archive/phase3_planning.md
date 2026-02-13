# Phase 3: One-Off Studio UI - Planning

**Date**: 2025-02-07
**Status**: Planning
**Goal**: Build fully functional one-off studio on home page (/) with localStorage persistence

---

## Context

Phase 2 completed API layer. Now building the UI for the one-off studio - a **fully functional TTS workflow WITHOUT requiring login**.

Users should be able to:
1. Paste/type text
2. Edit script
3. Generate audio with TTS
4. Preview audio
5. Download placeholder video (stub)

All state persisted in localStorage using a session ID.

---

## Implementation Plan

### 1. Session Management & State (`hooks/useStudioState.ts`) - 20 min

**State structure:**
```typescript
interface StudioState {
  sessionId: string // crypto.randomUUID()
  sourceText: string
  script: string
  audioUrl: string | null
  storagePath: string | null
  selectedSpeakerId: string | null
  videoUrl: string | null
}
```

**localStorage persistence:**
- Save on every state change
- Load on mount
- Generate sessionId if doesn't exist

### 2. Module Components - 90 min

Create 5 components (one per pipeline module):

**A. IngestModule** (`components/studio/IngestModule.tsx`) - 15 min
- Textarea for text input
- Character count
- "Save" button → updates state.sourceText
- Auto-copies to script on first save

**B. ScriptModule** (`components/studio/ScriptModule.tsx`) - 20 min
- Editable textarea
- Word count
- Estimated duration (words / 150 wpm)
- "Save Script" button

**C. TTSModule** (`components/studio/TTSModule.tsx`) - 30 min ⚠️ CRITICAL
- Fetch speakers from `/api/voice/speakers`
- Dropdown to select speaker
- "Generate Audio" button
- Calls `/api/voice/tts` with sessionId
- Audio player preview (<audio> element)
- Loading state during generation
- Error handling with toast

**D. VideoModule** (`components/studio/VideoModule.tsx`) - 15 min
- "Generate Video" button (stub - creates placeholder)
- Video player preview (<video> element)
- Shows placeholder MP4 (or just message for now)

**E. ExportModule** (`components/studio/ExportModule.tsx`) - 10 min
- Download audio button (if audio exists)
- Download video button (if video exists)
- Links to Supabase Storage URLs

### 3. Main Studio Page (`app/(public)/page.tsx`) - 30 min

Replace placeholder with:
- Page header ("One-Off Studio")
- 5 module cards in vertical layout
- Each card shows status badge (idle/processing/ready)
- "Run All Steps" button at top (Phase 4+)
- Clean design matching aesthetic

### 4. UI Polish - 20 min

- Loading spinners
- Toast notifications (success/error)
- Disabled states (e.g., can't generate audio without script)
- Empty states ("No audio yet")
- Error boundaries

---

## Design Decisions

✅ **localStorage only** - No database calls, no auth required
✅ **Session ID** - Generated once, persisted in localStorage
✅ **Audio player** - Native HTML5 `<audio>` element (simple, works everywhere)
✅ **Video stub** - Placeholder for now (real FFmpeg rendering in Phase 7)
✅ **Module cards** - Reusable Card component from shadcn/ui
✅ **Status badges** - Idle (gray), Processing (blue), Ready (green), Error (red)

---

## File Structure

```
components/studio/
├── IngestModule.tsx      # Text input
├── ScriptModule.tsx      # Script editing
├── TTSModule.tsx         # Audio generation
├── VideoModule.tsx       # Video generation (stub)
└── ExportModule.tsx      # Download buttons

hooks/
└── useStudioState.ts     # localStorage state management

app/(public)/
└── page.tsx              # Main studio page (replace placeholder)
```

---

## Success Criteria

After Phase 3:
- ✅ User visits `/` and sees 5 module cards
- ✅ Can paste text → save → see in script module
- ✅ Can edit script → save
- ✅ Can select speaker from dropdown (real API call)
- ✅ Can generate audio → hear preview (real Modal API)
- ✅ Can download audio file
- ✅ State persists on page reload (localStorage)
- ✅ All without login

---

## Implementation Order

1. Create `hooks/useStudioState.ts` (state + localStorage)
2. Create module components (Ingest → Script → TTS → Video → Export)
3. Update `app/(public)/page.tsx` with module cards
4. Add toast notifications
5. Test end-to-end flow
6. Polish UI (loading states, empty states)

---

## Dependencies

- Phase 2 complete ✅ (API endpoints ready)
- shadcn/ui components installed ✅ (Button, Card, Input, Toast)

---

## Estimated Duration

**Total**: 2-3 hours focused work

- Planning: Done
- Implementation: 2 hours
- Testing & Polish: 30-60 min

---

## Next Phase After This

**Phase 4**: Authentication flow (magic link, dashboard)
- Can start immediately after Phase 3
- Independent workstream

---

**Ready to proceed with implementation?**
