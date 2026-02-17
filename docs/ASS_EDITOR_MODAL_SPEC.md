# ASS Caption Editor Modal - Ideal Spec

**Goal**: A reliable, end-to-end editor for ASS captions that supports text, timing, styling, positioning, and preview, then saves a new ASS file for final video compose.

---

## 1) Inputs and Data Sources

**Required**
- `assUrl`: Signed URL for the current ASS file.
- `assPath`: Storage path for ASS (used for refresh + saving).
- `audioUrl`: TTS audio URL for preview timing and playback.

**Optional**
- `musicUrl`: Background music for preview.
- `videoPreviewUrl`: Selected background video (for overlay preview only).

**Storage**
- Authenticated: `projects/{userId}/{projectId}/captions/{timestamp}.ass`
- One-off: `projects/oneoff/{sessionId}/captions/{timestamp}.ass`

---

## 2) Core UX Flow (Happy Path)

1) TTS generates audio and STT produces `.json`, `.srt`, `.ass`.
2) User picks background video(s) and optional BGM.
3) User opens **Edit Captions**:
   - ASS is fetched from `assUrl`.
   - If expired, the editor refreshes the signed URL using `assPath`.
4) Editor displays:
   - Video preview (selected background video only).
   - Overlay captions rendered from ASS.
   - Sidebar list + edit controls + timeline.
5) User edits:
   - Text, timing, positioning, styles, or ASS tags.
6) Preview updates live on the overlay.
7) User clicks **Save Draft**:
   - Editor serializes ASS.
   - Saves to local draft + uploads to storage (same `assPath`).
8) User closes editor, then clicks **Compose Video**:
   - Compose uses latest ASS from storage (signed at request time).

---

## 3) Video + Audio Preview Behavior

**Video**
- Preview uses only the selected background video.
- Composed video is never used inside editor preview.
- Video audio is muted.

**Audio**
- TTS audio always plays.
- BGM plays if selected.
- BGM has a volume slider (0–100%) inside the editor.
- Audio tracks are time-synced to the video playhead.

**Playhead**
- Play/pause toggles video + audio in sync.
- Seeking updates video + audio to the same time.

---

## 4) Caption Rendering (Overlay)

**Required overlay support**
- Karaoke timing (`\\k` centiseconds) for word highlighting.
- Alignment (`\\an1–\\an9`).
- Position (`\\pos(x,y)`).
- Inline style overrides:
  - `\\fs` (font size)
  - `\\c` (primary color)
  - `\\r` (reset to style)
- Line breaks `\\N` and hard spaces `\\h`.

**Rendering rules**
- Use ASS style defaults as the baseline.
- Apply inline overrides in order.
- Preserve karaoke timing and focus word styling when text changes.

---

## 5) Caption List + Editor Sidebar

**Caption list**
- Shows captions with correct spacing (human-readable).
- Auto-scroll only when selection changes (not on playback).

**Editor controls**
- Text editor (plain text view).
- Start/End time inputs with validation.
- Operations: Add, Delete, Split at playhead, Merge Next.
- Positioning:
  - Alignment grid (1–9)
  - X/Y input fields
  - Drag-to-position on canvas
- Style editor:
  - Font, size, outline, shadow, spacing
  - Primary/Secondary/Outline/Shadow colors
  - Bold/Italic/Underline toggles

**Text rebuild behavior**
- If text does not change, preserve original tags.
- If text changes, preserve `\\k` karaoke structure and `\\r` resets where possible.
- Newlines entered by user become `\\N` in ASS.

---

## 6) Timeline

**Requirements**
- Caption blocks with draggable edges to adjust timing.
- Selection syncs with the caption list and editor fields.
- Playhead syncs with video/audio.

---

## 7) Saving

**Save Draft**
- Serialize updated ASS.
- Save to local draft for immediate re-open.
- Upload to storage at `assPath` (upsert).
- Refresh `assUrl` after upload.

**Final Compose**
- Compose uses latest `assPath`, re-signed server-side.

---

## 8) Signed URL Refresh

**When**
- Any `assUrl` request fails with 400/401/403.

**How**
- Use `assPath` to request a new signed URL.
- Retry fetch with new signed URL.

---

## 9) ASS Feature Support (Ideal Coverage)

**Core (must)**
- `\\k`, `\\K`, `\\kf`, `\\ko` karaoke variants
- `\\fs`, `\\c`, `\\alpha`, `\\bord`, `\\shad`
- `\\pos`, `\\an`, `\\move`
- `\\N`, `\\n`, `\\h`

**Advanced (should)**
- `\\clip`, `\\iclip`
- `\\fade`, `\\fad`
- `\\frx`, `\\fry`, `\\frz`, `\\fscx`, `\\fscy`
- `\\t()` animation transforms
- Style-level margins and overrides (`\\margl`, `\\margr`, `\\margv`)

**Unsupported (until implemented)**
- Vector drawing `\\p` mode
- Complex transforms or filters not needed for social captions

---

## 10) Error Handling

**User-visible**
- Failed ASS fetch → show error + retry.
- Save Draft failure → toast with error + keep local draft.
- Invalid ASS parse → show error + original content.

**Developer**
- Log storage path, URL refresh events, parse failures.

---

## 11) Keyboard Shortcuts (Optional)

- Space: play/pause
- Left/Right: 0.1s step (Shift = 1s)
- Up/Down: prev/next caption
- Delete: delete selected caption
- Esc: close (with unsaved prompt)

---

## 12) Expected Outcome

The editor is a single source of truth for ASS edits.  
If a user can preview correct overlay + audio sync in the editor and click **Save Draft**, the next **Compose Video** will use those exact captions.
