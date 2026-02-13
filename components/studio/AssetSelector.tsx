'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, ChevronDown, ChevronUp, X, Music } from 'lucide-react'
import { AssetGrid } from './AssetGrid'
import { AssetUploader } from './AssetUploader'

interface Asset {
  id: string
  public_url: string
  file_name: string
  duration_sec: number | null
  file_size_mb: number
  file_type: 'video' | 'audio'
}

interface AssetSelectorProps {
  type: 'video' | 'audio'
  title: string
  icon: React.ReactNode
  selectedUrls: string[]
  maxSelection?: number // undefined = unlimited, 1 = single, >1 = multiple
  onSelect: (urls: string[]) => void
}

export function AssetSelector({
  type,
  title,
  icon,
  selectedUrls,
  maxSelection,
  onSelect,
}: AssetSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])

  // Fetch assets to show thumbnails of selected items
  useEffect(() => {
    if (selectedUrls.length > 0) {
      loadAssets()
    }
  }, [selectedUrls.length > 0]) // Only load when we have selections

  const loadAssets = async () => {
    try {
      const response = await fetch(`/api/assets/list?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  const selectedAssets = assets.filter((a) => selectedUrls.includes(a.public_url))
  const isSingleSelect = maxSelection === 1
  const hasSelection = selectedUrls.length > 0

  const handleRemove = (url: string) => {
    onSelect(selectedUrls.filter((u) => u !== url))
  }

  const handleClear = () => {
    onSelect([])
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-display text-lg font-semibold text-secondary-700">
            {title}
          </h3>
          <span className="text-sm text-secondary-500">
            ({selectedUrls.length}
            {maxSelection && maxSelection > 1 && ` / ${maxSelection}`} selected)
          </span>
        </div>
        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-secondary-500 hover:text-secondary-700"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Selected Assets Display */}
      {hasSelection && (
        <div className="rounded-xl border border-primary-500/20 bg-primary-200 p-4">
          <div className="space-y-3">
            {selectedAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-3 rounded-lg bg-white p-3 border border-primary-500/10"
              >
                {/* Thumbnail */}
                {type === 'video' ? (
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-primary-300 flex-shrink-0">
                    <video
                      src={asset.public_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    {asset.duration_sec && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {formatDuration(asset.duration_sec)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-accent-lavender/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-accent-lavender" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-secondary-700 truncate">
                    {asset.file_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-secondary-500 mt-1">
                    {asset.duration_sec && (
                      <span>{formatDuration(asset.duration_sec)}</span>
                    )}
                    <span>{asset.file_size_mb.toFixed(1)} MB</span>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(asset.public_url)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUploader(!showUploader)}
          className="rounded-xl"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload New
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-xl"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 mr-2" />
          ) : (
            <ChevronDown className="w-4 h-4 mr-2" />
          )}
          Choose from Library ({assets.length})
        </Button>
      </div>

      {/* Expanded Library */}
      {isExpanded && (
        <div className="rounded-xl border border-primary-500/20 bg-primary-200 p-4">
          <AssetGrid
            type={type}
            selectedUrls={selectedUrls}
            onSelect={onSelect}
            maxSelection={maxSelection}
          />
        </div>
      )}

      {/* Inline Uploader */}
      {showUploader && (
        <AssetUploader
          type={type}
          onUploadComplete={() => {
            loadAssets() // Refresh asset list
            setShowUploader(false) // Close uploader
            setIsExpanded(true) // Show library with new asset
          }}
        />
      )}
    </div>
  )
}
