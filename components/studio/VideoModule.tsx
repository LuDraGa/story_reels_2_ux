'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Film, Music } from 'lucide-react'
import { AssetSelector } from './AssetSelector'
import { AdvancedSettings, CompositionSettings } from './AdvancedSettings'
import { CompositionSummary } from './CompositionSummary'
import { ASSEditorModal } from './ASSEditorModal'

interface VideoModuleProps {
  audioUrl: string | null
  assUrl: string | null
  assPath?: string | null
  videoUrl: string | null
  selectedVideos: string[]
  selectedMusic: string | null
  audioDuration?: number
  projectId?: string
  onAssUrlChange?: (assUrl: string) => void
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
  assPath,
  videoUrl,
  selectedVideos,
  selectedMusic,
  audioDuration,
  projectId,
  onAssUrlChange,
  onVideoGenerated,
  onVideoSelect,
  onMusicSelect,
}: VideoModuleProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showASSEditor, setShowASSEditor] = useState(false)
  const [videoAssets, setVideoAssets] = useState<any[]>([])
  const [detectedAudioDuration, setDetectedAudioDuration] = useState<number | null>(null)
  const [isTemporaryUrl, setIsTemporaryUrl] = useState(false)
  const [temporaryUrlExpires, setTemporaryUrlExpires] = useState<number | null>(null)
  const [videoFileSize, setVideoFileSize] = useState<number | null>(null)

  // Advanced settings state
  const [settings, setSettings] = useState<CompositionSettings>({
    musicVolume: 0.2, // 20% default (only setting currently supported by Modal FFmpeg API)
  })

  // Fetch video assets to get duration metadata
  useEffect(() => {
    if (selectedVideos.length > 0) {
      loadVideoAssets()
    }
  }, [selectedVideos])

  // Detect audio duration if not provided
  useEffect(() => {
    if (audioUrl && !audioDuration) {
      detectAudioDuration(audioUrl)
    }
  }, [audioUrl, audioDuration])

  const loadVideoAssets = async () => {
    try {
      const response = await fetch('/api/assets/list?type=video')
      if (response.ok) {
        const data = await response.json()
        setVideoAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to load video assets:', error)
    }
  }

  const detectAudioDuration = async (url: string) => {
    try {
      const audio = new Audio(url)
      audio.addEventListener('loadedmetadata', () => {
        setDetectedAudioDuration(audio.duration)
      })
    } catch (error) {
      console.error('Failed to detect audio duration:', error)
    }
  }

  // Match assets by base path (without token) like AssetSelector does
  const getBasePath = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.origin + urlObj.pathname
    } catch {
      return url
    }
  }

  const selectedBasePaths = selectedVideos.map(getBasePath)
  const selectedVideoAssets = videoAssets.filter((asset) => {
    const assetBasePath = getBasePath(asset.public_url)
    return selectedBasePaths.includes(assetBasePath)
  })

  const totalVideoDuration = selectedVideoAssets.reduce(
    (sum, asset) => sum + (asset.duration_sec || 0),
    0
  )

  // Use provided audioDuration or detected duration
  const effectiveAudioDuration = audioDuration || detectedAudioDuration || 0

  // Check if we have sufficient video content
  const hasSufficientVideoDuration = totalVideoDuration >= effectiveAudioDuration

  // Debug logging
  useEffect(() => {
    console.log('[VideoModule] Duration validation:', {
      selectedVideosCount: selectedVideos.length,
      loadedVideoAssetsCount: videoAssets.length,
      matchedVideoAssetsCount: selectedVideoAssets.length,
      totalVideoDuration,
      effectiveAudioDuration,
      audioDuration,
      detectedAudioDuration,
      hasSufficientVideoDuration,
      canGenerate: audioUrl && selectedVideos.length > 0 && hasSufficientVideoDuration,
    })
  }, [selectedVideos.length, selectedVideoAssets.length, totalVideoDuration, effectiveAudioDuration, hasSufficientVideoDuration])

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

    // Validate video duration vs audio duration
    if (!hasSufficientVideoDuration && effectiveAudioDuration > 0) {
      const shortfall = effectiveAudioDuration - totalVideoDuration
      const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60)
        const s = Math.floor(secs % 60)
        return mins > 0 ? `${mins}m ${s}s` : `${s}s`
      }
      toast({
        title: 'Insufficient video content',
        description: `Selected videos total ${formatTime(totalVideoDuration)}, but audio is ${formatTime(effectiveAudioDuration)}. Please select ${formatTime(shortfall)} more video content.`,
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

      const subtitlesPath =
        assPath && assPath.startsWith('projects/') ? assPath : null
      const response = await fetch('/api/video/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId || null,
          audio_url: audioUrl,
          background_videos: validVideos,
          subtitles_url: assUrl || null,
          subtitles_path: subtitlesPath,
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

      // Track if this is a temporary URL
      setIsTemporaryUrl(data.is_temporary_url || false)
      setTemporaryUrlExpires(data.temporary_url_expires_hours || null)
      setVideoFileSize(data.file_size_mb || null)

      if (data.is_temporary_url) {
        toast({
          title: 'Video generated successfully!',
          description: `Video too large for storage (${data.file_size_mb?.toFixed(0)}MB). Download within ${data.temporary_url_expires_hours}h.`,
          variant: 'default',
        })
      } else {
        toast({
          title: 'Video generated successfully!',
          description: `Video duration: ${data.duration_sec?.toFixed(1)}s`,
        })
      }
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

  const canGenerate = audioUrl && selectedVideos.length > 0 && hasSufficientVideoDuration
  const canEditCaptions = !!assUrl && !!projectId
  const previewVideoUrl = selectedVideos[0] || null

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
              requiredDuration={effectiveAudioDuration}
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

            {canEditCaptions && (
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowASSEditor(true)}
                  className="rounded-xl border-accent-lavender text-accent-lavender hover:bg-accent-lavender/10"
                >
                  Edit Captions
                </Button>
              </div>
            )}

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

                {/* Temporary URL Warning */}
                {isTemporaryUrl && temporaryUrlExpires && (
                  <div className="rounded-xl border-2 border-yellow-500/20 bg-yellow-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-800 mb-1">
                          Download Required - Link Expires in {temporaryUrlExpires} Hours
                        </h4>
                        <p className="text-sm text-yellow-700">
                          This video is too large to store permanently ({videoFileSize?.toFixed(0)}MB). Please download it now.
                          The link will expire after {temporaryUrlExpires} hours.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                    variant={isTemporaryUrl ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = videoUrl
                      a.download = 'reel.mp4'
                      a.click()
                    }}
                    className={isTemporaryUrl ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  >
                    {isTemporaryUrl ? '⬇️ Download Now (Required)' : 'Download'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {showASSEditor && assUrl && projectId && (
        <ASSEditorModal
          isOpen={showASSEditor}
          onClose={() => setShowASSEditor(false)}
          projectId={projectId}
          assUrl={assUrl}
          assPath={assPath || null}
          videoUrl={previewVideoUrl}
          audioUrl={audioUrl}
          musicUrl={selectedMusic}
          musicVolume={settings.musicVolume}
          onMusicVolumeChange={(volume) =>
            setSettings((prev) => ({ ...prev, musicVolume: volume }))
          }
          onSave={(newAssUrl) => {
            if (newAssUrl && onAssUrlChange) {
              onAssUrlChange(newAssUrl)
            }
          }}
        />
      )}
    </Card>
  )
}
