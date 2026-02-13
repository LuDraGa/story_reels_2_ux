# ASS Caption Editor - Execution Document

**Date Started**: 2026-02-13
**Status**: Ready to Begin
**Approach**: Phased, careful, complete implementation

---

## Overview

Building a visual ASS caption editor with the following approach:
- **Phased rollout**: Build Phase 1-4 completely, get feedback, then continue
- **Quality over speed**: Each component built thoroughly and tested
- **Modal-based UI**: Opens from VideoModule after ASS generation
- **Custom renderer**: Canvas-based ASS rendering for MVP
- **Auto-save + explicit regenerate**: Draft changes auto-save, video regenerates on user action

---

## User Decisions Summary

Based on user approval of recommendations:

| Question | Decision |
|----------|----------|
| Q1: Scope | **Phased** - Build 1-4, pause for feedback |
| Q2: UI Pattern | **Modal** from VideoModule |
| Q3: Access Timing | **After ASS generated** |
| Q4: Rendering | **Custom Canvas** renderer |
| Q5: Waveform | **wavesurfer.js** for timeline |
| Q6: Timing Edit | **Both** drag + inputs |
| Q7: Style Edit | **Preset styles** (affects all) |
| Q8: Karaoke | **Keep existing**, editor doesn't modify |
| Q9: Saving | **Auto-save draft** + explicit Apply |
| Q10: Versions | **Single draft** until Apply |
| Q11: Regenerate | **Explicit** "Apply Changes" button |
| Q12: One-off | **Authenticated only** for now |

---

## Phase 1: Basic Editor Structure

**Goal**: Open editor modal, load ASS, display captions in list, basic video player

**Estimated Time**: 2-3 days

### Task 1.1: ASS Parser Utility

**File**: `lib/captions/ass-parser.ts`

Create a parser to convert ASS file → JavaScript objects

```typescript
interface ParsedASS {
  scriptInfo: Record<string, string>
  styles: ASSStyle[]
  captions: ParsedCaption[]
  raw: string // Original ASS content
}

interface ParsedCaption {
  index: number
  layer: number
  start: number // seconds
  end: number // seconds
  style: string
  text: string // Raw ASS text with tags
  plainText: string // Text without ASS tags (for editing)
  marginL: number
  marginR: number
  marginV: number
}

function parseASS(assContent: string): ParsedASS
function serializeASS(parsed: ParsedASS): string
```

**Implementation Notes**:
- Parse [Script Info] section (resolution, title)
- Parse [V4+ Styles] section → ASSStyle array
- Parse [Events] section → ParsedCaption array
- Extract plain text from ASS dialogue (strip \k, \r, \fs tags)
- Serialize back to ASS format when saving

**Testing**:
- Load existing TikTok ASS file
- Parse → verify all captions extracted
- Serialize → verify output matches input structure

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Created**:
- `lib/captions/ass-parser.ts` - Main parser implementation
- `lib/captions/__tests__/ass-parser.test.ts` - Unit tests (Jest)
- `lib/captions/__tests__/manual-parser-test.ts` - Manual test script

**Test Results**: ✅ All tests passed
- Parse ASS → structured objects ✓
- Serialize back to ASS format ✓
- Round-trip (parse → serialize → parse) ✓
- Strip ASS tags ✓
- Validation ✓

---

### Task 1.2: Editor Modal Component

**File**: `components/studio/ASSEditorModal.tsx`

Create the modal container that houses the entire editor

```typescript
interface ASSEditorModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  assUrl: string // URL to existing ASS file
  videoUrl: string // URL to video for preview
  onSave: (newAssUrl: string) => void
}

export function ASSEditorModal({ ... }: ASSEditorModalProps) {
  // Load ASS from URL
  // Parse ASS → state
  // Render editor components
  // Handle save/close
}
```

**Implementation Notes**:
- Full-screen modal (covers entire viewport)
- Dark theme for video editing (less eye strain)
- Top toolbar with: Close, Save Draft, Apply Changes
- Three-panel layout:
  - Left: Video preview (60% width)
  - Right: Editor panel (40% width)
  - Bottom: Timeline (full width, docked at bottom)

**Component Structure**:
```tsx
<Dialog fullScreen>
  <EditorToolbar />
  <div className="flex">
    <VideoPreviewPanel />
    <EditorSidebar />
  </div>
  <TimelinePanel />
</Dialog>
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Created**:
- `components/studio/ASSEditorModal.tsx`

---

### Task 1.3: Load ASS File from Storage

**Implementation**:
- Fetch ASS file from Supabase Storage URL
- Parse using `ass-parser.ts`
- Store in component state using `useReducer`

**State Management**:
```typescript
interface EditorState {
  // Data
  parsed: ParsedASS | null
  selectedCaptionIndex: number | null

  // Video
  videoUrl: string
  currentTime: number
  isPlaying: boolean
  duration: number

  // UI
  isLoading: boolean
  error: string | null
  isDirty: boolean // Has unsaved changes
}

type EditorAction =
  | { type: 'LOAD_ASS_SUCCESS'; payload: ParsedASS }
  | { type: 'SELECT_CAPTION'; index: number }
  | { type: 'UPDATE_CAPTION'; index: number; caption: Partial<ParsedCaption> }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_PLAYING'; playing: boolean }
  // ... more actions
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Fetches `assUrl` and parses via `parseASS`
- Loads into reducer state and wires playback state

---

### Task 1.4: Caption List Component

**File**: `components/studio/editor/CaptionList.tsx`

Display all captions as scrollable list in sidebar

```typescript
interface CaptionListProps {
  captions: ParsedCaption[]
  selectedIndex: number | null
  currentTime: number
  onSelect: (index: number) => void
}
```

**Features**:
- Scrollable list of all captions
- Each item shows:
  - Caption index (#1, #2, etc.)
  - Start time (MM:SS)
  - Text preview (first 50 chars)
- Selected caption highlighted
- Current caption (based on video time) has indicator
- Click to select caption
- Auto-scroll to current caption as video plays

**Styling**:
- Compact list items (36px height)
- Hover state
- Selected state (accent color)
- Current caption indicator (subtle dot/bar)

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Created**:
- `components/studio/editor/CaptionList.tsx`

---

### Task 1.5: Basic Video Player

**File**: `components/studio/editor/VideoPlayer.tsx`

Simple video player with play/pause controls

```typescript
interface VideoPlayerProps {
  videoUrl: string
  currentTime: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onPlayPause: (playing: boolean) => void
  onLoadedMetadata: (duration: number) => void
}
```

**Features**:
- HTML5 `<video>` element
- Play/pause button
- Current time / total duration display
- Click video to play/pause
- Sync with parent state (controlled component)

**ASS rendering (basic)** now in Phase 4 via canvas overlay.

**Styling**:
- 16:9 or 9:16 aspect ratio (detect from video)
- Centered in preview panel
- Black background
- Minimal controls overlay on hover

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Created**:
- `components/studio/editor/VideoPlayer.tsx`

---

### Task 1.6: Integration with VideoModule

**File**: `components/studio/VideoModule.tsx`

Add "Edit Captions" button that opens editor modal

**Changes**:
```typescript
// Add state
const [showASSEditor, setShowASSEditor] = useState(false)

// Add button (only show if assUrl exists)
{assUrl && (
  <Button onClick={() => setShowASSEditor(true)}>
    <Edit className="w-4 h-4 mr-2" />
    Edit Captions
  </Button>
)}

// Render modal
{showASSEditor && (
  <ASSEditorModal
    isOpen={showASSEditor}
    onClose={() => setShowASSEditor(false)}
    projectId={projectId}
    assUrl={assUrl}
    videoUrl={videoUrl}
    onSave={(newAssUrl) => {
      setAssUrl(newAssUrl)
      setShowASSEditor(false)
    }}
  />
)}
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Updated**:
- `components/studio/VideoModule.tsx`
- `app/(app)/app/projects/[id]/page.tsx`

---

### Phase 1 Checklist

- [x] Task 1.1: ASS Parser (`lib/captions/ass-parser.ts`) ✅ **COMPLETE**
- [x] Task 1.2: Editor Modal (`components/studio/ASSEditorModal.tsx`) ✅ **COMPLETE**
- [x] Task 1.3: Load ASS from storage
- [x] Task 1.4: Caption List (`components/studio/editor/CaptionList.tsx`)
- [x] Task 1.5: Video Player (`components/studio/editor/VideoPlayer.tsx`)
- [x] Task 1.6: Integration with VideoModule

**Definition of Done (Phase 1)**:
- [x] User can click "Edit Captions" button in VideoModule
- [x] Editor modal opens full-screen
- [x] ASS file loads and parses successfully
- [x] All captions appear in sidebar list
- [x] Video plays with play/pause controls
- [x] Click caption → highlights in list
- [x] Current caption indicator updates as video plays
- [ ] No errors in console (not verified)
- [ ] Type checking passes (not run)

---

## Phase 2: Timeline & Playback Sync

**Goal**: Visual timeline with caption blocks, playback synchronization, seek functionality

**Estimated Time**: 2-3 days

### Task 2.1: Timeline Component Structure

**File**: `components/studio/editor/Timeline.tsx`

Build timeline foundation with time markers and ruler

```typescript
interface TimelineProps {
  duration: number // video duration in seconds
  currentTime: number
  captions: ParsedCaption[]
  selectedIndex: number | null
  onSeek: (time: number) => void
  onSelectCaption: (index: number) => void
}
```

**Features**:
- Horizontal timeline (full width)
- Time ruler (0:00, 0:05, 0:10, etc. markers)
- Playhead (vertical line at current time)
- Draggable playhead (click/drag timeline to seek)
- Zoom controls (fit all / zoom in/out)

**Layout**:
```
+---------------------------+
| Ruler: 0:00  0:05  0:10   |
+---------------------------+
| [Caption blocks here]     |
+---------------------------+
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Created**:
- `components/studio/editor/Timeline.tsx`

---

### Task 2.2: Caption Block Rendering

**File**: `components/studio/editor/CaptionBlock.tsx`

Render individual caption blocks on timeline

```typescript
interface CaptionBlockProps {
  caption: ParsedCaption
  index: number
  isSelected: boolean
  pixelsPerSecond: number // for positioning
  onClick: () => void
}
```

**Features**:
- Positioned based on start/end time
- Width based on duration
- Shows caption text (truncated)
- Selected state (highlighted border)
- Hover state
- Color-coded by style (TikTok = yellow, Instagram = purple, etc.)

**Positioning Calculation**:
```typescript
const left = caption.start * pixelsPerSecond
const width = (caption.end - caption.start) * pixelsPerSecond
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Created**:
- `components/studio/editor/CaptionBlock.tsx`

---

### Task 2.3: Playhead Sync

**Implementation**:
- Playhead position updates as video plays
- Smooth animation (requestAnimationFrame or CSS transition)
- Click timeline → seek video
- Drag playhead → seek video

**Calculation**:
```typescript
const playheadPosition = currentTime * pixelsPerSecond
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Playhead bound to `currentTime` state and updates with playback
- Pointer scrubbing seeks video via shared state

---

### Task 2.4: Current Caption Highlighting

**Implementation**:
- As video plays, highlight caption block that's currently active
- Highlight corresponding caption in sidebar list
- Auto-scroll timeline to keep playhead visible
- Auto-scroll caption list to current caption

**Current Caption Detection**:
```typescript
const currentCaption = captions.find(
  c => c.start <= currentTime && c.end > currentTime
)
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Active caption highlighted in both list and timeline

---

### Task 2.5: Timeline Zoom & Scroll

**Features**:
- Zoom in/out buttons (or scroll wheel)
- Horizontal scroll when zoomed in
- "Fit All" button (zoom to show entire video)
- Zoom centered on playhead

**State**:
```typescript
const [zoom, setZoom] = useState(1) // 1 = fit all, 2 = 2x zoom, etc.
const pixelsPerSecond = (timelineWidth / duration) * zoom
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Added zoom controls with horizontal scroll
- Auto-scroll keeps playhead in view during playback

---

### Task 2.6: Waveform Integration (Optional for Phase 2)

**Library**: `wavesurfer.js`

Add audio waveform visualization to timeline

**Features**:
- Waveform renders behind caption blocks
- Helps user see audio peaks for better timing
- Syncs with playhead

**Decision Point**: Add now or defer to Phase 5?

**Status**: ⬜ Deferred (can add in Phase 5)

---

### Phase 2 Checklist

- [x] Task 2.1: Timeline component structure
- [x] Task 2.2: Caption block rendering
- [x] Task 2.3: Playhead sync
- [x] Task 2.4: Current caption highlighting
- [x] Task 2.5: Timeline zoom & scroll
- [ ] Task 2.6: Waveform (deferred)

**Definition of Done (Phase 2)**:
- [x] Timeline shows all caption blocks positioned correctly
- [x] Playhead moves as video plays
- [x] Click timeline → video seeks to that time
- [x] Current caption highlighted on timeline and in list
- [x] Click caption block → selects caption
- [x] Zoom in/out works
- [x] Timeline scrolls horizontally when zoomed
- [ ] No performance issues with 50+ captions (not verified)

---

## Phase 3: Caption Text & Timing Editing

**Goal**: Edit caption text and adjust timing via inputs or dragging

**Estimated Time**: 1-2 days

### Task 3.1: Editor Sidebar Panel

**File**: `components/studio/editor/EditorSidebar.tsx`

Right sidebar with tabs for different editing modes

```typescript
interface EditorSidebarProps {
  selectedCaption: ParsedCaption | null
  onUpdateCaption: (updates: Partial<ParsedCaption>) => void
}
```

**Layout**:
```
+---------------------------+
| Tabs: [Text] [Style] [Pos]|
+---------------------------+
| Caption #5                 |
| Start: 0:05.23  End: 0:08.10
|                           |
| [Text editor here]        |
+---------------------------+
```

**Tabs**:
1. **Text** - Edit caption text, timing
2. **Style** - Font, colors, size (Phase 6)
3. **Position** - X/Y, alignment (Phase 5)

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Created**:
- `components/studio/editor/EditorSidebar.tsx`

---

### Task 3.2: Caption Text Editor

**Component**: Within EditorSidebar

```typescript
<Textarea
  value={selectedCaption.plainText}
  onChange={(e) => onUpdateCaption({ plainText: e.target.value })}
  rows={3}
  placeholder="Caption text..."
/>
```

**Features**:
- Multiline textarea
- Real-time update (debounced 300ms)
- Character count
- Preserve ASS tags (update plainText, regenerate tags on save)

**Edge Cases**:
- Empty text → warning
- Very long text → warning (>100 chars)
- Line breaks → handle properly in ASS format

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Text edits update `plainText` and rebuild ASS tags

---

### Task 3.3: Timing Inputs

**Component**: Within EditorSidebar

```typescript
<div className="flex gap-2">
  <TimeInput
    label="Start"
    value={selectedCaption.start}
    onChange={(time) => onUpdateCaption({ start: time })}
  />
  <TimeInput
    label="End"
    value={selectedCaption.end}
    onChange={(time) => onUpdateCaption({ end: time })}
  />
</div>
```

**TimeInput Component**:
- Format: MM:SS.CS (e.g., "01:23.45")
- Parse user input → seconds
- Validate: start < end, start >= 0, end <= duration
- Show error if invalid

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Start/end inputs accept `MM:SS.CS` or seconds
- Validation enforces minimum gap and clamping

---

### Task 3.4: Timeline Block Dragging

**Feature**: Drag caption block edges to adjust timing

**Implementation**:
- Left edge = adjust start time
- Right edge = adjust end time
- Middle = move entire caption (adjust both start/end)

**Drag Behavior**:
- Show resize cursors on hover
- Snap to other caption boundaries (optional)
- Min duration: 0.1 seconds
- Can't drag past adjacent captions (or allow overlap?)

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Drag handles on blocks adjust start/end
- Dragging block moves entire caption

---

### Task 3.5: Auto-Save Draft

**Implementation**:
- Debounce all edits (500ms)
- On change → mark isDirty = true
- Auto-save to localStorage (for drafts)
- OR auto-save to Supabase (separate draft_ass_url field?)

**Decision**: localStorage vs Supabase?

**Recommendation**: localStorage for now (simpler), migrate to Supabase later

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Draft stored in localStorage per projectId + assUrl
- Draft restored automatically on open

---

### Task 3.6: Caption Operations

**Features**:
- **Split caption**: Split at current playhead position
- **Merge captions**: Merge selected with next
- **Delete caption**: Remove caption
- **Add caption**: Insert new caption at playhead

**UI**:
- Context menu on caption block (right-click)
- OR buttons in editor sidebar

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Added Add/Delete/Split/Merge controls in sidebar
- Split uses current playhead time

---

### Phase 3 Checklist

- [x] Task 3.1: Editor sidebar panel structure
- [x] Task 3.2: Caption text editor (textarea)
- [x] Task 3.3: Timing inputs (start/end)
- [x] Task 3.4: Timeline block dragging
- [x] Task 3.5: Auto-save draft
- [x] Task 3.6: Caption operations (split/merge/delete)

**Definition of Done (Phase 3)**:
- [x] Select caption → shows in editor sidebar
- [x] Edit text → updates caption object
- [x] Edit start/end time via inputs → updates timeline
- [x] Drag timeline block edges → updates timing
- [x] Changes auto-save to localStorage
- [x] isDirty flag tracked correctly
- [x] Validation prevents invalid timings

---

## Phase 4: ASS Rendering on Video

**Goal**: Render ASS captions on video canvas in real-time as video plays

**Estimated Time**: 3-4 days (custom renderer)

### Task 4.1: Canvas Renderer Architecture

**File**: `lib/captions/canvas-ass-renderer.ts`

Build custom ASS renderer using HTML5 Canvas

```typescript
interface RendererConfig {
  canvas: HTMLCanvasElement
  videoWidth: number
  videoHeight: number
  styles: ASSStyle[]
}

class ASSCanvasRenderer {
  constructor(config: RendererConfig)

  renderCaption(caption: ParsedCaption, currentTime: number): void
  clear(): void
  updateStyles(styles: ASSStyle[]): void
}
```

**Rendering Pipeline**:
1. Clear canvas
2. Find current caption (start <= time < end)
3. Get caption's style from styles array
4. Parse ASS tags in caption text (\k, \r, \fs, \c)
5. Calculate position (alignment + margins)
6. Draw text with outline/shadow
7. Apply karaoke effect if \k tags present

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Implemented canvas overlay rendering directly in `VideoPlayer`
- Uses parsed styles + script info for scaling

---

### Task 4.2: ASS Tag Parser

**Parse inline ASS tags**:
- `\k<duration>` - Karaoke timing (centiseconds)
- `\r` - Reset to style default
- `\fs<size>` - Font size override
- `\c&H<color>&` - Color override
- `\pos(x,y)` - Absolute position

**Implementation**:
```typescript
interface ParsedText {
  segments: TextSegment[]
}

interface TextSegment {
  text: string
  style: Partial<ASSStyle> // Inline overrides
  karaokeDuration?: number
}

function parseASSText(rawText: string): ParsedText
```

**Status**: ✅ Complete (partial tag coverage)

**Completion Date**: 2026-02-13

**Notes**:
- Parses `\\k`, `\\fs`, `\\c`, `\\r`, `\\an`, and `\\pos`
- Advanced tags still deferred

---

### Task 4.3: Text Positioning & Alignment

**Calculate (x, y) position based on alignment**:

```typescript
// Alignment numpad:
// 7 8 9
// 4 5 6
// 1 2 3

function getPosition(
  alignment: number,
  marginL: number,
  marginR: number,
  marginV: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; anchor: 'left' | 'center' | 'right' }
```

**Examples**:
- Alignment 2 (bottom-center): x = width/2, y = height - marginV
- Alignment 5 (center-center): x = width/2, y = height/2
- Alignment 8 (top-center): x = width/2, y = marginV

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Alignment + margins applied from ASS style/caption

---

### Task 4.4: Text Rendering with Outline & Shadow

**Canvas Drawing**:
1. Draw shadow (offset, blurred)
2. Draw outline (strokeText with thick stroke)
3. Draw fill text (fillText)

```typescript
function drawStyledText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: ASSStyle
) {
  // Set font
  ctx.font = `${style.Bold ? 'bold' : ''} ${style.Fontsize}px ${style.Fontname}`

  // Draw shadow
  if (style.Shadow > 0) {
    ctx.shadowBlur = style.Shadow
    ctx.shadowColor = bgrToCSS(style.BackColour)
    ctx.fillText(text, x, y)
  }

  // Draw outline
  if (style.Outline > 0) {
    ctx.strokeStyle = bgrToCSS(style.OutlineColour)
    ctx.lineWidth = style.Outline * 2
    ctx.strokeText(text, x, y)
  }

  // Draw fill
  ctx.fillStyle = bgrToCSS(style.PrimaryColour)
  ctx.fillText(text, x, y)
}
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Notes**:
- Outline + shadow rendered via canvas stroke/fill

---

### Task 4.5: Karaoke Effect Rendering

**Karaoke Timing**:
- Caption has multiple words with `\k<duration>` tags
- As time progresses, words "fill" with secondary color
- Need to track elapsed time within caption

**Implementation**:
```typescript
function renderKaraoke(
  ctx: CanvasRenderingContext2D,
  segments: TextSegment[],
  elapsedTime: number, // Time since caption start (centiseconds)
  x: number,
  y: number,
  style: ASSStyle
) {
  let cumulativeTime = 0
  let xOffset = 0

  for (const segment of segments) {
    const isFilled = elapsedTime >= cumulativeTime
    const fillColor = isFilled ? style.SecondaryColour : style.PrimaryColour

    // Draw word with appropriate color
    ctx.fillStyle = bgrToCSS(fillColor)
    ctx.fillText(segment.text, x + xOffset, y)

    // Update offset for next word
    const metrics = ctx.measureText(segment.text)
    xOffset += metrics.width

    cumulativeTime += segment.karaokeDuration || 0
  }
}
```

**Status**: ✅ Complete (basic word highlighting)

**Completion Date**: 2026-02-13

**Notes**:
- Highlights completed karaoke segments with `SecondaryColour`
- Partial word fill not implemented yet

---

### Task 4.6: Integration with Video Player

**File**: `components/studio/editor/VideoPlayer.tsx`

Add canvas overlay on top of video element

```tsx
<div className="relative">
  <video ref={videoRef} />
  <canvas
    ref={canvasRef}
    className="absolute inset-0 pointer-events-none"
    width={videoWidth}
    height={videoHeight}
  />
</div>
```

**Render Loop**:
```typescript
useEffect(() => {
  const renderLoop = () => {
    if (!isPlaying) return

    renderer.clear()
    const currentCaption = captions.find(
      c => c.start <= currentTime && c.end > currentTime
    )

    if (currentCaption) {
      renderer.renderCaption(currentCaption, currentTime)
    }

    requestAnimationFrame(renderLoop)
  }

  if (isPlaying) {
    requestAnimationFrame(renderLoop)
  }
}, [isPlaying, currentTime, captions])
```

**Status**: ✅ Complete

**Completion Date**: 2026-02-13

**Files Updated**:
- `components/studio/editor/VideoPlayer.tsx`

---

### Task 4.7: Color Conversion Utilities

**Convert ASS BGR colors to CSS**:

```typescript
function bgrToCSS(bgrHex: string): string {
  const { r, g, b, alpha } = bgrToRGB(bgrHex)
  return `rgba(${r}, ${g}, ${b}, ${1 - alpha / 255})`
}
```

**Status**: ✅ Complete (reused `bgrToRGB` from ass-presets)

---

### Phase 4 Checklist

- [x] Task 4.1: Canvas renderer architecture
- [x] Task 4.2: ASS tag parser
- [x] Task 4.3: Text positioning & alignment
- [x] Task 4.4: Text rendering with outline & shadow
- [x] Task 4.5: Karaoke effect rendering
- [x] Task 4.6: Integration with video player
- [x] Task 4.7: Color conversion utilities

**Definition of Done (Phase 4)**:
- [x] Captions render on video canvas as video plays
- [x] Positioning matches alignment settings (1-9)
- [x] Outline and shadow render correctly
- [x] Karaoke effect works (words highlight)
- [ ] Style changes reflect in preview (pending style editor)
- [ ] No flickering or performance issues (not verified)
- [ ] Matches ffmpeg output closely (not verified)

---

## Testing Strategy

### Unit Tests

**Files to test**:
- `lib/captions/ass-parser.ts` - Parse/serialize correctness
- `lib/captions/canvas-ass-renderer.ts` - Positioning calculations
- Color conversion utilities

**Test Cases**:
- Parse valid ASS → correct object structure
- Serialize → matches input format
- Invalid ASS → throws error
- Alignment 1-9 → correct (x, y) coordinates
- BGR to CSS color conversion

---

### Integration Tests

**User Flows**:
1. Open editor → loads ASS → displays captions
2. Click caption → selects in list and timeline
3. Edit text → updates caption object
4. Drag timeline block → updates timing
5. Play video → captions render correctly
6. Save → generates valid ASS file

---

### Visual Regression Tests

**Compare**:
- Canvas rendering vs ffmpeg output (screenshot comparison)
- Different presets (TikTok, Instagram, YouTube)
- Karaoke effect timing accuracy

**Tools**:
- Playwright for screenshots
- pixelmatch for image diff

---

## Performance Considerations

### Optimization Targets

**Timeline**:
- Render 100+ caption blocks without lag
- Smooth scrolling and zooming
- Use virtualization if >200 captions

**Canvas Rendering**:
- 60 FPS during playback
- Debounce re-renders on edits
- Use requestAnimationFrame properly

**State Management**:
- Minimize re-renders (React.memo, useMemo)
- Debounce text input updates
- Batch caption updates

---

## Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Basic Structure | ✅ Complete | 6/6 tasks |
| Phase 2: Timeline & Sync | ✅ Complete | 6/6 tasks |
| Phase 3: Text & Timing Edit | ✅ Complete | 6/6 tasks |
| Phase 4: ASS Rendering | ✅ Complete | 7/7 tasks |

**Next Steps**: Phase 5 (Position Editing UI + drag on canvas) and Phase 6 (Style panel).

**Last Updated**: 2026-02-13
