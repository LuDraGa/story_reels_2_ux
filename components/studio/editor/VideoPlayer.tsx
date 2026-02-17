'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParsedCaption } from '@/lib/captions/ass-parser'
import type { ASSStyle } from '@/lib/captions/ass-presets'
import { bgrToRGB } from '@/lib/captions/ass-presets'
import { getCaptionAtTime } from '@/lib/captions/ass-parser'

interface VideoPlayerProps {
  videoUrl?: string | null
  audioUrl?: string | null
  musicUrl?: string | null
  musicVolume?: number
  onMusicVolumeChange?: (volume: number) => void
  currentTime: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onPlayPause: (playing: boolean) => void
  onLoadedMetadata: (duration: number) => void
  captions?: ParsedCaption[]
  styles?: ASSStyle[]
  scriptInfo?: Record<string, string>
  enablePositionDrag?: boolean
  onPositionChange?: (position: { x: number; y: number }) => void
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

export function VideoPlayer({
  videoUrl,
  audioUrl,
  musicUrl,
  musicVolume,
  onMusicVolumeChange,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
  onLoadedMetadata,
  captions,
  styles,
  scriptInfo,
  enablePositionDrag,
  onPositionChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasSizeRef = useRef({ width: 0, height: 0 })
  const [localMusicVolume, setLocalMusicVolume] = useState(0.2)

  useEffect(() => {
    if (typeof musicVolume === 'number' && Number.isFinite(musicVolume)) {
      setLocalMusicVolume(musicVolume)
    }
  }, [musicVolume])

  const effectiveMusicVolume =
    typeof musicVolume === 'number' && Number.isFinite(musicVolume)
      ? musicVolume
      : localMusicVolume
  const isDraggingRef = useRef(false)

  const activeCaption = useMemo(() => {
    if (!captions || captions.length === 0) return null
    return getCaptionAtTime(captions, currentTime)
  }, [captions, currentTime])

  const activeStyle = useMemo(() => {
    if (!activeCaption || !styles || styles.length === 0) return null
    return styles.find((style) => style.Name === activeCaption.style) || styles[0]
  }, [activeCaption, styles])

  type TextSegment = {
    text: string
    overrides: Partial<ASSStyle>
    karaokeDuration?: number
  }

  const parseASSText = (rawText: string) => {
    const text = rawText.replace(/\\N/gi, '\n').replace(/\\h/gi, ' ')
    const segments: TextSegment[] = []
    let currentOverrides: Partial<ASSStyle> = {}
    let pendingKaraoke: number | undefined
    let alignmentOverride: number | undefined
    let positionOverride: { x: number; y: number } | undefined
    let buffer = ''

    const flushBuffer = () => {
      if (!buffer) return
      segments.push({
        text: buffer,
        overrides: { ...currentOverrides },
        karaokeDuration: pendingKaraoke,
      })
      buffer = ''
      pendingKaraoke = undefined
    }

    let index = 0
    while (index < text.length) {
      const char = text[index]
      if (char === '{') {
        const end = text.indexOf('}', index)
        if (end === -1) {
          buffer += text.slice(index)
          break
        }
        flushBuffer()
        const tagContent = text.slice(index + 1, end)

        if (/\\r/i.test(tagContent)) {
          currentOverrides = {}
        }
        const alignmentMatch = tagContent.match(/\\an(\d+)/i)
        if (alignmentMatch) {
          alignmentOverride = Number(alignmentMatch[1])
        }
        const positionMatch = tagContent.match(/\\pos\(([-\d.]+),\s*([-\d.]+)\)/i)
        if (positionMatch) {
          const x = Number(positionMatch[1])
          const y = Number(positionMatch[2])
          if (Number.isFinite(x) && Number.isFinite(y)) {
            positionOverride = { x, y }
          }
        }
        const karaokeMatch = tagContent.match(/\\k(\d+)/i)
        if (karaokeMatch) {
          pendingKaraoke = Number(karaokeMatch[1])
        }
        const fontMatch = tagContent.match(/\\fs(\d+)/i)
        if (fontMatch) {
          currentOverrides = {
            ...currentOverrides,
            Fontsize: Number(fontMatch[1]),
          }
        }
        const colorMatch = tagContent.match(/\\c&H([0-9A-Fa-f]+)&/)
        if (colorMatch) {
          currentOverrides = {
            ...currentOverrides,
            PrimaryColour: `&H${colorMatch[1].toUpperCase()}&`,
          }
        }
        index = end + 1
        continue
      }
        buffer += char
        index += 1
    }

    flushBuffer()
    return {
      segments: segments.filter((segment) => segment.text.length > 0),
      alignmentOverride,
      positionOverride,
    }
  }

  const splitSegmentsIntoLines = (segments: TextSegment[]): TextSegment[][] => {
    const lines: TextSegment[][] = [[]]
    segments.forEach((segment) => {
      const parts = segment.text.split('\n')
      parts.forEach((part, partIndex) => {
        if (part.length > 0) {
          lines[lines.length - 1].push({
            ...segment,
            text: part,
            karaokeDuration: partIndex === 0 ? segment.karaokeDuration : undefined,
          })
        }
        if (partIndex < parts.length - 1) {
          lines.push([])
        }
      })
    })
    return lines.map((line) => {
      const spaced: TextSegment[] = []
      line.forEach((segment, index) => {
        const prev = spaced[spaced.length - 1]
        if (prev) {
          const prevEndsWithSpace = /\s$/.test(prev.text)
          const nextStartsWithSpace = /^\s/.test(segment.text)
          if (!prevEndsWithSpace && !nextStartsWithSpace) {
            spaced.push({ text: ' ', overrides: {}, karaokeDuration: undefined })
          }
        }
        spaced.push(segment)
      })
      return spaced
    })
  }

  const parsedText = useMemo(() => {
    if (!activeCaption) {
      return {
        lines: [] as TextSegment[][],
        alignmentOverride: undefined as number | undefined,
        positionOverride: undefined as { x: number; y: number } | undefined,
      }
    }
    const parsed = parseASSText(activeCaption.text)
    const lines = splitSegmentsIntoLines(parsed.segments)
    return {
      lines,
      alignmentOverride: parsed.alignmentOverride,
      positionOverride: parsed.positionOverride,
    }
  }, [activeCaption])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      const playPromise = video.play()
      if (playPromise) {
        playPromise.catch(() => {
          onPlayPause(false)
        })
      }
    } else {
      video.pause()
    }
  }, [isPlaying, onPlayPause])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (isPlaying) {
      const playPromise = audio.play()
      if (playPromise) {
        playPromise.catch(() => {
          onPlayPause(false)
        })
      }
    } else {
      audio.pause()
    }
  }, [audioUrl, isPlaying, onPlayPause])

  useEffect(() => {
    const music = musicRef.current
    if (!music || !musicUrl) return
    if (isPlaying) {
      const playPromise = music.play()
      if (playPromise) {
        playPromise.catch(() => {
          onPlayPause(false)
        })
      }
    } else {
      music.pause()
    }
  }, [musicUrl, isPlaying, onPlayPause])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !Number.isFinite(currentTime)) return
    if (Math.abs(video.currentTime - currentTime) > 0.2) {
      video.currentTime = currentTime
    }
  }, [currentTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(currentTime)) return
    if (Math.abs(audio.currentTime - currentTime) > 0.2) {
      audio.currentTime = currentTime
    }
  }, [currentTime])

  useEffect(() => {
    const music = musicRef.current
    if (!music || !Number.isFinite(currentTime)) return
    if (Math.abs(music.currentTime - currentTime) > 0.2) {
      music.currentTime = currentTime
    }
  }, [currentTime])

  useEffect(() => {
    const music = musicRef.current
    if (!music) return
    music.volume = Math.max(0, Math.min(1, effectiveMusicVolume))
  }, [effectiveMusicVolume])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const updateSize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      canvasSizeRef.current = { width, height }
    }

    updateSize()

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize)
      observer.observe(container)
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvasSizeRef.current
    ctx.clearRect(0, 0, width, height)

    if (!activeCaption || !activeStyle || width === 0 || height === 0) return

    const scriptWidth = Number(scriptInfo?.PlayResX) || width
    const scriptHeight = Number(scriptInfo?.PlayResY) || height
    const scaleX = width / scriptWidth
    const scaleY = height / scriptHeight

    const colorToRgba = (bgr: string) => {
      const { r, g, b, alpha } = bgrToRGB(bgr)
      const opacity = 1 - (Number.isFinite(alpha) ? alpha : 0) / 255
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    const setFont = (style: ASSStyle) => {
      const fontSize = style.Fontsize * scaleY
      const fontWeight = style.Bold ? 'bold' : 'normal'
      const fontStyle = style.Italic ? 'italic' : 'normal'
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${style.Fontname || 'sans-serif'}`
    }

    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    ctx.lineJoin = 'round'

    const marginL = (activeCaption.marginL || activeStyle.MarginL || 0) * scaleX
    const marginR = (activeCaption.marginR || activeStyle.MarginR || 0) * scaleX
    const marginV = (activeCaption.marginV || activeStyle.MarginV || 0) * scaleY

    const lines = parsedText.lines
    if (lines.length === 0) return

    const lineMetrics = lines.map((line) => {
      let lineWidth = 0
      let lineHeight = 0
      line.forEach((segment) => {
        const mergedStyle: ASSStyle = {
          ...activeStyle,
          ...segment.overrides,
        }
        setFont(mergedStyle)
        const renderText = segment.text.replace(/ /g, '\u00A0')
        const metrics = ctx.measureText(renderText)
        lineWidth += metrics.width
        lineHeight = Math.max(lineHeight, mergedStyle.Fontsize * scaleY * 1.2)
      })
      if (lineHeight === 0) {
        lineHeight = activeStyle.Fontsize * scaleY * 1.2
      }
      return { width: lineWidth, height: lineHeight }
    })

    const blockWidth = Math.max(...lineMetrics.map((metric) => metric.width))
    const blockHeight = lineMetrics.reduce((sum, metric) => sum + metric.height, 0)

    const alignment = Number(parsedText.alignmentOverride ?? activeStyle.Alignment ?? 2)
    const isTop = alignment >= 7
    const isMiddle = alignment >= 4 && alignment <= 6
    const isBottom = alignment <= 3
    const isLeft = alignment === 1 || alignment === 4 || alignment === 7
    const isCenter = alignment === 2 || alignment === 5 || alignment === 8
    const isRight = alignment === 3 || alignment === 6 || alignment === 9

    let blockX = marginL
    let blockY = marginV

    if (parsedText.positionOverride) {
      const anchorX = parsedText.positionOverride.x * scaleX
      const anchorY = parsedText.positionOverride.y * scaleY
      if (isCenter) {
        blockX = anchorX - blockWidth / 2
      } else if (isRight) {
        blockX = anchorX - blockWidth
      } else {
        blockX = anchorX
      }

      if (isMiddle) {
        blockY = anchorY - blockHeight / 2
      } else if (isBottom) {
        blockY = anchorY - blockHeight
      } else {
        blockY = anchorY
      }
    } else {
      if (isCenter) {
        blockX = (width - blockWidth) / 2
      } else if (isRight) {
        blockX = width - marginR - blockWidth
      }

      if (isMiddle) {
        blockY = (height - blockHeight) / 2
      } else if (isBottom) {
        blockY = height - marginV - blockHeight
      }
    }

    const elapsedCs = Math.max(0, Math.round((currentTime - activeCaption.start) * 100))
    let karaokeCursor = 0

    lines.forEach((line, lineIndex) => {
      const metric = lineMetrics[lineIndex]
      let lineX = blockX
      if (isCenter) {
        lineX = blockX + (blockWidth - metric.width) / 2
      } else if (isRight) {
        lineX = blockX + (blockWidth - metric.width)
      }

      let cursorX = lineX
      const lineY = blockY + lineMetrics.slice(0, lineIndex).reduce((sum, m) => sum + m.height, 0)

      line.forEach((segment) => {
        const mergedStyle: ASSStyle = {
          ...activeStyle,
          ...segment.overrides,
        }
        const outlineWidth = (mergedStyle.Outline || 0) * scaleX
        const shadowDepth = (mergedStyle.Shadow || 0) * scaleX

        setFont(mergedStyle)
        const renderText = segment.text.replace(/ /g, '\u00A0')
        const segmentWidth = ctx.measureText(renderText).width

        const isHighlighted =
          typeof segment.karaokeDuration === 'number' &&
          elapsedCs >= karaokeCursor + segment.karaokeDuration

        const primaryColor = segment.overrides.PrimaryColour || mergedStyle.PrimaryColour
        const fillColor = isHighlighted ? mergedStyle.SecondaryColour : primaryColor

        ctx.shadowColor = colorToRgba(mergedStyle.BackColour)
        ctx.shadowOffsetX = shadowDepth
        ctx.shadowOffsetY = shadowDepth
        ctx.shadowBlur = 0

        if (outlineWidth > 0) {
          ctx.lineWidth = outlineWidth
          ctx.strokeStyle = colorToRgba(mergedStyle.OutlineColour)
          ctx.strokeText(renderText, cursorX, lineY)
        }

        ctx.fillStyle = colorToRgba(fillColor)
        ctx.fillText(renderText, cursorX, lineY)

        if (typeof segment.karaokeDuration === 'number') {
          karaokeCursor += segment.karaokeDuration
        }
        cursorX += segmentWidth
      })
    })

    ctx.shadowColor = 'transparent'
  }, [activeCaption, activeStyle, scriptInfo, currentTime, parsedText])

  useEffect(() => {
    if (!enablePositionDrag || !onPositionChange) return
    const canvas = canvasRef.current
    if (!canvas) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!activeCaption || !activeStyle) return
      isDraggingRef.current = true
      canvas.setPointerCapture(event.pointerId)
      event.preventDefault()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scriptWidth = Number(scriptInfo?.PlayResX) || rect.width
      const scriptHeight = Number(scriptInfo?.PlayResY) || rect.height
      const x = ((event.clientX - rect.left) / rect.width) * scriptWidth
      const y = ((event.clientY - rect.top) / rect.height) * scriptHeight
      onPositionChange({
        x: Math.max(0, Math.min(x, scriptWidth)),
        y: Math.max(0, Math.min(y, scriptHeight)),
      })
    }

    const handlePointerUp = (event: PointerEvent) => {
      isDraggingRef.current = false
      try {
        canvas.releasePointerCapture(event.pointerId)
      } catch {
        // ignore release errors
      }
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)
    }
  }, [activeCaption, activeStyle, enablePositionDrag, onPositionChange, scriptInfo])

  if (!videoUrl) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-secondary-800 bg-secondary-900/40 text-sm text-secondary-400">
        No preview video available yet.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-secondary-800 bg-black"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          className="aspect-video w-full"
          onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => onLoadedMetadata(event.currentTarget.duration)}
          onEnded={() => onPlayPause(false)}
          onClick={() => onPlayPause(!isPlaying)}
        />
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
        {musicUrl && <audio ref={musicRef} src={musicUrl} preload="metadata" />}
        <canvas
          ref={canvasRef}
          className={
            enablePositionDrag
              ? 'absolute inset-0 cursor-crosshair'
              : 'pointer-events-none absolute inset-0'
          }
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary-800 bg-secondary-900/40 px-3 py-2 text-xs text-secondary-300">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPlayPause(!isPlaying)}
            className="h-8 rounded-lg border-secondary-700 bg-secondary-900 text-secondary-100 hover:bg-secondary-800"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="font-mono">{formatTimestamp(currentTime)}</span>
          <span className="text-secondary-500">/</span>
          <span className="font-mono text-secondary-400">
            {formatTimestamp(videoRef.current?.duration || 0)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {musicUrl && (
            <>
              <span className="text-secondary-500">BGM</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effectiveMusicVolume}
                onChange={(event) => {
                  const nextValue = Number(event.target.value)
                  setLocalMusicVolume(nextValue)
                  if (onMusicVolumeChange) {
                    onMusicVolumeChange(nextValue)
                  }
                }}
                className="h-1 w-24 accent-accent-sage"
              />
            </>
          )}
          <span className="text-secondary-500">Click video to toggle play</span>
        </div>
      </div>
    </div>
  )
}
