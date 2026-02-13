'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shuffle, Loader2, Upload, Film, Music } from 'lucide-react'
import { AssetUploader } from './AssetUploader'
import { AssetCard } from './AssetCard'
import { useToast } from '@/hooks/use-toast'

interface Asset {
  id: string
  storage_path: string
  public_url: string
  file_name: string
  file_type: 'video' | 'audio'
  duration_sec: number | null
  width: number | null
  height: number | null
  file_size_mb: number
  tags: string[]
  created_at: string
}

interface AssetLibraryProps {
  onVideoSelect: (videoUrls: string[]) => void
  onMusicSelect: (musicUrl: string | null) => void
  selectedVideos: string[]
  selectedMusic: string | null
}

export function AssetLibrary({
  onVideoSelect,
  onMusicSelect,
  selectedVideos,
  selectedMusic,
}: AssetLibraryProps) {
  const [videoAssets, setVideoAssets] = useState<Asset[]>([])
  const [musicAssets, setMusicAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    setIsLoading(true)
    try {
      // Load videos
      const videoResponse = await fetch('/api/assets/list?type=video')
      if (videoResponse.ok) {
        const videoData = await videoResponse.json()
        setVideoAssets(videoData.assets || [])
      }

      // Load music
      const musicResponse = await fetch('/api/assets/list?type=audio')
      if (musicResponse.ok) {
        const musicData = await musicResponse.json()
        setMusicAssets(musicData.assets || [])
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
      toast({
        title: 'Failed to load assets',
        description: 'Please refresh the page to try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoToggle = (assetId: string) => {
    const asset = videoAssets.find((a) => a.id === assetId)
    if (!asset) return

    const isSelected = selectedVideos.includes(asset.public_url)

    if (isSelected) {
      // Deselect
      onVideoSelect(selectedVideos.filter((url) => url !== asset.public_url))
    } else {
      // Select (allow multiple)
      onVideoSelect([...selectedVideos, asset.public_url])
    }
  }

  const handleMusicToggle = (assetId: string) => {
    const asset = musicAssets.find((a) => a.id === assetId)
    if (!asset) return

    if (selectedMusic === asset.public_url) {
      // Deselect
      onMusicSelect(null)
    } else {
      // Select (only one music track)
      onMusicSelect(asset.public_url)
    }
  }

  const handleRandomizeVideos = () => {
    if (videoAssets.length === 0) {
      toast({
        title: 'No videos available',
        description: 'Please upload some background videos first',
        variant: 'destructive',
      })
      return
    }

    // Pick 1-3 random videos
    const count = Math.min(3, videoAssets.length)
    const shuffled = [...videoAssets].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, count).map((a) => a.public_url)

    onVideoSelect(selected)

    toast({
      title: 'Videos randomized',
      description: `Selected ${selected.length} random video(s)`,
    })
  }

  const handleRandomizeMusic = () => {
    if (musicAssets.length === 0) {
      toast({
        title: 'No music available',
        description: 'Please upload some background music first',
        variant: 'destructive',
      })
      return
    }

    // Pick 1 random music track
    const randomIndex = Math.floor(Math.random() * musicAssets.length)
    const selected = musicAssets[randomIndex].public_url

    onMusicSelect(selected)

    toast({
      title: 'Music randomized',
      description: `Selected "${musicAssets[randomIndex].file_name}"`,
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-primary-300 border-primary-500/20 rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3 text-secondary-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading asset library...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-primary-300 border-primary-500/20 rounded-2xl overflow-hidden">
      <div className="w-full">
        {/* Header with Upload Toggle */}
        <div className="border-b border-primary-500/20 bg-gradient-to-r from-accent-sage/5 to-accent-lavender/5 p-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-secondary-700">
            Asset Library
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploader(!showUploader)}
            className="rounded-xl"
          >
            <Upload className="w-4 h-4 mr-2" />
            {showUploader ? 'Hide Uploader' : 'Upload Assets'}
          </Button>
        </div>

        {/* Upload Section */}
        {showUploader && (
          <div className="p-6 space-y-4 border-b border-primary-500/20">
            <AssetUploader type="video" onUploadComplete={loadAssets} />
            <AssetUploader type="audio" onUploadComplete={loadAssets} />
          </div>
        )}

        {/* Select Assets Section */}
        <div className="p-6 space-y-6">
          {/* Background Videos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-accent-sage" />
                <h3 className="font-display text-lg font-semibold text-secondary-700">
                  Background Videos
                </h3>
                <span className="text-sm text-secondary-500">
                  ({selectedVideos.length} selected)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomizeVideos}
                className="rounded-xl border-accent-sage text-accent-sage hover:bg-accent-sage/10"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Randomize
              </Button>
            </div>

            {videoAssets.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">
                <p>No background videos uploaded yet.</p>
                <Button
                  variant="link"
                  onClick={() => setShowUploader(true)}
                  className="text-accent-sage"
                >
                  Upload your first video →
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videoAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedVideos.includes(asset.public_url)}
                    onSelect={handleVideoToggle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Background Music */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-accent-lavender" />
                <h3 className="font-display text-lg font-semibold text-secondary-700">
                  Background Music
                </h3>
                <span className="text-sm text-secondary-500">
                  ({selectedMusic ? '1' : '0'} selected)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomizeMusic}
                className="rounded-xl border-accent-lavender text-accent-lavender hover:bg-accent-lavender/10"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Randomize
              </Button>
            </div>

            {musicAssets.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">
                <p>No background music uploaded yet.</p>
                <Button
                  variant="link"
                  onClick={() => setShowUploader(true)}
                  className="text-accent-lavender"
                >
                  Upload your first track →
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {musicAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedMusic === asset.public_url}
                    onSelect={handleMusicToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
