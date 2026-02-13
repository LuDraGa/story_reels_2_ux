# ASS Captions Implementation - Execution Doc

**Date**: 2026-02-10
**Planning Doc**: See `ASS_CAPTIONS_PLANNING.md`
**Status**: 🟡 Not Started
**Estimated Time**: 8-10 hours

---

## 📋 Phase 1: ASS Generator Core (3-4 hours)

### 1.1 Create ASS Presets Library
- [ ] Create `lib/captions/ass-presets.ts`
  - [ ] Define `ASSStyle` interface
  - [ ] TikTok preset (Impact, yellow, bold, large)
  - [ ] Instagram preset (Helvetica, white, clean)
  - [ ] YouTube preset (Arial, standard)
  - [ ] Focus preset (large, cyan, extra outline)
  - [ ] Color conversion utils (RGB ↔ BGR hex)
  - [ ] Time formatting (seconds → h:mm:ss.cc)

**Files**: `lib/captions/ass-presets.ts` (new)

---

### 1.2 Create ASS Generator
- [ ] Create `lib/captions/ass-generator.ts`
  - [ ] `generateASS()` main function
  - [ ] `ASSOptions` interface
  - [ ] Script header generation
  - [ ] Style definitions from presets
  - [ ] Karaoke timing conversion (`\k` tags)
  - [ ] Multi-line grouping (5 words/line)
  - [ ] Focus word inline styling
  - [ ] Export utilities

**Files**: `lib/captions/ass-generator.ts` (new)

**Test**:
```bash
# Quick test with existing transcription
npx tsx --eval "
import { generateASS } from './lib/captions/ass-generator'
import * as fs from 'fs'
const data = JSON.parse(fs.readFileSync('/tmp/whisperx_response.json', 'utf-8'))
const ass = generateASS(data, { preset: 'tiktok', focusWords: [10, 25, 50] })
fs.writeFileSync('/tmp/test.ass', ass)
console.log('✅ ASS generated:', ass.split('\\n').length, 'lines')
"
```

---

## 📋 Phase 2: LLM Focus Word Detection (2-3 hours)

### 2.1 Add Environment Variable
- [ ] Add `ANTHROPIC_API_KEY` to `.env.example`
- [ ] Add to `.env.local` (user provides key)
- [ ] Update docs with setup instructions

**Files**: `.env.example`, `docs/API_INTEGRATION.md` (update)

---

### 2.2 Create LLM Focus Words API
- [ ] Create `app/api/llm/focus-words/route.ts`
  - [ ] POST endpoint accepting `{ text, maxWords }`
  - [ ] Anthropic Claude API client
  - [ ] Structured prompt for focus word detection
  - [ ] JSON parsing and validation
  - [ ] Word index mapping (match to transcription)
  - [ ] Error handling (fallback: no focus words)
  - [ ] Rate limiting check

**Files**: `app/api/llm/focus-words/route.ts` (new)

**Test**:
```bash
curl -X POST http://localhost:3000/api/llm/focus-words \
  -H "Content-Type: application/json" \
  -d '{"text":"My daughters have a strained relationship...","maxWords":5}'
```

---

## 📋 Phase 3: API Integration (2 hours)

### 3.1 Update STT Endpoint
- [ ] Modify `app/api/stt/transcribe/route.ts`
  - [ ] Import `generateASS`
  - [ ] Add request params: `captionStyle`, `detectFocusWords`
  - [ ] Generate ASS after SRT
  - [ ] [Optional] Call `/api/llm/focus-words` if `detectFocusWords=true`
  - [ ] Regenerate ASS with focus words
  - [ ] Upload ASS to Supabase Storage (authenticated only)
  - [ ] Return ASS as data URL (anonymous)
  - [ ] Return `assUrl` and `assPath` in response

**Files**: `app/api/stt/transcribe/route.ts` (modify)

**Response Format**:
```json
{
  "transcription": {...},
  "srtUrl": "...",
  "assUrl": "...",  // NEW
  "transcriptionUrl": "...",
  "focusWords": [...],  // NEW (if detectFocusWords=true)
  "metadata": {
    "captionCount": 79,
    "style": "tiktok"  // NEW
  }
}
```

---

### 3.2 Update Studio State Hook
- [ ] Modify `hooks/useStudioState.ts`
  - [ ] Add `assUrl: string | null` to `StudioState`
  - [ ] Add `captionStyle: 'tiktok' | 'instagram' | 'youtube'` to state
  - [ ] Add `updateCaptions()` to accept `assUrl`
  - [ ] Update `resetState()` and `clearCaptions()`

**Files**: `hooks/useStudioState.ts` (modify)

---

## 📋 Phase 4: UI Updates (2-3 hours)

### 4.1 Update CaptionPreview Component
- [ ] Modify `components/studio/CaptionPreview.tsx`
  - [ ] Add `assUrl` prop
  - [ ] Add "Download ASS" button
  - [ ] Add visual style indicator (TikTok/Instagram/YouTube badge)
  - [ ] Show focus words in preview (highlighted differently)
  - [ ] Handle ASS data URL downloads (anonymous users)

**Files**: `components/studio/CaptionPreview.tsx` (modify)

**UI Changes**:
```tsx
<div className="flex gap-2">
  <Button onClick={downloadSRT} variant="outline">
    📄 SRT (YouTube/compatibility)
  </Button>
  <Button onClick={downloadASS} className="bg-gradient-to-r from-pink-500 to-yellow-500">
    ✨ ASS (TikTok style)
  </Button>
</div>
```

---

### 4.2 Update TTSModule
- [ ] Modify `components/studio/TTSModule.tsx`
  - [ ] Add caption style selector (before caption generation)
  - [ ] Add "Detect focus words" checkbox
  - [ ] Pass `captionStyle` and `detectFocusWords` to API
  - [ ] Update `onCaptionsGenerated` callback to accept `assUrl`
  - [ ] Show loading state for focus word detection

**Files**: `components/studio/TTSModule.tsx` (modify)

**UI Addition**:
```tsx
{/* Caption Style Selection */}
{audioUrl && !srtUrl && (
  <div className="space-y-2">
    <label className="text-sm font-medium">Caption Style</label>
    <Select value={captionStyle} onChange={setCaptionStyle}>
      <option value="tiktok">🎬 TikTok (bold, yellow highlight)</option>
      <option value="instagram">📸 Instagram (clean, white)</option>
      <option value="youtube">▶️ YouTube (standard)</option>
    </Select>
    <Checkbox checked={detectFocusWords}>
      ✨ Emphasize key words (AI-detected)
    </Checkbox>
  </div>
)}
```

---

### 4.3 Wire Up Home Page
- [ ] Modify `app/(public)/page.tsx`
  - [ ] Pass `assUrl` and `captionStyle` state to TTSModule
  - [ ] Handle `updateCaptions` with ASS URL

**Files**: `app/(public)/page.tsx` (modify)

---

## 🧪 Testing Phase (1 hour)

### Manual Testing Checklist
- [ ] **Test 1: TikTok Preset**
  - [ ] Generate audio from test script
  - [ ] Select "TikTok" style
  - [ ] Generate captions
  - [ ] Download ASS file
  - [ ] Open in Aegisub → verify yellow karaoke highlighting
  - [ ] Test FFmpeg: `ffmpeg -i test.mp4 -vf "ass=test.ass" output.mp4`

- [ ] **Test 2: Instagram Preset**
  - [ ] Repeat above with Instagram style
  - [ ] Verify clean white styling

- [ ] **Test 3: YouTube Preset**
  - [ ] Repeat with YouTube style
  - [ ] Verify standard readable captions

- [ ] **Test 4: Focus Words (LLM)**
  - [ ] Enable "Detect focus words" checkbox
  - [ ] Generate captions
  - [ ] Verify focus words are larger/different color
  - [ ] Check API logs for LLM call

- [ ] **Test 5: Anonymous User**
  - [ ] Clear auth (logout)
  - [ ] Generate captions
  - [ ] Verify ASS returned as data URL
  - [ ] Download ASS file works
  - [ ] Check localStorage persistence

- [ ] **Test 6: Authenticated User**
  - [ ] Login
  - [ ] Generate captions
  - [ ] Verify ASS uploaded to Supabase
  - [ ] Verify signed URL returned
  - [ ] Check database metadata

---

## 📊 Progress Tracking

| Phase | Status | Time Spent | Notes |
|-------|--------|------------|-------|
| 1.1 ASS Presets | ⚪ Not Started | - | - |
| 1.2 ASS Generator | ⚪ Not Started | - | - |
| 2.1 Env Setup | ⚪ Not Started | - | - |
| 2.2 LLM API | ⚪ Not Started | - | - |
| 3.1 STT Update | ⚪ Not Started | - | - |
| 3.2 State Hook | ⚪ Not Started | - | - |
| 4.1 Preview Component | ⚪ Not Started | - | - |
| 4.2 TTSModule | ⚪ Not Started | - | - |
| 4.3 Wire Home Page | ⚪ Not Started | - | - |
| Testing | ⚪ Not Started | - | - |

**Legend**: ⚪ Not Started | 🟡 In Progress | ✅ Complete

---

## 🐛 Known Issues & Blockers

**Current**: None

**Anticipated**:
1. Color conversion (RGB ↔ BGR) - ASS uses BGR hex format
2. Font availability - TikTok uses Impact, may not be on all systems
3. LLM rate limits - Anthropic free tier: 50 req/min
4. Karaoke timing precision - need centisecond accuracy

---

## 📝 Implementation Notes

### Color Conversion Formula
```typescript
// RGB to BGR hex for ASS
function rgbToBGR(r: number, g: number, b: number): string {
  return `&H00${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}&`
}

// Examples:
// Yellow (255, 255, 0) → &H0000FFFF&
// Cyan (0, 255, 255) → &H00FFFF00&
// Black (0, 0, 0) → &H00000000&
```

### ASS Time Format
```typescript
function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const cs = Math.floor((seconds % 1) * 100) // centiseconds
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}
```

### Karaoke Timing
```typescript
// WhisperX: { word: "hello", start: 1.5, end: 2.0 }
// Duration: 2.0 - 1.5 = 0.5s = 50 centiseconds
// ASS: {\k50}hello
```

---

## ✅ Definition of Done

- [ ] All files created/modified as planned
- [ ] ASS files generated for all 3 presets
- [ ] Karaoke timing accurate (<100ms drift)
- [ ] Focus words correctly emphasized
- [ ] LLM integration working
- [ ] Both anonymous and authenticated flows work
- [ ] Downloads work (data URLs and Supabase signed URLs)
- [ ] FFmpeg can render ASS captions on video
- [ ] Code is clean, typed, and follows existing patterns
- [ ] No console errors or warnings
- [ ] localStorage persistence works
- [ ] Documentation updated

---

## 🚀 Next Steps After Completion

1. **Update docs**:
   - Add ASS generation to `docs/WORKFLOWS.md`
   - Update `docs/API_INTEGRATION.md` with LLM endpoint
   - Add "Caption Styles" section to `docs/ARCHITECTURE.md`

2. **Archive docs**:
   - Move `ASS_CAPTIONS_PLANNING.md` to `execution_docs/archive/`
   - Move `ASS_CAPTIONS_EXECUTION.md` to `execution_docs/archive/`
   - Create summary in `execution_docs/IMPLEMENTATION_STATUS.md`

3. **Future enhancements**:
   - Custom style editor UI
   - More animation effects
   - Position customization
   - FFmpeg auto-rendering integration

---

**Ready to start implementation!** 🚀

Begin with Phase 1.1 (ASS Presets).
