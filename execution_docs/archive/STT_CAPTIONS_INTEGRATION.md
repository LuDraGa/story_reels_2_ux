# STT + Captions Integration - Execution Doc

**Date**: 2026-02-10
**Status**: ✅ Core implementation complete, ready for UI integration

---

## 🎯 Objective

Integrate WhisperX STT API to automatically generate word-level captions for generated audio, enabling:
1. Auto-captioning for videos
2. Karaoke-style word highlighting (TikTok/Reels)
3. Focus word emphasis (LLM-detected important words)

---

## ✅ Completed Work

### 1. WhisperX Integration Library
**File**: `lib/api/whisperx.ts` (346 lines)

**Features**:
- Type-safe TypeScript definitions for WhisperX API
- `TranscriptionResponse`, `TranscriptionWord`, `TranscriptionSegment` types
- `callWhisperXTranscribe()` - NO retries/timeout for expensive operations
- `callWhisperXWithRetry()` - Exponential backoff for lightweight endpoints
- `generateCaptionStoragePath()` - Storage path logic (one-off vs logged-in)
- `validateAudioFile()` - Format validation (WAV, MP3, M4A, FLAC)
- `estimateTranscriptionTime()` - Predict processing time
- User-friendly error messages

**Key Constants**:
```typescript
WHISPERX_API_BASE_URL = https://abhirooprasad--whisperx-apis-fastapi-app.modal.run
```

---

### 2. STT API Route
**File**: `app/api/stt/transcribe/route.ts` (154 lines)

**Endpoint**: `POST /api/stt/transcribe`

**Request** (multipart/form-data):
- `file`: Audio file (WAV, MP3, M4A, FLAC)
- `language` (optional): Language code (e.g., "en") - auto-detected if not provided
- `projectId` (optional): For logged-in users
- `sessionId` (optional): For one-off studio

**Response**:
```json
{
  "transcription": {
    "text": "Full transcript",
    "language": "en",
    "duration": 120.55,
    "segments": [
      {
        "text": "Segment text",
        "start": 0.031,
        "end": 7.044,
        "words": [
          {"word": "My", "start": 0.031, "end": 0.271, "score": 0.64}
        ]
      }
    ]
  },
  "storagePath": "projects/oneoff/{sessionId}/captions/1234567890.json",
  "transcriptionUrl": "https://...signed-url...",
  "metadata": {
    "duration": 120.55,
    "language": "en",
    "wordCount": 354,
    "processingTime": 35.5
  }
}
```

**Features**:
- Server-side only (no browser calls)
- Stores transcription JSON in Supabase Storage
- Returns signed URL for download
- Handles both one-off and authenticated users
- Comprehensive logging

---

### 3. SRT Caption Generator
**File**: `lib/captions/srt-generator.ts` (459 lines)

**Main Functions**:

#### `generateSRT(transcription, options)`
Master function that routes to specific caption styles.

**Options**:
```typescript
{
  style: 'sentence' | 'word',  // Caption style
  maxWordsPerCaption: 5,       // For sentence style
  maxCharsPerLine: 50,         // Max characters per line
  focusWords: [10, 25, 50],    // Word indices to emphasize
  focusMarker: '[FOCUS]'       // Marker for focus words
}
```

#### `generateSentenceCaptions()`
**Output**: 3-7 words per caption (standard YouTube/TV style)
- Groups words into readable phrases
- Breaks on punctuation
- Adds focus word markers

**Example**:
```srt
1
00:00:00,031 --> 00:00:03,297
My 46F daughters, 17 and

2
00:00:03,317 --> 00:00:05,601
15, have a strained relationship
```

#### `generateWordCaptions()`
**Output**: 1 word per caption (TikTok/Reels karaoke style)
- One caption per word
- Frame-accurate timing
- Individual word emphasis

**Example**:
```srt
1
00:00:00,031 --> 00:00:00,271
My

2
00:00:00,291 --> 00:00:01,153
46F
```

#### `generateKaraokeCaptions()`
**Output**: Rolling window with current word highlighted (most engaging)
- 3-5 words visible at once
- Current word bolded
- Context words shown
- HTML-style formatting: `<b>current</b>`

**Example**:
```srt
1
00:00:00,031 --> 00:00:00,271
<b>My</b> 46F daughters,

2
00:00:00,291 --> 00:00:01,153
My <b>46F</b> daughters, 17

3
00:00:01,975 --> 00:00:02,435
My 46F <b>daughters,</b> 17 and
```

**Utility Functions**:
- `formatSRTTimestamp()` - Convert seconds to `HH:MM:SS,mmm`
- `generateSRTContent()` - Build SRT file from entries
- `extractTextFromSRT()` - Get plain text from SRT
- `getSRTDuration()` - Get total duration

---

## 🧪 Real-World Testing Results

### Test Audio File
- **File**: `Reel Story Studio Voiceover.wav`
- **Size**: 5.5MB
- **Duration**: 120.55 seconds (~2 minutes)

### WhisperX Performance
| Metric | Result |
|--------|--------|
| Processing Time | **35.5 seconds** |
| Speed | **3.4x faster than real-time** |
| Total Words | 354 words |
| Segments | 22 segments |
| Avg Confidence | **85.4%** (excellent) |

### SRT Output Quality
| Style | Captions Generated | Quality |
|-------|-------------------|---------|
| Sentence (5 words/line) | 79 captions | ✅ Perfect |
| Word-by-word | 354 captions | ✅ Perfect |
| Karaoke (rolling) | 354 captions | ✅ Perfect |

**Conclusion**: WhisperX provides **frame-accurate word timestamps** with high confidence. SRT generation works flawlessly.

---

## 📁 Files Created/Modified

### New Files (3)
1. `lib/api/whisperx.ts` - WhisperX integration library
2. `app/api/stt/transcribe/route.ts` - Transcription API endpoint
3. `lib/captions/srt-generator.ts` - SRT generation utilities

### Modified Files (2)
1. `.env.example` - Added `WHISPERX_API_BASE_URL`
2. `.env.local` - Added WhisperX URL (production ready)

---

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Already added to .env.local
WHISPERX_API_BASE_URL=https://abhirooprasad--whisperx-apis-fastapi-app.modal.run
```

### Storage Bucket Requirements
- Uses existing `projects` bucket
- Stores transcription JSON at: `projects/{userId}/{projectId}/captions/{timestamp}.json`
- One-off path: `projects/oneoff/{sessionId}/captions/{timestamp}.json`

---

## 🚀 Next Steps (To Complete Video Pipeline)

### Phase 1: UI Integration (2-3 hours)
1. **Update TTSModule** to auto-generate captions after TTS
   - Add "Generate Captions" button
   - Show loading state during transcription
   - Display caption preview
   - Allow download of SRT file

2. **Add caption preview component**
   - Show first 5-10 captions
   - Toggle between sentence/word/karaoke styles
   - Download button for SRT file

### Phase 2: Video Rendering Integration (6-8 hours)
1. **Tag-based asset selection** (VideoModule)
   - User picks tags (e.g., "gameplay", "action")
   - Query `background_assets` table
   - Select videos matching tags

2. **Video clipping algorithm**
   - Calculate total audio duration
   - Select/clip videos to match duration
   - Handle looping if insufficient content

3. **FFmpeg rendering with captions**
   - Concat videos to match audio length
   - Overlay audio track
   - Burn in SRT captions with styling
   - Apply focus word emphasis

### Phase 3: LLM Focus Word Detection (2-3 hours)
1. **Add LLM endpoint** (`/api/analyze/focus-words`)
   - Input: Script text
   - Prompt: "Identify 5-10 key words to emphasize"
   - Output: Array of word indices

2. **Integrate with caption generation**
   - Pass focus words to SRT generator
   - Highlight in karaoke style
   - Larger font/different color in video

---

## 💡 Usage Examples

### Example 1: Transcribe Audio (Server-Side)
```typescript
// In API route or Server Action
const formData = new FormData()
formData.append('file', audioBlob)
formData.append('language', 'en')
formData.append('sessionId', 'abc123')

const response = await fetch('/api/stt/transcribe', {
  method: 'POST',
  body: formData,
})

const { transcription, transcriptionUrl } = await response.json()
console.log('Transcribed:', transcription.text)
```

### Example 2: Generate Sentence Captions
```typescript
import { generateSRT } from '@/lib/captions/srt-generator'

const srt = generateSRT(transcription, {
  style: 'sentence',
  maxWordsPerCaption: 5,
  maxCharsPerLine: 50,
})

// Save to file or upload to Supabase Storage
await supabase.storage
  .from('projects')
  .upload('captions/video.srt', srt, {
    contentType: 'text/plain',
  })
```

### Example 3: Generate Karaoke Captions with Focus Words
```typescript
import { generateKaraokeSRT } from '@/lib/captions/srt-generator'

// Assume LLM detected these as important words
const focusWords = [10, 25, 50, 100, 150]

const karaokeSrt = generateKaraokeSRT(transcription, focusWords)
```

---

## 🎬 Video Rendering Workflow (Future)

```
1. User generates TTS audio
   ↓
2. Auto-transcribe with WhisperX (35s for 2min audio)
   ↓
3. Generate SRT captions (instant)
   ↓
4. [Optional] LLM detects focus words (5-10s)
   ↓
5. User selects asset tags (e.g., "gameplay")
   ↓
6. System selects/clips matching videos
   ↓
7. FFmpeg renders video:
   - Concat/clip backgrounds
   - Overlay audio
   - Burn in karaoke captions
   - Apply focus word styling
   ↓
8. Job queue tracks progress
   ↓
9. User downloads final video
```

---

## 📊 Performance Estimates

| Step | Duration | Notes |
|------|----------|-------|
| TTS Generation | 5-15s | Coqui XTTS (already implemented) |
| WhisperX Transcription | 10-40s | 3.4x faster than audio duration |
| SRT Generation | <1s | Instant (client-side or server) |
| LLM Focus Words | 5-10s | Claude/GPT API call |
| Video Selection | 1-2s | Database query |
| FFmpeg Rendering | 30-120s | Depends on video length/complexity |
| **Total (2min video)** | **~1-3 minutes** | Most time in rendering |

---

## 🔒 Security Considerations

1. **Server-Side Only**: All Modal API calls happen server-side
2. **Audio File Validation**: Format checking before upload
3. **Signed URLs**: 1-hour expiry for downloads
4. **RLS Policies**: Users can only access own transcriptions
5. **No Retries on Transcription**: Prevents expensive duplicate calls

---

## 🐛 Known Limitations

1. **No Speaker Diarization**: WhisperX doesn't identify different speakers (yet)
2. **Punctuation**: May not always be perfect (could post-process with LLM)
3. **Focus Word Styling**: Requires FFmpeg `drawtext` filter (not implemented yet)
4. **Max File Size**: No explicit limit set (should add 50MB cap)

---

## 📝 TODO Comments in Code

Search codebase for:
- `TODO: Add speaker diarization` (when WhisperX adds support)
- `TODO: Add punctuation post-processing` (LLM-based cleanup)
- `TODO: Implement FFmpeg karaoke rendering` (VideoModule)

---

## ✅ Success Criteria

- [x] WhisperX API integration with proper types
- [x] Server-side transcription endpoint
- [x] SRT generation (sentence, word, karaoke styles)
- [x] Real-world testing with 2min audio file
- [x] Environment variables configured
- [ ] UI integration (TTSModule caption button)
- [ ] Caption preview component
- [ ] Video rendering with captions (FFmpeg)
- [ ] LLM focus word detection
- [ ] End-to-end video generation workflow

---

**Status**: Ready for UI integration and video rendering pipeline!
