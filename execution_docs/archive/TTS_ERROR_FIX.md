# TTS Error Fix - Supabase Upload Issue

**Date**: 2025-02-08
**Issue**: Modal API works but UI shows error

---

## 🐛 Problem Diagnosed

**Symptoms**:
- Backend logs: Modal API returns 200 OK, audio generated successfully
- UI shows: `{"error":"Failed to generate audio. Please try again."}`

**Root Cause**:
1. Modal TTS API works perfectly (returns audio/wav, 200 OK)
2. Next.js API route receives audio successfully
3. **Tries to upload to Supabase Storage**
4. **Supabase has dummy credentials** (not real project)
5. Upload fails silently
6. Catch block returns generic error

---

## ✅ Solution Implemented

**File**: `app/api/voice/tts/route.ts`

### Change: Detect Dummy Supabase and Use Data URL Fallback

**Logic**:
```typescript
// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDummySupabase = supabaseUrl.includes('dummy-project-id')

if (isDummySupabase) {
  // Return audio as base64 data URL (no storage needed)
  const base64Audio = Buffer.from(audioBuffer).toString('base64')
  audioUrl = `data:audio/wav;base64,${base64Audio}`
  storagePath = 'temp://not-stored'
} else {
  // Real Supabase - upload to storage normally
  const supabase = await createSupabaseServerClient()
  // ... normal upload flow
}
```

### Benefits:
1. **Works without Supabase** - One-off studio fully functional
2. **No dummy credential errors** - Graceful fallback
3. **Audio plays immediately** - Embedded in response as data URL
4. **Zero storage cost** - For testing/demo without real Supabase

---

## 🎯 How It Works Now

### With Dummy Credentials (Current Setup):
1. User clicks "Generate Audio"
2. Modal API generates audio (takes 1-2 minutes)
3. Audio returned as base64 data URL
4. Browser plays audio directly from data URL
5. **No storage** - audio exists only in browser memory
6. Audio lost on page refresh (expected for one-off studio)

### With Real Supabase:
1. User clicks "Generate Audio"
2. Modal API generates audio
3. Audio uploaded to Supabase Storage
4. Returns public URL
5. **Persists** - audio available across sessions
6. Audio survives page refresh

---

## 🧪 Testing

### Test with Dummy Supabase (Current):
```bash
pnpm dev
# 1. Load TTS module
# 2. Enter text, select speaker
# 3. Click "Generate Audio"
# 4. Wait 1-2 minutes
# 5. Audio player appears and works!
# 6. Console shows: "Supabase not configured, returning audio as data URL"
```

### Expected Console Logs (Success):
```
[TTS] Request received: { textLength: 50, speaker_id: 'Aaron Dreschner', ... }
[TTS] Calling Modal API...
[TTS] Modal API response: { status: 200, contentType: 'audio/wav' }
[TTS] Audio buffer size: 75340
[TTS] Supabase not configured, returning audio as data URL
[TTS] Audio converted to data URL (size: 100454 chars)
[TTS] Success! Returning response: { audioUrl: 'data:audio/wav;base64...', ... }
```

### Test with Real Supabase:
1. Set real Supabase credentials in `.env.local`
2. Create "projects" storage bucket
3. Run `pnpm dev`
4. Generate audio
5. Should upload to storage and return public URL

---

## 📊 Data URL Size

**Audio sizes**:
- WAV file: ~75KB for 5 seconds
- Base64 encoded: ~100KB (33% larger)
- Data URL total: ~100KB in JSON response

**Limits**:
- Browser data URL size limit: ~50-100MB (varies by browser)
- TTS audio typically < 1MB, so safe for data URLs
- Long scripts (5+ minutes) = larger files, but still OK

**Note**: For production with long audio, use real Supabase Storage to avoid large response payloads.

---

## 🔧 Enhanced Logging

Added comprehensive logging at each step:

1. **Request received**: Shows what data came in
2. **Calling Modal API**: Before expensive call
3. **Modal API response**: Status and content type
4. **Audio buffer size**: Confirms audio downloaded
5. **Supabase check**: Dummy or real
6. **Upload/data URL conversion**: Which path taken
7. **Success**: Final response details
8. **Errors**: Full error details (name, message, stack)

**Benefits**:
- Easy debugging
- See exactly where it fails
- Performance monitoring
- Cost tracking (Modal API calls)

---

## 🚨 Important Notes

1. **Data URLs are temporary**: Audio lost on page refresh (expected for one-off studio)
2. **Memory usage**: Audio held in browser memory until page closed
3. **Not for production**: Real Supabase recommended for logged-in users
4. **Fallback is automatic**: No code changes needed when switching to real Supabase

---

## 🎯 Next Steps

### For Immediate Use (Testing):
- ✅ Works right now with dummy credentials
- ✅ One-off studio fully functional
- ✅ Audio generation and playback works

### For Production:
1. Create real Supabase project
2. Run database migration
3. Create "projects" storage bucket
4. Set real credentials in `.env.local`
5. Code automatically switches to storage upload

---

## ✅ Verification

All changes verified:
- [x] Type check passes
- [x] Dummy Supabase detection works
- [x] Data URL fallback implemented
- [x] Real Supabase path preserved
- [x] Comprehensive logging added
- [x] Error handling improved

**TTS now works with dummy credentials!** 🎉
