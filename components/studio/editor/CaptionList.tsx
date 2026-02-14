'use client'

import { useEffect, useRef } from 'react'
import type { ParsedCaption } from '@/lib/captions/ass-parser'
import { cn } from '@/lib/utils'
import { assTextToPlain } from '@/lib/captions/ass-text'

interface CaptionListProps {
  captions: ParsedCaption[]
  selectedIndex: number | null
  currentIndex: number | null
  onSelect: (index: number) => void
}

function formatTimestamp(seconds: number): string {
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

export function CaptionList({
  captions,
  selectedIndex,
  currentIndex,
  onSelect,
}: CaptionListProps) {
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (selectedIndex === null || !listRef.current) return
    const target = listRef.current.querySelector<HTMLButtonElement>(
      `[data-caption-index="${selectedIndex}"]`
    )
    target?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (captions.length === 0) {
    return (
      <div className="rounded-xl border border-secondary-800 bg-secondary-900/40 p-4 text-sm text-secondary-400">
        No captions found in this ASS file.
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="space-y-2"
    >
      {captions.map((caption) => {
        const isSelected = selectedIndex === caption.index
        const isCurrent = currentIndex === caption.index

        return (
          <button
            key={caption.index}
            type="button"
            data-caption-index={caption.index}
            onClick={() => onSelect(caption.index)}
            className={cn(
              'w-full text-left rounded-xl border px-3 py-2 transition',
              'hover:bg-secondary-800/40',
              isSelected
                ? 'border-accent-sage/60 bg-accent-sage/10'
                : 'border-secondary-800 bg-secondary-900/40',
              isCurrent && !isSelected ? 'border-accent-lavender/50' : ''
            )}
          >
            <div className="flex items-center justify-between text-xs text-secondary-400">
              <span className="font-mono">#{caption.index + 1}</span>
              <span className="font-mono">
                {formatTimestamp(caption.start)} → {formatTimestamp(caption.end)}
              </span>
            </div>
            <div className="mt-1 text-sm text-secondary-100 truncate">
              {assTextToPlain(caption.text) || caption.plainText || caption.text}
            </div>
          </button>
        )
      })}
    </div>
  )
}
