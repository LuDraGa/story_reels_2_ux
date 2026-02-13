'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Film, Music } from 'lucide-react'
import { AssetSelector } from './AssetSelector'
import { AdvancedSettings, CompositionSettings } from './AdvancedSettings'
import { CompositionSummary } from './CompositionSummary'

interface VideoModuleProps {
  audioUrl: string | null
  assUrl: string | null
  videoUrl: string | null
  selectedVideos: string[]
  selectedMusic: string | null
  audioDuration?: number
  onVideoGenerated: (videoUrl: string) => void
  onVideoSelect: (videos: string[]) => void
  onMusicSelect: (music: string | null) => void
}

/**
 * Video Module - Step 4
 *
 * Select background assets and compose final video with:
 * - Background videos (multiple)
 * - Generated audio with captions
 * - Optional background music
 * - Advanced composition settings
 */
export function VideoModule({
  audioUrl,
  assUrl,
  videoUrl,
  selectedVideos,
  selectedMusic,
  audioDuration,
  onVideoGenerated,
  onVideoSelect,
  onMusicSelect,
}: VideoModuleProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Advanced settings state
  const [settings, setSettings] = useState<CompositionSettings>({
    musicVolume: 0.2, // 20% default (only setting currently supported by Modal FFmpeg API)
  })

  const handleGenerate = async () => {
    if (!audioUrl) {
      toast({
        title: 'Missing audio',
        description: 'Please generate audio first',
        variant: 'destructive',
      })
      return
    }

    // Filter out empty strings and check if we have valid videos
    const validVideos = selectedVideos.filter(v => v && v.trim().length > 0)

    if (validVideos.length === 0) {
      toast({
        title: 'No videos selected',
        description: 'Please select at least one background video',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/video/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_url: audioUrl,
          background_videos: validVideos,
          subtitles_url: assUrl || null,
          music_url: selectedMusic,
          music_volume: settings.musicVolume, // Only supported setting for now
        }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to compose video')
      }

      const data = await response.json()
      onVideoGenerated(data.video_url)

      toast({
        title: 'Video generated successfully!',
        description: `Video duration: ${data.duration_sec?.toFixed(1)}s`,
      })
    } catch (error) {
      console.error('Video generation error:', error)
      toast({
        title: 'Video generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const canGenerate = audioUrl && selectedVideos.length > 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>4. Video Composition</CardTitle>
            <CardDescription>Select assets and compose final video</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <span className="rounded-full bg-accent-lavender/10 px-3 py-1 text-xs font-medium text-accent-lavender flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Composing...
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
      <CardContent className="space-y-6">
        {!audioUrl && (
          <div className="rounded-xl border border-secondary-300 bg-primary-200 p-4 text-center text-sm text-secondary-600">
            Generate audio first to compose a video
          </div>
        )}

        {audioUrl && (
          <>
            {/* Background Videos Selector */}
            <AssetSelector
              type="video"
              title="Background Videos"
              icon={<Film className="w-5 h-5 text-accent-sage" />}
              selectedUrls={selectedVideos}
              onSelect={onVideoSelect}
              maxSelection={5} // Allow up to 5 videos
            />

            {/* Background Music Selector */}
            <AssetSelector
              type="audio"
              title="Background Music (Optional)"
              icon={<Music className="w-5 h-5 text-accent-lavender" />}
              selectedUrls={selectedMusic ? [selectedMusic] : []}
              onSelect={(urls) => onMusicSelect(urls[0] || null)}
              maxSelection={1} // Only one music track
            />

            {/* Advanced Settings */}
            <AdvancedSettings
              settings={settings}
              onChange={setSettings}
              hasMusicSelected={!!selectedMusic}
            />

            {/* Composition Summary */}
            <CompositionSummary
              hasAudio={!!audioUrl}
              hasCaptions={!!assUrl}
              selectedVideosCount={selectedVideos.length}
              hasMusic={!!selectedMusic}
              audioDuration={audioDuration}
              canCompose={!!canGenerate}
            />

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Composing Video... {progress}%
                </>
              ) : videoUrl ? (
                '🎬 Regenerate Video'
              ) : (
                '🎬 Compose Video'
              )}
            </Button>

            {/* Video Preview */}
            {videoUrl && !isGenerating && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-secondary-700">
                  Video Preview
                </label>
                <div className="rounded-2xl border-2 border-accent-sage/20 bg-primary-300 overflow-hidden">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full aspect-video"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(videoUrl, '_blank')}
                  >
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = videoUrl
                      a.download = 'reel.mp4'
                      a.click()
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
