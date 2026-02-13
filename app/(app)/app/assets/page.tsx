'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { getAssets, createAsset, deleteAsset } from './actions'

interface Asset {
  id: string
  user_id: string
  name: string
  storage_path: string
  tags: string[] | null
  created_at: string
  public_url?: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    setIsLoading(true)
    try {
      const result = await getAssets()

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      setAssets(result.assets as Asset[])
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (assetId: string) => {
    if (!confirm('Delete this background asset?')) return

    const result = await deleteAsset(assetId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Asset deleted',
      description: 'Background asset has been removed',
    })

    loadAssets()
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-24 rounded-2xl bg-primary-300 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-primary-300 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-secondary-700 tracking-tight">
            Background Assets
          </h1>
          <p className="text-secondary-500 mt-2">
            Manage background video loops for your reels
          </p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="rounded-xl bg-accent-sage hover:bg-accent-sage/90"
        >
          + Upload Background
        </Button>
      </div>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <Card className="p-12 text-center bg-primary-300 border-primary-500/20">
          <div className="max-w-md mx-auto">
            <p className="text-lg text-secondary-700 mb-2">
              No background assets yet
            </p>
            <p className="text-secondary-500 mb-6">
              Upload background video loops to use in your reel projects
            </p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="rounded-xl"
            >
              Upload First Background
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      {isUploadOpen && (
        <UploadDialog
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false)
            loadAssets()
          }}
        />
      )}
    </div>
  )
}

interface AssetCardProps {
  asset: Asset
  onDelete: (id: string) => void
}

function AssetCard({ asset, onDelete }: AssetCardProps) {
  const [videoError, setVideoError] = useState(false)

  return (
    <Card className="overflow-hidden bg-primary-300 border-primary-500/20">
      <div className="aspect-video bg-primary-200 flex items-center justify-center relative overflow-hidden">
        {asset.public_url && !videoError ? (
          <video
            src={asset.public_url}
            className="w-full h-full object-cover"
            loop
            muted
            autoPlay
            playsInline
            onError={() => setVideoError(true)}
          />
        ) : (
          <span className="text-4xl text-secondary-400">🎬</span>
        )}
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-display text-lg font-bold text-secondary-700 truncate">
          {asset.name}
        </h3>
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {asset.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-accent-lavender/10 text-accent-lavender"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onDelete(asset.id)}
            className="flex-1 rounded-xl text-red-600 border-red-300 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}

interface UploadDialogProps {
  onClose: () => void
  onSuccess: () => void
}

function UploadDialog({ onClose, onSuccess }: UploadDialogProps) {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !file) {
      toast({
        title: 'Missing fields',
        description: 'Title and file are required',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('tags', tags)
      formData.append('file', file)

      const result = await createAsset(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Asset uploaded',
        description: 'Background asset has been uploaded successfully',
      })

      onSuccess()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <Card className="w-full max-w-md bg-primary-300 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-secondary-700">
              Upload Background
            </h2>
            <p className="mt-1 text-sm text-secondary-500">
              Add a new background video for your projects
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">Title</label>
            <Input
              type="text"
              placeholder="My Background Video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              className="bg-primary-200 border-primary-500 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">
              Tags (comma-separated)
            </label>
            <Input
              type="text"
              placeholder="nature, landscape, sunset"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isUploading}
              className="bg-primary-200 border-primary-500 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">
              Video File
            </label>
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isUploading}
              className="bg-primary-200 border-primary-500 rounded-xl"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading}
              className="flex-1 rounded-xl"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
