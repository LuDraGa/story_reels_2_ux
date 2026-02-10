'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2 } from 'lucide-react'

interface CaptionPreviewProps {
  srtUrl: string
  metadata?: {
    wordCount?: number
    duration?: number
    captionCount?: number
  } | null
}

interface ParsedCaption {
  index: number
  timestamp: string
  text: string
}

export function CaptionPreview({ srtUrl, metadata }: CaptionPreviewProps) {
  const [captions, setCaptions] = useState<ParsedCaption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCaptions()
  }, [srtUrl])

  const loadCaptions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch SRT file
      const response = await fetch(srtUrl)
      if (!response.ok) {
        throw new Error('Failed to load captions')
      }

      const srtContent = await response.text()

      // Parse SRT (simple parser - get first 5 captions)
      const parsed = parseSRT(srtContent).slice(0, 5)
      setCaptions(parsed)
    } catch (err) {
      console.error('Failed to load captions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load captions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    // Open SRT URL in new tab (browser will download)
    const link = document.createElement('a')
    link.href = srtUrl
    link.download = 'captions.srt'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <Card className="bg-primary-300 border-primary-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-3 text-secondary-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading captions...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-primary-300 border-red-300 rounded-2xl p-4">
        <div className="text-sm text-red-600">
          ⚠️ {error}
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-primary-300 border-primary-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-sage/10 to-accent-lavender/10 px-4 py-3 border-b border-primary-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-sage" />
            <h4 className="font-display text-sm font-semibold text-secondary-700">
              Captions Generated
            </h4>
          </div>
          <Button
            onClick={handleDownload}
            size="sm"
            variant="outline"
            className="rounded-xl border-accent-sage text-accent-sage hover:bg-accent-sage/10"
          >
            <Download className="w-3 h-3 mr-1" />
            Download SRT
          </Button>
        </div>

        {/* Metadata */}
        {metadata && (
          <div className="flex gap-4 mt-2 text-xs text-secondary-500">
            {metadata.captionCount && (
              <span>{metadata.captionCount} captions</span>
            )}
            {metadata.wordCount && (
              <span>{metadata.wordCount} words</span>
            )}
            {metadata.duration && (
              <span>{formatDuration(metadata.duration)}</span>
            )}
          </div>
        )}
      </div>

      {/* Caption Preview */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-secondary-500 mb-2">
          Preview (first 5 captions):
        </p>

        {captions.length === 0 ? (
          <p className="text-sm text-secondary-500 italic">
            No captions available
          </p>
        ) : (
          <div className="space-y-3">
            {captions.map((caption, idx) => (
              <div
                key={idx}
                className="bg-primary-200 rounded-xl p-3 border border-primary-500/10"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-mono text-xs text-secondary-400">
                    {caption.timestamp}
                  </span>
                  <span className="font-mono text-xs text-secondary-400">
                    #{caption.index}
                  </span>
                </div>
                <p className="text-sm text-secondary-700 leading-relaxed">
                  {caption.text}
                </p>
              </div>
            ))}

            {captions.length < (metadata?.captionCount || 0) && (
              <p className="text-xs text-secondary-400 text-center italic">
                ... and {(metadata?.captionCount || 0) - captions.length} more
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simple SRT parser - extracts caption index, timestamp, and text
 */
function parseSRT(srtContent: string): ParsedCaption[] {
  const captions: ParsedCaption[] = []
  const blocks = srtContent.split('\n\n').filter(block => block.trim())

  for (const block of blocks) {
    const lines = block.split('\n')
    if (lines.length < 3) continue

    const index = parseInt(lines[0].trim())
    const timestamp = lines[1].trim()
    const text = lines.slice(2).join(' ').trim()

    if (!isNaN(index) && timestamp.includes('-->')) {
      captions.push({ index, timestamp, text })
    }
  }

  return captions
}

/**
 * Format duration in seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
