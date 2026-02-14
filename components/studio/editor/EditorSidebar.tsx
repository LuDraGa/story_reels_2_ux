'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ParsedCaption } from '@/lib/captions/ass-parser'
import type { ASSStyle } from '@/lib/captions/ass-presets'
import { bgrToRGB, rgbToBGR } from '@/lib/captions/ass-presets'
import { rebuildASSText } from '@/lib/captions/ass-parser'
import { assTextToPlain } from '@/lib/captions/ass-text'
import { Input } from '@/components/ui/input'
import { CaptionList } from './CaptionList'

interface EditorSidebarProps {
  captions: ParsedCaption[]
  styles: ASSStyle[]
  selectedIndex: number | null
  currentIndex: number | null
  duration: number
  isDirty: boolean
  currentTime: number
  alignment: number
  position: { x: number; y: number } | null
  onSelectCaption: (index: number) => void
  onUpdateCaption: (index: number, updates: Partial<ParsedCaption>) => void
  onUpdateAlignment: (alignment: number) => void
  onUpdatePosition: (position: { x: number; y: number } | null) => void
  onUpdateStyle: (name: string, updates: Partial<ASSStyle>) => void
  isPositionDragEnabled: boolean
  onTogglePositionDrag: () => void
  onAddCaption: () => void
  onDeleteCaption: () => void
  onSplitCaption: () => void
  onMergeCaption: () => void
}

const MIN_CAPTION_GAP = 0.1

function formatTimeInput(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const totalCentiseconds = Math.round(safeSeconds * 100)
  const totalSeconds = Math.floor(totalCentiseconds / 100)
  const centiseconds = totalCentiseconds % 100
  const totalMinutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const base = `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  return hours > 0 ? `${hours}:${base}` : base
}

function parseTimeInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!trimmed.includes(':')) {
    const numeric = Number(trimmed)
    return Number.isFinite(numeric) ? numeric : null
  }

  const parts = trimmed.split(':')
  const normalized = parts.length === 2 ? `0:${trimmed}` : trimmed
  const [hoursPart, minutesPart, secondsPartRaw] = normalized.split(':')
  const secondsPart = secondsPartRaw.includes('.') ? secondsPartRaw : `${secondsPartRaw}.00`

  const hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  const seconds = Number(secondsPart)

  if (![hours, minutes, seconds].every((value) => Number.isFinite(value))) {
    return null
  }

  return hours * 3600 + minutes * 60 + seconds
}

export function EditorSidebar({
  captions,
  styles,
  selectedIndex,
  currentIndex,
  duration,
  isDirty,
  currentTime,
  alignment,
  position,
  onSelectCaption,
  onUpdateCaption,
  onUpdateAlignment,
  onUpdatePosition,
  onUpdateStyle,
  isPositionDragEnabled,
  onTogglePositionDrag,
  onAddCaption,
  onDeleteCaption,
  onSplitCaption,
  onMergeCaption,
}: EditorSidebarProps) {
  const selectedCaption = useMemo(
    () => captions.find((caption) => caption.index === selectedIndex) || null,
    [captions, selectedIndex]
  )

  const [textValue, setTextValue] = useState('')
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [posXInput, setPosXInput] = useState('')
  const [posYInput, setPosYInput] = useState('')

  const selectedStyle = useMemo(() => {
    if (!selectedCaption) return styles[0] || null
    return styles.find((style) => style.Name === selectedCaption.style) || styles[0] || null
  }, [selectedCaption, styles])

  const formatColor = (bgr: string) => {
    const { r, g, b } = bgrToRGB(bgr)
    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const updateColor = (key: keyof ASSStyle, hex: string) => {
    if (!selectedStyle) return
    const { alpha } = bgrToRGB(selectedStyle[key] as string)
    const clean = hex.replace('#', '')
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    if ([r, g, b].some((value) => Number.isNaN(value))) return
    onUpdateStyle(selectedStyle.Name, {
      [key]: rgbToBGR(r, g, b, alpha),
    })
  }

  useEffect(() => {
    if (!selectedCaption) {
      setTextValue('')
      setStartInput('')
      setEndInput('')
      setPosXInput('')
      setPosYInput('')
      return
    }
    setTextValue(assTextToPlain(selectedCaption.text) || selectedCaption.plainText || selectedCaption.text)
    setStartInput(formatTimeInput(selectedCaption.start))
    setEndInput(formatTimeInput(selectedCaption.end))
    setPosXInput(position ? Math.round(position.x).toString() : '')
    setPosYInput(position ? Math.round(position.y).toString() : '')
  }, [selectedCaption])
  useEffect(() => {
    setPosXInput(position ? Math.round(position.x).toString() : '')
    setPosYInput(position ? Math.round(position.y).toString() : '')
  }, [position])

  const applyStart = (value: string) => {
    if (!selectedCaption) return
    const parsed = parseTimeInput(value)
    if (parsed === null) {
      setStartInput(formatTimeInput(selectedCaption.start))
      return
    }
    let nextStart = Math.max(0, parsed)
    let nextEnd = selectedCaption.end

    if (nextStart >= nextEnd - MIN_CAPTION_GAP) {
      nextEnd = nextStart + MIN_CAPTION_GAP
    }

    if (duration > 0) {
      const maxEnd = duration
      nextStart = Math.min(nextStart, maxEnd - MIN_CAPTION_GAP)
      nextEnd = Math.min(nextEnd, maxEnd)
      if (nextEnd <= nextStart) {
        nextEnd = Math.min(maxEnd, nextStart + MIN_CAPTION_GAP)
      }
    }

    onUpdateCaption(selectedCaption.index, { start: nextStart, end: nextEnd })
    setStartInput(formatTimeInput(nextStart))
    setEndInput(formatTimeInput(nextEnd))
  }

  const applyEnd = (value: string) => {
    if (!selectedCaption) return
    const parsed = parseTimeInput(value)
    if (parsed === null) {
      setEndInput(formatTimeInput(selectedCaption.end))
      return
    }

    let nextEnd = parsed
    let nextStart = selectedCaption.start
    if (nextEnd <= nextStart + MIN_CAPTION_GAP) {
      nextEnd = nextStart + MIN_CAPTION_GAP
    }

    if (duration > 0) {
      const maxEnd = duration
      nextEnd = Math.min(nextEnd, maxEnd)
      if (nextEnd <= nextStart) {
        nextStart = Math.max(0, nextEnd - MIN_CAPTION_GAP)
      }
    }

    onUpdateCaption(selectedCaption.index, { start: nextStart, end: nextEnd })
    setStartInput(formatTimeInput(nextStart))
    setEndInput(formatTimeInput(nextEnd))
  }

  return (
    <aside className="h-full w-[420px] overflow-y-auto border-l border-secondary-800 bg-secondary-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-secondary-100">Captions</h3>
          <p className="text-xs text-secondary-400">{captions.length} lines</p>
        </div>
        {isDirty && (
          <span className="rounded-full bg-accent-lavender/20 px-2 py-1 text-[11px] font-medium text-accent-lavender">
            Unsaved
          </span>
        )}
      </div>

      <CaptionList
        captions={captions}
        selectedIndex={selectedIndex}
        currentIndex={currentIndex}
        onSelect={onSelectCaption}
      />

      <div className="mt-4 border-t border-secondary-800 pt-4">
        {!selectedCaption ? (
          <div className="rounded-xl border border-secondary-800 bg-secondary-900/40 p-4 text-sm text-secondary-400">
            Select a caption to edit its text and timing.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-secondary-400">
                Caption #{selectedCaption.index + 1}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-secondary-400">Start</label>
                  <Input
                    value={startInput}
                    onChange={(event) => setStartInput(event.target.value)}
                    onBlur={(event) => applyStart(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        applyStart(event.currentTarget.value)
                        event.currentTarget.blur()
                      }
                    }}
                    className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                    placeholder="00:00.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-secondary-400">End</label>
                  <Input
                    value={endInput}
                    onChange={(event) => setEndInput(event.target.value)}
                    onBlur={(event) => applyEnd(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        applyEnd(event.currentTarget.value)
                        event.currentTarget.blur()
                      }
                    }}
                    className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                    placeholder="00:00.00"
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-secondary-500">
                Format: MM:SS.CS or seconds (e.g., 12.5)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-secondary-400">Operations</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onAddCaption}
                  title="Insert a new caption after the current one"
                  className="rounded-lg border border-secondary-800 bg-secondary-900/60 px-3 py-2 text-xs text-secondary-200 hover:bg-secondary-800"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={onDeleteCaption}
                  title="Delete the selected caption"
                  className="rounded-lg border border-secondary-800 bg-secondary-900/60 px-3 py-2 text-xs text-secondary-200 hover:bg-secondary-800"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onSplitCaption}
                  title="Split the caption at the playhead"
                  className="rounded-lg border border-secondary-800 bg-secondary-900/60 px-3 py-2 text-xs text-secondary-200 hover:bg-secondary-800"
                >
                  Split @ {formatTimeInput(currentTime)}
                </button>
                <button
                  type="button"
                  onClick={onMergeCaption}
                  title="Merge this caption with the next one"
                  className="rounded-lg border border-secondary-800 bg-secondary-900/60 px-3 py-2 text-xs text-secondary-200 hover:bg-secondary-800"
                >
                  Merge Next
                </button>
              </div>
              <p className="text-[11px] text-secondary-500">
                Split uses the current playhead time.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-secondary-400">Position</label>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-secondary-500">
                  Drag on video to reposition.
                </span>
                <button
                  type="button"
                  onClick={onTogglePositionDrag}
                  title="Toggle drag-to-reposition on the video"
                  className={`rounded-full px-3 py-1 text-[11px] ${
                    isPositionDragEnabled
                      ? 'bg-accent-sage/20 text-accent-sage'
                      : 'bg-secondary-900/60 text-secondary-400 hover:bg-secondary-800'
                  }`}
                >
                  {isPositionDragEnabled ? 'Drag: On' : 'Drag: Off'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onUpdateAlignment(value)}
                    title={`Set alignment ${value}`}
                    className={`h-7 rounded-md border text-[10px] ${
                      alignment === value
                        ? 'border-accent-sage bg-accent-sage/20 text-secondary-100'
                        : 'border-secondary-800 bg-secondary-900/60 text-secondary-400 hover:bg-secondary-800'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-secondary-400">X</label>
                  <Input
                    value={posXInput}
                    onChange={(event) => setPosXInput(event.target.value)}
                    onBlur={() => {
                      const x = Number(posXInput)
                      const y = Number(posYInput)
                      if (Number.isFinite(x) && Number.isFinite(y)) {
                        onUpdatePosition({ x, y })
                      } else if (!posXInput && !posYInput) {
                        onUpdatePosition(null)
                      }
                    }}
                    className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                    placeholder="px"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-secondary-400">Y</label>
                  <Input
                    value={posYInput}
                    onChange={(event) => setPosYInput(event.target.value)}
                    onBlur={() => {
                      const x = Number(posXInput)
                      const y = Number(posYInput)
                      if (Number.isFinite(x) && Number.isFinite(y)) {
                        onUpdatePosition({ x, y })
                      } else if (!posXInput && !posYInput) {
                        onUpdatePosition(null)
                      }
                    }}
                    className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                    placeholder="px"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-secondary-500">
                <span>Uses ASS `\\pos(x,y)` when set.</span>
                <button
                  type="button"
                  onClick={() => {
                    setPosXInput('')
                    setPosYInput('')
                    onUpdatePosition(null)
                  }}
                  className="rounded px-2 py-1 text-secondary-300 hover:bg-secondary-800"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] text-secondary-400">Style</label>
              {!selectedStyle ? (
                <div className="rounded-xl border border-secondary-800 bg-secondary-900/40 p-3 text-xs text-secondary-400">
                  No style available.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-secondary-400">Font</label>
                    <Input
                      value={selectedStyle.Fontname}
                      onChange={(event) =>
                        onUpdateStyle(selectedStyle.Name, { Fontname: event.target.value })
                      }
                      className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary-400">Size</label>
                      <Input
                        type="number"
                        value={selectedStyle.Fontsize}
                        onChange={(event) =>
                          onUpdateStyle(selectedStyle.Name, { Fontsize: Number(event.target.value) || 0 })
                        }
                        className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary-400">Outline</label>
                      <Input
                        type="number"
                        value={selectedStyle.Outline}
                        onChange={(event) =>
                          onUpdateStyle(selectedStyle.Name, { Outline: Number(event.target.value) || 0 })
                        }
                        className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary-400">Shadow</label>
                      <Input
                        type="number"
                        value={selectedStyle.Shadow}
                        onChange={(event) =>
                          onUpdateStyle(selectedStyle.Name, { Shadow: Number(event.target.value) || 0 })
                        }
                        className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary-400">Spacing</label>
                      <Input
                        type="number"
                        value={selectedStyle.Spacing}
                        onChange={(event) =>
                          onUpdateStyle(selectedStyle.Name, { Spacing: Number(event.target.value) || 0 })
                        }
                        className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary-400">Primary</label>
                      <input
                        type="color"
                        value={formatColor(selectedStyle.PrimaryColour)}
                        onChange={(event) => updateColor('PrimaryColour', event.target.value)}
                        className="h-9 w-full rounded-lg border border-secondary-800 bg-secondary-900/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary-400">Highlight</label>
                      <input
                        type="color"
                        value={formatColor(selectedStyle.SecondaryColour)}
                        onChange={(event) => updateColor('SecondaryColour', event.target.value)}
                        className="h-9 w-full rounded-lg border border-secondary-800 bg-secondary-900/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary-400">Outline</label>
                      <input
                        type="color"
                        value={formatColor(selectedStyle.OutlineColour)}
                        onChange={(event) => updateColor('OutlineColour', event.target.value)}
                        className="h-9 w-full rounded-lg border border-secondary-800 bg-secondary-900/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary-400">Shadow</label>
                      <input
                        type="color"
                        value={formatColor(selectedStyle.BackColour)}
                        onChange={(event) => updateColor('BackColour', event.target.value)}
                        className="h-9 w-full rounded-lg border border-secondary-800 bg-secondary-900/60"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-secondary-400">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStyle(selectedStyle.Name, { Bold: selectedStyle.Bold ? 0 : -1 })
                      }
                      className={`rounded-md border px-2 py-1 ${
                        selectedStyle.Bold ? 'border-accent-sage text-accent-sage' : 'border-secondary-800'
                      }`}
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStyle(selectedStyle.Name, { Italic: selectedStyle.Italic ? 0 : -1 })
                      }
                      className={`rounded-md border px-2 py-1 ${
                        selectedStyle.Italic ? 'border-accent-sage text-accent-sage' : 'border-secondary-800'
                      }`}
                    >
                      Italic
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStyle(selectedStyle.Name, {
                          Underline: selectedStyle.Underline ? 0 : -1,
                        })
                      }
                      className={`rounded-md border px-2 py-1 ${
                        selectedStyle.Underline ? 'border-accent-sage text-accent-sage' : 'border-secondary-800'
                      }`}
                    >
                      Underline
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-secondary-400">Caption text</label>
              <textarea
                value={textValue}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setTextValue(nextValue)
                  const nextText = rebuildASSText(nextValue, selectedCaption.text)
                  onUpdateCaption(selectedCaption.index, {
                    plainText: nextValue,
                    text: nextText,
                  })
                }}
                rows={4}
                className="w-full resize-none rounded-lg border border-secondary-800 bg-secondary-900/60 px-3 py-2 text-sm text-secondary-100 focus:outline-none focus:ring-2 focus:ring-accent-sage/40"
                placeholder="Type caption text..."
              />
              <div className="flex items-center justify-between text-[11px] text-secondary-500">
                <span>{textValue.length} chars</span>
                {textValue.length > 100 && <span>Consider shortening this line.</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
