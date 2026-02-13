# UI Fixes & Improvements - Planning

**Date**: 2026-02-13
**Status**: Planning
**Priority**: High

## Overview

Five UI/UX improvements needed across the application:
1. Update Supabase heartbeat frequency (every 12 hours instead of 2 days)
2. Show all captions in preview (not just first 5)
3. Implement upload component for background assets
4. Implement real video download (remove stub)
5. ASS caption editor (FUTURE - not in this phase)

---

## Task 1: Update Supabase Heartbeat Frequency

**Current State**: `.github/workflows/supabase-heartbeat.yml`
- Runs every 2 days: `cron: '0 12 */2 * *'`
- Comment says "Every 2 days at 12:00 UTC"

**Required Change**:
- Run every 12 hours instead
- Cron: `0 */12 * * *` (every 12 hours)
- Update comment to reflect new schedule

**Files to Modify**:
- `.github/workflows/supabase-heartbeat.yml` - Line 6

**Rationale**: More frequent heartbeats = better protection against Supabase Free tier pause (7-day threshold)

**Risk**: Low - just a schedule change

---

## Task 2: Show All Captions in Preview

**Current State**: `components/studio/CaptionPreview.tsx`
- Line 49: `.slice(0, 5)` limits preview to first 5 captions
- Line 169: Shows text "Preview (first 5 captions):"
- Line 197-200: Shows "... and X more" message

**Required Changes**:
1. Remove `.slice(0, 5)` limit (line 49)
2. Update text from "Preview (first 5 captions):" to "Preview:"
3. Remove "... and X more" conditional block (lines 197-200)
4. Add max-height + scrolling to caption list for better UX

**Files to Modify**:
- `components/studio/CaptionPreview.tsx` - Lines 49, 169, 177-203

**Implementation Details**:
```tsx
// Before (line 49):
const parsed = parseSRT(srtContent).slice(0, 5)

// After:
const parsed = parseSRT(srtContent) // Show all

// Add scrollable container (line 177):
<div className="space-y-3 max-h-96 overflow-y-auto pr-2">
  {captions.map(...)}
</div>
```

**UX Improvements**:
- Use `max-h-96` (384px) for scrollable area
- Add `pr-2` for padding when scrollbar appears
- Consider adding scroll shadows for visual indication

**Risk**: Low - simple DOM change

---

## Task 3: Implement Upload Component

**Current State**: `components/studio/AssetSelector.tsx`
- Lines 198-220: Shows stub message "Upload component coming soon"
- Lines 203-218: Placeholder UI with "Or choose from library instead" link

**Good News**: `AssetUploader` component **already exists**!
- File: `components/studio/AssetUploader.tsx`
- Fully functional with progress bar, validation, tags, etc.
- Already handles both video and audio types
- Uses `/api/assets/upload` endpoint

**Required Changes**:
1. Import `AssetUploader` component
2. Replace stub placeholder (lines 203-218) with actual component
3. Pass correct props:
   - `type` (video or audio from parent)
   - `onUploadComplete` callback to refresh asset list

**Files to Modify**:
- `components/studio/AssetSelector.tsx` - Lines 1 (import), 203-218 (replacement)

**Implementation**:
```tsx
// Add import (line 6):
import { AssetUploader } from './AssetUploader'

// Replace lines 203-218:
<AssetUploader
  type={type}
  onUploadComplete={() => {
    loadAssets() // Refresh asset list
    setShowUploader(false) // Close uploader
    setIsExpanded(true) // Show library with new asset
  }}
/>
```

**Risk**: Very low - component already exists and tested

---

## Task 4: Implement Real Video Download

**Current State**: `components/studio/ExportModule.tsx`
- Lines 58-66: `handleDownloadVideo()` shows stub toast
- Line 61-64: Toast says "Real video download coming in Phase 7"
- Lines 116-126: Video download UI shows "Download (Stub)" button
- Line 120: Says "MP4 format (stub)"

**Audio Download Pattern** (working reference):
- Lines 20-56: `handleDownloadAudio()` implementation
- Uses fetch → blob → createObjectURL → download pattern
- Works for cross-origin Supabase Storage URLs

**Required Changes**:
1. Implement real `handleDownloadVideo()` using same pattern as audio
2. Update button text from "Download (Stub)" to "Download"
3. Update format text from "MP4 format (stub)" to "MP4 format"

**Files to Modify**:
- `components/studio/ExportModule.tsx` - Lines 58-66, 120, 123

**Implementation**:
```tsx
const handleDownloadVideo = async () => {
  if (!videoUrl) return

  try {
    // Fetch the video file as a blob (works for cross-origin URLs)
    const response = await fetch(videoUrl)
    if (!response.ok) throw new Error('Failed to fetch video')

    const blob = await response.blob()

    // Create blob URL (same-origin, so download attribute works)
    const blobUrl = URL.createObjectURL(blob)

    // Create temporary link and trigger download
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `reel-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up blob URL
    URL.revokeObjectURL(blobUrl)

    toast({
      title: 'Download started',
      description: 'Your video file is downloading',
    })
  } catch (error) {
    console.error('Download failed:', error)
    toast({
      title: 'Download failed',
      description: 'Please try again',
      variant: 'destructive',
    })
  }
}
```

**Risk**: Low - exact same pattern as working audio download

---

## Task 5: ASS Caption Editor (FUTURE)

**Status**: Not implemented in this phase
**Reference**: User mentioned clideo.com for inspiration

**Requirements** (for future):
- Edit ASS caption properties:
  - Position (X, Y coordinates)
  - Size (font size)
  - Focus (highlighting)
  - Location (alignment)
- Visual editor UI
- Real-time preview

**Notes**:
- Defer until tasks 1-4 are complete
- Requires significant UI work
- May need ASS parser library
- Could be separate modal/page

---

## Execution Order

1. **Heartbeat** (2 min) - Simple cron change
2. **Captions Display** (5 min) - Remove slice, add scrolling
3. **Upload Component** (5 min) - Import existing component
4. **Video Download** (10 min) - Copy audio pattern
5. **Test all changes** (10 min)
6. **Commit** (2 min)

**Total Estimated Time**: ~35 minutes

---

## Testing Plan

### 1. Heartbeat
- ✅ Check YAML syntax is valid
- ✅ Verify cron expression is correct (use crontab.guru)
- ✅ Commit references correct schedule in comments

### 2. Captions Display
- ✅ Load project with >5 captions
- ✅ Verify all captions render
- ✅ Verify scrolling works smoothly
- ✅ Check "Preview:" text (no "first 5")
- ✅ Verify no "... and X more" message

### 3. Upload Component
- ✅ Click "Upload New" for video
- ✅ Upload a test video file
- ✅ Verify uploader UI shows (no stub message)
- ✅ Verify upload completes successfully
- ✅ Verify library refreshes and shows new asset
- ✅ Repeat for audio

### 4. Video Download
- ✅ Generate a video
- ✅ Click "Download" button (not "Download (Stub)")
- ✅ Verify video file downloads
- ✅ Verify file opens and plays correctly
- ✅ Check toast shows "Download started"

---

## Dependencies

- No new packages needed
- No API changes needed
- No database changes needed
- All components/utilities already exist

---

## Notes

- Task 5 (ASS editor) is explicitly deferred
- All other tasks are straightforward fixes
- No breaking changes
- Low risk - mostly UI updates
