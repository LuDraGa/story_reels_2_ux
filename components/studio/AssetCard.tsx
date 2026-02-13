'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Film, Music, CheckCircle, Clock } from 'lucide-react'

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

interface AssetCardProps {
  asset: Asset
  isSelected: boolean
  onSelect: (assetId: string) => void
}

export function AssetCard({ asset, isSelected, onSelect }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (mb: number) => {
    if (mb < 1) {
      return `${(mb * 1024).toFixed(0)} KB`
    }
    return `${mb.toFixed(1)} MB`
  }

  const handleClick = () => {
    onSelect(asset.id)
  }

  return (
    <Card
      className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer group ${
        isSelected
          ? 'border-accent-sage bg-accent-sage/5'
          : 'border-primary-500/20 hover:border-accent-sage/50 bg-primary-300'
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail/Preview */}
      <div className="relative aspect-video bg-gradient-to-br from-primary-200 to-primary-400 overflow-hidden">
        {asset.file_type === 'video' && !thumbnailError ? (
          <video
            src={asset.public_url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            onError={() => setThumbnailError(true)}
            {...(isHovered ? { autoPlay: true } : {})}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {asset.file_type === 'video' ? (
              <Film className="w-16 h-16 text-secondary-400" />
            ) : (
              <Music className="w-16 h-16 text-secondary-400" />
            )}
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-accent-sage text-white rounded-full p-1">
            <CheckCircle className="w-5 h-5" />
          </div>
        )}

        {/* Duration Badge */}
        {asset.duration_sec && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(asset.duration_sec)}
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
          {asset.file_type === 'video' ? (
            <><Film className="w-3 h-3" /> Video</>
          ) : (
            <><Music className="w-3 h-3" /> Audio</>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* File Name */}
        <h4 className="font-medium text-sm text-secondary-700 truncate" title={asset.file_name}>
          {asset.file_name}
        </h4>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-secondary-500">
          <span>{formatFileSize(asset.file_size_mb)}</span>
          {asset.width && asset.height && (
            <span>{asset.width}×{asset.height}</span>
          )}
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs font-medium rounded-md bg-accent-lavender/10 text-accent-lavender border border-accent-lavender/20"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-secondary-200 text-secondary-500">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 bg-accent-sage/10 flex items-center justify-center transition-opacity">
          <Button
            size="sm"
            className="bg-white/90 text-accent-sage hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            Select
          </Button>
        </div>
      )}
    </Card>
  )
}
