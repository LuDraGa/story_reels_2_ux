'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ExportModuleProps {
  audioUrl: string | null
  videoUrl: string | null
}

/**
 * Export Module - Step 5
 *
 * Download audio and video files
 */
export function ExportModule({ audioUrl, videoUrl }: ExportModuleProps) {
  const { toast } = useToast()

  const handleDownloadAudio = async () => {
    if (!audioUrl) return

    try {
      // Fetch the audio file as a blob (works for cross-origin URLs)
      const response = await fetch(audioUrl)
      if (!response.ok) throw new Error('Failed to fetch audio')

      const blob = await response.blob()

      // Create blob URL (same-origin, so download attribute works)
      const blobUrl = URL.createObjectURL(blob)

      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `voiceover-${Date.now()}.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl)

      toast({
        title: 'Download started',
        description: 'Your audio file is downloading',
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: 'Download failed',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadVideo = async () => {
    if (!videoUrl) return

    try {
      // Fetch the video file as a blob (works for cross-origin URLs)
      const response = await fetch(videoUrl)
      if (!response.ok) throw new Error('Failed to fetch video')

      const blob = await response.blob()

      // Create blob URL (same-origin, so download attribute works)
      const blobUrl = URL.createObjectURL(blob)

      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `reel-${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl)

      toast({
        title: 'Download started',
        description: 'Your video file is downloading',
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: 'Download failed',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  const hasAudio = !!audioUrl
  const hasVideo = !!videoUrl
  const isEmpty = !hasAudio && !hasVideo

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>5. Export</CardTitle>
            <CardDescription>Download your generated assets</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isEmpty ? (
              <span className="rounded-full bg-secondary-300 px-3 py-1 text-xs font-medium text-secondary-500">
                Idle
              </span>
            ) : (
              <span className="rounded-full bg-accent-sage/10 px-3 py-1 text-xs font-medium text-accent-sage">
                Ready
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty && (
          <div className="rounded-xl border border-secondary-300 bg-primary-200 p-4 text-center text-sm text-secondary-600">
            Generate audio or video to download
          </div>
        )}

        {!isEmpty && (
          <div className="space-y-3">
            {/* Audio Download */}
            {hasAudio && (
              <div className="flex items-center justify-between rounded-xl border border-secondary-300 bg-primary-100 p-4">
                <div>
                  <p className="font-medium text-secondary-700">Audio File</p>
                  <p className="text-sm text-secondary-500">WAV format</p>
                </div>
                <Button onClick={handleDownloadAudio} variant="outline" size="sm">
                  Download
                </Button>
              </div>
            )}

            {/* Video Download */}
            {hasVideo && (
              <div className="flex items-center justify-between rounded-xl border border-secondary-300 bg-primary-100 p-4">
                <div>
                  <p className="font-medium text-secondary-700">Video File</p>
                  <p className="text-sm text-secondary-500">MP4 format</p>
                </div>
                <Button onClick={handleDownloadVideo} variant="outline" size="sm">
                  Download
                </Button>
              </div>
            )}

            {/* Success Message */}
            {hasAudio && (
              <div className="rounded-xl border border-accent-sage/30 bg-accent-sage/5 p-4 text-center text-sm text-secondary-600">
                Your voiceover is ready! Download the audio file above.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
