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

  const handleDownloadAudio = () => {
    if (!audioUrl) return

    // Create temporary link and trigger download
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `voiceover-${Date.now()}.wav`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Download started',
      description: 'Your audio file is downloading',
    })
  }

  const handleDownloadVideo = () => {
    if (!videoUrl) return

    // STUB: In Phase 7, this will download real video
    toast({
      title: 'Video download (stub)',
      description: 'Real video download coming in Phase 7',
    })
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
                  <p className="text-sm text-secondary-500">MP4 format (stub)</p>
                </div>
                <Button onClick={handleDownloadVideo} variant="outline" size="sm">
                  Download (Stub)
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
