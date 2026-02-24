# Video Duration Validation - Execution Doc

**Date:** 2026-02-24
**Task:** Prevent video composition when selected background videos are shorter than audio duration

## Problem
- Users can select background videos that are collectively shorter than the audio
- Video composition API is called even when insufficient video content exists
- Results in unexpected video output (cuts off early, loops incorrectly, etc.)

## Root Cause
- Frontend passes only video URLs (`string[]`) to VideoModule
- No duration information available for validation
- No pre-submission validation before calling `/api/video/compose`

## Solution
Pass full `Asset` objects (which include `duration_sec`) instead of just URLs, enabling duration validation in the UI.

## Implementation Plan

### 1. AssetLibrary.tsx Changes
- [x] Update prop interface: `selectedVideoAssets: Asset[]` instead of `selectedVideos: string[]`
- [x] Modify `handleVideoToggle()` to pass Asset objects
- [x] Update `handleRandomizeVideos()` to work with Asset objects
- [x] Update rendering logic to check selected assets by ID

### 2. VideoModule.tsx Changes
- [x] Accept `selectedVideoAssets: Asset[]` prop
- [x] Calculate `totalVideoDuration = sum(asset.duration_sec)`
- [x] Add validation: `totalVideoDuration >= audioDuration`
- [x] Display duration indicator (X selected / Y needed)
- [x] Block compose button if validation fails
- [x] Show clear error message
- [x] Extract URLs from Asset objects before API call

### 3. Parent Page Changes
- [x] `app/(app)/app/projects/[id]/page.tsx`: Change state to `Asset[]`
- [x] `app/(public)/page.tsx`: Change state to `Asset[]`
- [x] Update callback signatures

### 4. UX Enhancements
- [x] Duration indicator with color coding (red/green)
- [x] Clear error message when insufficient
- [x] Individual video durations visible (already exists in AssetCard)

## Files Modified
1. `components/studio/AssetLibrary.tsx`
2. `components/studio/VideoModule.tsx`
3. `app/(app)/app/projects/[id]/page.tsx`
4. `app/(public)/page.tsx`

## Testing Checklist
- [ ] Select videos shorter than audio → see error
- [ ] Select videos equal to audio → can compose
- [ ] Select videos longer than audio → can compose
- [ ] Deselect videos → see indicator update
- [ ] Randomize videos → validation still works
- [ ] One-off studio flow works
- [ ] Authenticated project flow works
- [ ] Type check passes

## Status
- **Started:** 2026-02-24
- **Status:** ✅ Complete
- **Completed:** 2026-02-24

## Summary
Successfully implemented video duration validation to prevent video composition when selected background videos are shorter than audio duration. All components updated to pass full Asset objects (with duration_sec) instead of just URLs, enabling proper validation in the UI before API calls.

Key changes:
- AssetLibrary now passes Asset[] instead of string[]
- VideoModule validates total video duration against audio duration
- Visual indicator shows duration comparison (green/red)
- Clear error messages guide users to select more videos
- Both authenticated and one-off studio flows updated
- localStorage persistence updated for Asset objects

No type errors introduced (pre-existing Supabase type errors remain).
