'use client'

import type { ParsedCaption } from '@/lib/captions/ass-parser'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@/lib/utils'

interface CaptionBlockProps {
  caption: ParsedCaption
  pixelsPerSecond: number
  isSelected: boolean
  isActive: boolean
  onClick: () => void
  onDragStart: (
    event: ReactPointerEvent<HTMLElement>,
    mode: 'move' | 'start' | 'end'
  ) => void
}

export function CaptionBlock({
  caption,
  pixelsPerSecond,
  isSelected,
  isActive,
  onClick,
  onDragStart,
}: CaptionBlockProps) {
  const left = caption.start * pixelsPerSecond
  const width = Math.max((caption.end - caption.start) * pixelsPerSecond, 18)

  return (
    <button
      type="button"
      onClick={onClick}
      title={caption.plainText || caption.text}
      className={cn(
        'absolute top-2 h-8 rounded-lg border px-2 text-[11px] text-secondary-100 transition',
        'overflow-hidden whitespace-nowrap text-ellipsis',
        isSelected
          ? 'border-accent-sage bg-accent-sage/20'
          : 'border-secondary-700 bg-secondary-800/60',
        isActive && !isSelected ? 'border-accent-lavender/70' : ''
      )}
      style={{ left, width }}
      onPointerDown={(event) => onDragStart(event, 'move')}
    >
      <span
        className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
        onPointerDown={(event) => onDragStart(event, 'start')}
      />
      <span
        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
        onPointerDown={(event) => onDragStart(event, 'end')}
      />
      {caption.plainText || caption.text}
    </button>
  )
}
