'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { ParsedCaption } from '@/lib/captions/ass-parser'
import { cn } from '@/lib/utils'
import { CaptionBlock } from './CaptionBlock'

interface TimelineProps {
  duration: number
  currentTime: number
  captions: ParsedCaption[]
  selectedIndex: number | null
  currentIndex: number | null
  onSeek: (time: number) => void
  onSelectCaption: (index: number) => void
  onUpdateCaption: (index: number, updates: Partial<ParsedCaption>) => void
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

function formatMarker(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const totalSeconds = Math.floor(safeSeconds)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const base = `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`
  return hours > 0 ? `${hours}:${base}` : base
}

function getMarkerStep(duration: number): number {
  if (duration <= 30) return 5
  if (duration <= 120) return 10
  if (duration <= 300) return 30
  return 60
}

export function Timeline({
  duration,
  currentTime,
  captions,
  selectedIndex,
  currentIndex,
  onSeek,
  onSelectCaption,
  onUpdateCaption,
}: TimelineProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef<{
    index: number
    mode: 'move' | 'start' | 'end'
    originX: number
    originStart: number
    originEnd: number
  } | null>(null)

  const captionsDuration = useMemo(() => {
    if (captions.length === 0) return 0
    return captions.reduce((maxEnd, caption) => Math.max(maxEnd, caption.end), 0)
  }, [captions])

  const effectiveDuration = Math.max(duration, captionsDuration)

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const updateSize = () => {
      setViewportWidth(node.clientWidth)
    }

    updateSize()

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize)
      observer.observe(node)
    } else {
      window.addEventListener('resize', updateSize)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      } else {
        window.removeEventListener('resize', updateSize)
      }
    }
  }, [])

  const trackWidth = Math.max(viewportWidth, viewportWidth * zoom)
  const pixelsPerSecond = effectiveDuration > 0 ? trackWidth / effectiveDuration : 0
  const markerStep = getMarkerStep(effectiveDuration)

  const markers = useMemo(() => {
    if (!effectiveDuration || markerStep <= 0) return []
    const count = Math.floor(effectiveDuration / markerStep)
    return Array.from({ length: count + 1 }, (_, index) => index * markerStep)
  }, [effectiveDuration, markerStep])

  const seekFromClientX = (clientX: number) => {
    if (!trackRef.current || effectiveDuration <= 0 || trackWidth <= 0) return
    const rect = trackRef.current.getBoundingClientRect()
    const position = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    const time = (position / rect.width) * effectiveDuration
    onSeek(time)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (effectiveDuration <= 0) return
    if (isDragging) return
    setIsScrubbing(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    seekFromClientX(event.clientX)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return
    seekFromClientX(event.clientX)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return
    setIsScrubbing(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const playheadLeft = Math.min(currentTime * pixelsPerSecond, trackWidth)

  const roundToCentisecond = (value: number) => Math.round(value * 100) / 100

  const handleCaptionDragStart = (
    event: ReactPointerEvent<HTMLElement>,
    index: number,
    mode: 'move' | 'start' | 'end'
  ) => {
    event.preventDefault()
    event.stopPropagation()
    if (pixelsPerSecond <= 0) return
    const caption = captions.find((item) => item.index === index)
    if (!caption) return
    dragStateRef.current = {
      index,
      mode,
      originX: event.clientX,
      originStart: caption.start,
      originEnd: caption.end,
    }
    setIsDragging(true)
    onSelectCaption(index)
  }

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current
      if (!dragState || pixelsPerSecond <= 0) return
      const deltaSeconds = (event.clientX - dragState.originX) / pixelsPerSecond
      let nextStart = dragState.originStart
      let nextEnd = dragState.originEnd

      if (dragState.mode === 'move') {
        nextStart = dragState.originStart + deltaSeconds
        nextEnd = dragState.originEnd + deltaSeconds
        if (nextStart < 0) {
          nextEnd -= nextStart
          nextStart = 0
        }
        if (effectiveDuration > 0 && nextEnd > effectiveDuration) {
          const overflow = nextEnd - effectiveDuration
          nextStart -= overflow
          nextEnd = effectiveDuration
        }
      } else if (dragState.mode === 'start') {
        nextStart = dragState.originStart + deltaSeconds
        if (effectiveDuration > 0) {
          nextStart = Math.min(nextStart, effectiveDuration - 0.1)
        }
        nextStart = Math.max(0, Math.min(nextStart, nextEnd - 0.1))
      } else {
        nextEnd = dragState.originEnd + deltaSeconds
        if (effectiveDuration > 0) {
          nextEnd = Math.min(nextEnd, effectiveDuration)
        }
        nextEnd = Math.max(nextEnd, nextStart + 0.1)
      }

      onUpdateCaption(dragState.index, {
        start: roundToCentisecond(nextStart),
        end: roundToCentisecond(nextEnd),
      })
    }

    const handlePointerUp = () => {
      dragStateRef.current = null
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, pixelsPerSecond, effectiveDuration, onUpdateCaption])

  useEffect(() => {
    if (isScrubbing) return
    const viewport = viewportRef.current
    if (!viewport) return
    const padding = 40
    const visibleStart = viewport.scrollLeft
    const visibleEnd = visibleStart + viewport.clientWidth
    if (playheadLeft < visibleStart + padding || playheadLeft > visibleEnd - padding) {
      const nextScrollLeft = Math.max(playheadLeft - viewport.clientWidth * 0.5, 0)
      viewport.scrollTo({ left: nextScrollLeft, behavior: 'smooth' })
    }
  }, [playheadLeft, isScrubbing])

  const handleZoom = (nextZoom: number) => {
    const clamped = Math.min(6, Math.max(1, nextZoom))
    setZoom(clamped)
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <span>{formatTimestamp(currentTime)}</span>
        <div className="flex items-center gap-3">
          <span>{effectiveDuration ? formatTimestamp(effectiveDuration) : '--:--'}</span>
          <div className="flex items-center gap-1 rounded-full border border-secondary-800 bg-secondary-900/60 px-2 py-1 text-[11px] text-secondary-300">
            <button
              type="button"
              onClick={() => handleZoom(zoom - 0.5)}
              className="rounded px-1 text-secondary-200 hover:bg-secondary-800"
            >
              -
            </button>
            <span className="min-w-[42px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => handleZoom(zoom + 0.5)}
              className="rounded px-1 text-secondary-200 hover:bg-secondary-800"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => handleZoom(1)}
              className="rounded px-1 text-secondary-200 hover:bg-secondary-800"
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-secondary-800 bg-secondary-900/60">
        <div ref={viewportRef} className="h-full overflow-x-auto">
          <div
            ref={trackRef}
            className={cn(
              'relative h-full px-3 py-4',
              isScrubbing ? 'cursor-grabbing' : 'cursor-pointer'
            )}
            style={{ width: trackWidth }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div className="absolute inset-x-0 top-2 flex items-center">
              {markers.map((marker) => {
                const left = marker * pixelsPerSecond
                return (
                  <div
                    key={marker}
                    className="absolute top-0 text-[10px] text-secondary-500"
                    style={{ left }}
                  >
                    {formatMarker(marker)}
                  </div>
                )
              })}
            </div>

            <div className="absolute inset-x-0 top-8 h-[1px] bg-secondary-800" />

            <div className="relative mt-6 h-12">
              {captions.map((caption) => (
                <CaptionBlock
                  key={caption.index}
                  caption={caption}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedIndex === caption.index}
                  isActive={currentIndex === caption.index}
                  onClick={() => onSelectCaption(caption.index)}
                  onDragStart={(event, mode) =>
                    handleCaptionDragStart(event, caption.index, mode)
                  }
                />
              ))}
            </div>

            <div
              className="absolute top-0 h-full w-[2px] bg-accent-sage"
              style={{ left: playheadLeft }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
