'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Shuffle } from 'lucide-react'
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

interface AssetGridProps {
  type: 'video' | 'audio'
  selectedUrls: string[]
  onSelect: (urls: string[]) => void
  maxSelection?: number // undefined = unlimited, 1 = single
}

export function AssetGrid({
  type,
  selectedUrls,
  onSelect,
  maxSelection,
}: AssetGridProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAssets()
  }, [type])

  const loadAssets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/assets/list?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
      toast({
        title: 'Failed to load assets',
        description: 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) return

    const isSelected = selectedUrls.includes(asset.public_url)
    const isSingleSelect = maxSelection === 1

    if (isSelected) {
      // Deselect
      onSelect(selectedUrls.filter((url) => url !== asset.public_url))
    } else {
      // Select
      if (isSingleSelect) {
        // Replace selection
        onSelect([asset.public_url])
      } else if (maxSelection && selectedUrls.length >= maxSelection) {
        // Max limit reached
        toast({
          title: 'Maximum selection reached',
          description: `You can only select up to ${maxSelection} ${type}s`,
          variant: 'destructive',
        })
      } else {
        // Add to selection
        onSelect([...selectedUrls, asset.public_url])
      }
    }
  }

  const handleRandomize = () => {
    if (assets.length === 0) {
      toast({
        title: `No ${type}s available`,
        description: `Please upload some ${type}s first`,
        variant: 'destructive',
      })
      return
    }

    const count = maxSelection || Math.min(3, assets.length)
    const shuffled = [...assets].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, count).map((a) => a.public_url)

    onSelect(selected)

    toast({
      title: `${type === 'video' ? 'Videos' : 'Music'} randomized`,
      description: `Selected ${selected.length} random ${type}(s)`,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary-500 mb-3">No {type}s uploaded yet</p>
        <p className="text-sm text-secondary-400">
          Upload your first {type} to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Randomize Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary-600">
          {assets.length} {type}(s) available
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRandomize}
          className="rounded-xl"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Randomize
        </Button>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            isSelected={selectedUrls.includes(asset.public_url)}
            onSelect={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
