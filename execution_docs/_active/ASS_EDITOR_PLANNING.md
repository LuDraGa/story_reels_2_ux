# ASS Caption Editor - Comprehensive Planning

**Date**: 2026-02-13
**Status**: Planning Phase
**Priority**: High (Task 5 from UI Fixes)

---

## Table of Contents

1. [Research Summary](#research-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Feature Requirements](#feature-requirements)
4. [Technical Architecture](#technical-architecture)
5. [Implementation Phases](#implementation-phases)
6. [Critical Questions for User](#critical-questions-for-user)
7. [Risk Assessment](#risk-assessment)

---

## Research Summary

### Clideo's Approach (Industry Standard)

Based on research, modern subtitle editors like Clideo use:

**Timeline Features:**
- Visual timeline with audio waveform
- Draggable subtitle blocks (drag edges to adjust timing)
- Click-and-drag to reposition on timeline
- Visual representation of subtitle duration

**Styling Controls:**
- Font selection (dropdown)
- Font size slider/input
- Color pickers (text, background, outline)
- Alignment buttons (left/center/right, top/middle/bottom)
- Text formatting (bold, italic, underline)

**Positioning:**
- Drag subtitles on video canvas to reposition
- Numeric keypad-style alignment presets (1-9)
- Margin controls (left, right, vertical)

**Real-time Preview:**
- Video player with subtitle overlay
- Updates as you edit timing/position/style
- Scrubbing through timeline updates preview

### ASS Format Capabilities

Our ASS system supports **extensive styling** beyond basic SRT:

**Positioning:**
- X, Y coordinates (absolute positioning)
- 9-position alignment system (numpad layout)
- Per-caption margins (left, right, vertical)

**Styling (per style or inline):**
- Font name, size, colors (primary, secondary, outline, shadow)
- Bold, italic, underline, strikeout
- Scale X/Y, spacing, rotation angle
- Border style, outline thickness, shadow depth
- Karaoke effects (\k tags for word highlighting)

**What We Already Generate:**
- Word-level karaoke timing
- Focus word highlighting (inline style overrides)
- Three presets: TikTok, Instagram, YouTube
- Proper ASS file structure

---

## Current State Analysis

### ✅ What We Have

**Backend (Complete):**
- `lib/captions/ass-generator.ts` - Full ASS generation
- `lib/captions/ass-presets.ts` - Style system with presets
- Word-level timing from WhisperX transcription
- Karaoke effect generation
- Focus word detection and styling

**Current Workflow:**
1. User uploads audio → WhisperX transcribes with word timings
2. Backend generates SRT + ASS files automatically
3. User downloads ASS file
4. User clicks "Regenerate Video" → ASS burned into video via ffmpeg

**UI Components:**
- `CaptionPreview.tsx` - Shows first 5 captions (now all captions)
- Download SRT/ASS buttons
- Preset selection (TikTok/Instagram/YouTube)

### ❌ What's Missing (The Editor)

**No visual editor for:**
- Adjusting subtitle timing (start/end)
- Moving subtitles on screen (X/Y position)
- Changing individual caption styles
- Editing caption text
- Previewing changes on video before regenerating

**Current Pain Points:**
1. Can't see how captions look on video until after video generation
2. Can't adjust position/timing without regenerating ASS file
3. No way to fix mistakes or customize per-caption
4. Have to regenerate entire video to see changes

---

## Feature Requirements

### Must-Have (MVP)

**1. Visual Timeline** ⏱️
- Display all captions as blocks on timeline
- Show audio waveform (helps with timing)
- Current playhead indicator
- Scrub through video by clicking timeline

**2. Video Preview Canvas** 🎬
- Show video with ASS overlay rendered
- Sync with timeline playhead
- Play/pause controls
- Frame-by-frame stepping (left/right arrows)

**3. Caption Timing Editing** ⏰
- Drag caption block edges to adjust start/end time
- Click caption to select it
- Show selected caption's text in editor panel
- Update preview in real-time as you drag

**4. Caption Positioning** 📍
- Drag caption on video canvas to reposition
- Alignment preset buttons (1-9 grid)
- Numeric X/Y coordinate inputs

**5. Caption Text Editing** ✏️
- Edit caption text inline
- Split/merge captions
- Delete captions

**6. Style Editing** 🎨
- Font family dropdown
- Font size slider (24-120pt)
- Color pickers:
  - Text color (primary)
  - Outline color
  - Shadow/background color
- Alignment buttons (top/middle/bottom, left/center/right)

**7. Save & Apply** 💾
- Save edited ASS file to Supabase Storage
- Update video_assets record with new ASS path
- "Apply Changes" button triggers video regeneration with new ASS

### Nice-to-Have (Future)

**8. Advanced Styling** 🎭
- Per-caption style overrides
- Karaoke effect editing
- Animation effects (fade in/out, bounce)
- Custom preset creation

**9. Bulk Operations** ⚡
- Shift all captions by X seconds
- Apply style to multiple captions
- Find/replace text across all captions

**10. Keyboard Shortcuts** ⌨️
- Space = play/pause
- Arrow keys = frame step / caption navigation
- Enter = edit selected caption
- Delete = remove caption

**11. Undo/Redo** ↩️
- Command history
- Ctrl+Z / Ctrl+Shift+Z

---

## Technical Architecture

### Architecture Options

**Option A: Client-Side ASS Parser + Editor** ⭐ **RECOMMENDED**

```
Flow:
1. Load existing ASS file from storage
2. Parse ASS → JavaScript objects (captions array + styles)
3. Render in React editor component
4. User edits → update JS objects
5. On save → serialize back to ASS format
6. Upload to storage → trigger video regeneration
```

**Pros:**
- Fast, responsive editing
- No server round-trips for each edit
- Can use existing video preview
- Easy to implement undo/redo

**Cons:**
- Need ASS parser library or write custom parser
- More complex frontend

**Option B: Server-Side Editing API**

```
Flow:
1. Load ASS from storage
2. Each edit → API call to update ASS
3. Server returns updated ASS
4. Frontend re-renders
```

**Pros:**
- Simpler frontend
- Reuse backend ASS generator

**Cons:**
- Slow (network latency on every edit)
- Poor UX for real-time editing
- More server load

**Decision: Go with Option A** ✅

### Component Structure

```
<ASSEditor>
  ├─ <VideoPreviewCanvas>          // Video + ASS overlay
  │   ├─ <video> element
  │   └─ <canvas> for ASS rendering (using libass.js or manual)
  │
  ├─ <Timeline>                     // Timeline with caption blocks
  │   ├─ <AudioWaveform>            // Visual audio representation
  │   ├─ <CaptionBlock>[]           // Draggable caption segments
  │   └─ <Playhead>                 // Current time indicator
  │
  ├─ <EditorPanel>                  // Right sidebar
  │   ├─ <CaptionTextEditor>        // Edit selected caption text
  │   ├─ <PositionControls>         // X/Y, alignment presets
  │   ├─ <StyleControls>            // Font, color, size
  │   └─ <TimingInputs>             // Start/end time inputs
  │
  └─ <Toolbar>                      // Top bar
      ├─ Play/Pause, Frame Step
      ├─ Save Changes
      └─ Preset Selector
```

### Data Model

```typescript
interface ASSEditorState {
  // Video
  videoUrl: string
  videoDuration: number
  currentTime: number
  isPlaying: boolean

  // Captions
  captions: ASSCaption[]
  selectedCaptionIndex: number | null

  // Styles
  styles: ASSStyle[]
  currentPreset: string

  // Metadata
  videoWidth: number
  videoHeight: number
  isDirty: boolean // Has unsaved changes
}

interface ASSCaption {
  index: number
  start: number // seconds
  end: number // seconds
  text: string // Raw text with karaoke tags
  styleName: string
  layer: number
  marginL: number
  marginR: number
  marginV: number
  // Optional per-caption overrides
  position?: { x: number; y: number }
  alignment?: number
}
```

### Libraries to Use

**ASS Rendering:**
- Option 1: `libass.js` - WASM port of libass (official ASS renderer)
  - Pros: Perfect rendering, handles all ASS features
  - Cons: Large bundle size (~2MB), WASM complexity
- Option 2: `JavascriptSubtitlesOctopus` - Another libass wrapper
  - Pros: Good documentation, actively maintained
  - Cons: Still large bundle
- Option 3: **Custom Canvas Renderer** ⭐ **RECOMMENDED for MVP**
  - Pros: Small bundle, full control, simpler for basic styles
  - Cons: Won't support all ASS advanced features (we don't use most anyway)

**Timeline/Waveform:**
- `wavesurfer.js` - Audio waveform visualization + timeline
  - Pros: Beautiful, feature-rich, well-maintained
  - Cons: Another dependency
- `react-player` - Video player with custom controls
  - Pros: Already used for video playback
  - Cons: No built-in waveform

**Color Picker:**
- `react-colorful` - Lightweight color picker
  - Pros: Small (2KB), accessible, supports hex/rgb

**Drag and Drop:**
- `react-dnd` - Drag-and-drop toolkit
  - Pros: Flexible, powerful
  - Cons: Complex API
- `@dnd-kit/core` - Modern DnD library
  - Pros: Better performance, simpler API
  - Cons: Newer, less examples
- **Native HTML5 Drag API** ⭐ **RECOMMENDED for MVP**
  - Pros: No dependency, simpler for our use case
  - Cons: Less polished out of the box

---

## Implementation Phases

### Phase 1: Basic Editor Structure (Week 1)

**Goal:** Open editor modal, load ASS, display captions in list

**Tasks:**
1. Create `<ASSEditorModal>` component (opens from VideoModule)
2. Parse existing ASS file → `ASSCaption[]` array
3. Display caption list (text, start/end time)
4. Select caption → highlight in list
5. Basic video player (just playback, no overlay yet)

**Deliverable:** Modal with caption list + video player side-by-side

**Time Estimate:** 2-3 days

---

### Phase 2: Timeline & Playback Sync (Week 1-2)

**Goal:** Visual timeline with playback synchronization

**Tasks:**
1. Build `<Timeline>` component
2. Render caption blocks on timeline (position based on start/end)
3. Sync timeline with video playback
4. Click timeline → seek video
5. Highlight current caption block as video plays
6. Add play/pause controls

**Deliverable:** Working timeline that syncs with video

**Time Estimate:** 2-3 days

---

### Phase 3: Caption Text Editing (Week 2)

**Goal:** Edit caption text and timing

**Tasks:**
1. Build `<EditorPanel>` sidebar
2. Show selected caption's text in textarea
3. Edit text → update caption object
4. Start/end time number inputs
5. Update timeline when timing changes
6. Save changes to state (not persisted yet)

**Deliverable:** Can edit caption text and timing

**Time Estimate:** 1-2 days

---

### Phase 4: ASS Rendering on Video (Week 2-3)

**Goal:** Show captions overlaid on video in real-time

**Tasks:**
1. Choose rendering approach (libass.js vs custom)
2. Build `<ASSRenderer>` component
3. Render current caption on video canvas
4. Update as video plays
5. Apply styles from ASS style definitions
6. Handle karaoke effects (if using custom renderer)

**Deliverable:** Video shows captions with correct styling

**Time Estimate:** 3-4 days (custom renderer) OR 2 days (libass.js)

---

### Phase 5: Position & Alignment Editing (Week 3)

**Goal:** Move captions on video canvas

**Tasks:**
1. Add drag handlers to rendered caption on canvas
2. Update X/Y position as user drags
3. Alignment preset buttons (1-9 grid)
4. Numeric X/Y inputs
5. Update ASS alignment/margin values

**Deliverable:** Can drag captions to reposition them

**Time Estimate:** 2-3 days

---

### Phase 6: Style Editing (Week 4)

**Goal:** Change font, colors, size

**Tasks:**
1. Build `<StyleControls>` panel
2. Font family dropdown (limit to web-safe fonts)
3. Font size slider
4. Color pickers (text, outline, shadow)
5. Update selected caption's style
6. Option: apply to all captions (change preset style)

**Deliverable:** Full style customization

**Time Estimate:** 2-3 days

---

### Phase 7: Save & Regenerate Video (Week 4)

**Goal:** Persist changes and trigger video regeneration

**Tasks:**
1. Serialize edited captions → ASS file format
2. Upload new ASS to Supabase Storage
3. Update `video_assets` record with new ASS path
4. "Apply Changes" button → trigger video composition API
5. Show generation progress (reuse existing job queue)
6. Replace old video with new one

**Deliverable:** End-to-end edited video generation

**Time Estimate:** 2 days

---

### Phase 8: Polish & UX (Week 5)

**Goal:** Make editor production-ready

**Tasks:**
1. Keyboard shortcuts (space, arrows, delete)
2. Undo/redo (if time permits)
3. Unsaved changes warning
4. Loading states
5. Error handling
6. Mobile responsiveness (or disable on mobile)
7. Help tooltips

**Deliverable:** Polished, user-friendly editor

**Time Estimate:** 3-4 days

---

## Critical Questions for User

### 🎯 Scope & Priority

**Q1: Editor Scope for MVP**
- [ ] **Option A:** Full-featured editor (all 8 phases, ~5 weeks)
- [ ] **Option B:** Minimal editor - just timing + position (~3 weeks, skip advanced styling)
- [ ] **Option C:** Start with Phase 1-4, pause for feedback before continuing

**Q2: User Flow**
- [ ] **Option A:** Editor as modal that opens from VideoModule (after ASS generated)
- [ ] **Option B:** Editor as separate page `/app/projects/[id]/edit-captions`
- [ ] **Option C:** Inline editor within VideoModule (no modal/separate page)

**Q3: When can user access editor?**
- [ ] **Option A:** Only after ASS file is generated (after STT + Regenerate Audio)
- [ ] **Option B:** Anytime after audio is uploaded (even before STT - would need to generate default captions)

---

### 🎨 Rendering & Performance

**Q4: ASS Rendering Approach**
- [ ] **Option A:** Use `libass.js` (perfect rendering, large bundle ~2MB, supports all ASS features)
- [ ] **Option B:** Custom Canvas renderer (smaller, faster load, but won't support advanced ASS effects)
- [ ] **Option C:** HTML overlay with CSS (simplest, but least accurate to real ASS rendering)

**My Recommendation:** Option B (custom canvas) for MVP, migrate to libass.js later if needed

**Q5: Waveform Visualization**
- [ ] **Option A:** Add `wavesurfer.js` for beautiful waveform (adds ~100KB)
- [ ] **Option B:** Simple rectangle blocks (no waveform, just colored bars)
- [ ] **Option C:** Skip waveform entirely (just timeline with time markers)

---

### 🛠️ Features & Functionality

**Q6: Caption Timing Editing**
- [ ] **Option A:** Drag block edges on timeline (visual)
- [ ] **Option B:** Numeric inputs only (simpler, less visual)
- [ ] **Option C:** Both (drag for quick adjustments, inputs for precision)

**My Recommendation:** Option C for best UX

**Q7: Style Editing Scope**
- [ ] **Option A:** Edit preset styles (affects all captions using that style)
- [ ] **Option B:** Per-caption style overrides (can customize individual captions)
- [ ] **Option C:** Both (choose between "apply to all" vs "this caption only")

**Q8: Karaoke Effects**
- [ ] **Option A:** Keep existing karaoke, editor doesn't modify word-level timing
- [ ] **Option B:** Allow editing word-level timing (very complex)
- [ ] **Option C:** Option to enable/disable karaoke entirely per caption

**My Recommendation:** Option A for MVP, Option C if time permits

---

### 💾 Data & Persistence

**Q9: Saving Behavior**
- [ ] **Option A:** Auto-save as you edit (like Google Docs)
- [ ] **Option B:** Manual save button (can discard changes)
- [ ] **Option C:** Auto-save + explicit "Apply to Video" button to trigger regeneration

**My Recommendation:** Option C - auto-save to draft, explicit regenerate

**Q10: Version History**
- [ ] **Option A:** Keep multiple ASS versions (v1, v2, v3) in storage
- [ ] **Option B:** Overwrite previous ASS on save (simpler, no history)
- [ ] **Option C:** Single "draft" that overwrites until "Apply" is clicked

**My Recommendation:** Option C for MVP

---

### 🎯 Integration & Workflow

**Q11: Video Regeneration**
- [ ] **Option A:** Auto-regenerate video on save (immediate feedback, but expensive)
- [ ] **Option B:** User clicks "Apply Changes" → video regenerates (explicit action)
- [ ] **Option C:** Show preview in editor, only regenerate when user exports

**My Recommendation:** Option B - explicit regenerate

**Q12: One-off Studio Support**
- [ ] **Option A:** Editor works in one-off studio (localStorage for draft)
- [ ] **Option B:** Editor only for authenticated project workspace
- [ ] **Option C:** Build project workspace first, add to one-off later

**My Recommendation:** Option B for MVP

---

## Risk Assessment

### Technical Risks

**1. ASS Rendering Complexity** 🔴 HIGH
- **Risk:** Custom renderer may not accurately match ffmpeg's libass output
- **Mitigation:** Start with libass.js even if bundle is large, or limit to basic styles
- **Impact:** Users see different preview than final video

**2. Performance with Long Videos** 🟡 MEDIUM
- **Risk:** Rendering 100+ captions on timeline may be slow
- **Mitigation:** Virtualization, lazy loading, optimize re-renders
- **Impact:** Laggy editor, poor UX

**3. Browser Compatibility** 🟡 MEDIUM
- **Risk:** Canvas/video APIs may behave differently across browsers
- **Mitigation:** Test on Chrome, Firefox, Safari; provide fallbacks
- **Impact:** Editor breaks on some browsers

### UX Risks

**4. Learning Curve** 🟡 MEDIUM
- **Risk:** Editor may be too complex for non-technical users
- **Mitigation:** Tooltips, onboarding, sane defaults, simple presets
- **Impact:** Users abandon feature

**5. Mobile Experience** 🟢 LOW
- **Risk:** Editor won't work well on mobile (small screen, no mouse)
- **Mitigation:** Disable on mobile, show "desktop only" message OR build simplified mobile UI later
- **Impact:** Mobile users can't edit captions

### Scope Risks

**6. Feature Creep** 🔴 HIGH
- **Risk:** ASS format supports 50+ features, could spend months building
- **Mitigation:** Strict MVP scope, defer advanced features to Phase 2
- **Impact:** Project drags on, delays other priorities

---

## Recommended Approach

Based on research and current state, I recommend:

**Phase Breakdown:**
1. **Phase 1-4 (Core MVP):** 2 weeks
   - Editor modal, timeline, text editing, basic rendering
   - No advanced styling yet, just position + timing
2. **User Testing & Feedback:** 3-5 days
   - Get real user feedback on MVP
   - Identify pain points
3. **Phase 5-7 (Full Editor):** 2-3 weeks
   - Position editing, style controls, save & regenerate
4. **Phase 8 (Polish):** 1 week
   - Keyboard shortcuts, undo/redo, help

**Total Timeline:** ~6 weeks end-to-end

**Technology Stack:**
- Custom canvas ASS renderer (start simple, migrate to libass.js if needed)
- `wavesurfer.js` for timeline waveform
- `react-colorful` for color pickers
- Native HTML5 drag-and-drop
- No complex state management (useState + useReducer should suffice)

**MVP Features (Phase 1-4):**
- Load ASS, display in timeline
- Edit caption text
- Adjust timing (drag or inputs)
- Move captions on video (drag)
- Alignment presets (1-9)
- Save changes → regenerate video

**Deferred to Phase 2:**
- Advanced style editing
- Karaoke effect editing
- Bulk operations
- Keyboard shortcuts
- Undo/redo

---

## Next Steps

1. **User reviews this plan and answers questions above**
2. **Create execution document** with task breakdown
3. **Start Phase 1 implementation**
4. **Iterate based on feedback**

---

**Document Version:** 1.0
**Last Updated:** 2026-02-13
**Status:** Awaiting User Decisions
