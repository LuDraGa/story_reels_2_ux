'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface VideoModuleProps {
  audioUrl: string | null
  videoUrl: string | null
  onVideoGenerated: (videoUrl: string) => void
}

/**
 * Video Module - Step 4 (STUB)
 *
 * Generate video with audio overlay
 * TODO: Implement real FFmpeg rendering in Phase 7
 */
export function VideoModule({ audioUrl, videoUrl, onVideoGenerated }: VideoModuleProps) {
  const { toast } = useToast()

  const handleGenerate = () => {
    // STUB: Simulate video generation with placeholder
    // Real implementation will call /api/render endpoint in Phase 7
    const placeholderVideoUrl = 'https://example.com/placeholder-video.mp4'
    onVideoGenerated(placeholderVideoUrl)

    toast({
      title: 'Video generated (stub)',
      description: 'This is a placeholder. Real rendering coming in Phase 7.',
    })
  }

  const isEmpty = !audioUrl

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>4. Video</CardTitle>
            <CardDescription>Compose video with audio overlay</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isEmpty ? (
              <span className="rounded-full bg-secondary-300 px-3 py-1 text-xs font-medium text-secondary-500">
                Idle
              </span>
            ) : videoUrl ? (
              <span className="rounded-full bg-accent-sage/10 px-3 py-1 text-xs font-medium text-accent-sage">
                Ready
              </span>
            ) : (
              <span className="rounded-full bg-secondary-300 px-3 py-1 text-xs font-medium text-secondary-500">
                Idle
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty && (
          <div className="rounded-xl border border-secondary-300 bg-primary-200 p-4 text-center text-sm text-secondary-600">
            Generate audio first to create a video
          </div>
        )}

        {!isEmpty && (
          <>
            {/* Stub Notice */}
            <div className="rounded-xl border border-accent-lavender/30 bg-accent-lavender/5 p-4 text-sm text-secondary-600">
              <p className="font-medium text-accent-lavender">Coming Soon</p>
              <p className="mt-1">
                Video rendering will be implemented in Phase 7 with FFmpeg integration.
                For now, this generates a placeholder.
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              variant="outline"
              className="w-full"
            >
              {videoUrl ? 'Regenerate Video (Stub)' : 'Generate Video (Stub)'}
            </Button>

            {/* Video Preview (if generated) */}
            {videoUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">
                  Preview
                </label>
                <div className="rounded-xl border border-secondary-300 bg-primary-200 p-8 text-center text-sm text-secondary-500">
                  Video preview will appear here in Phase 7
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
