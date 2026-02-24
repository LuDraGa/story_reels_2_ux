'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AssetUploaderProps {
  type: 'video' | 'audio'
  onUploadComplete?: () => void
}

export function AssetUploader({ type, onUploadComplete }: AssetUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tags, setTags] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const acceptedTypes = type === 'video'
    ? 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska'
    : 'audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg'

  const detectVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src)
        reject(new Error('Failed to load video metadata'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (500 MB max)
      const maxSize = 500 * 1024 * 1024 // 500 MB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `Maximum file size is 500 MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    // Detect video duration on client side for videos
    let clientDuration: number | null = null
    if (type === 'video') {
      try {
        console.log('[AssetUploader] Detecting video duration client-side...')
        clientDuration = await detectVideoDuration(selectedFile)
        console.log('[AssetUploader] Detected duration:', clientDuration, 'seconds')
      } catch (error) {
        console.warn('[AssetUploader] Failed to detect duration client-side:', error)
      }
    }

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', type)

      // Send client-detected duration if available
      if (clientDuration) {
        formData.append('client_duration', clientDuration.toString())
      }
      if (tags) {
        formData.append('tags', tags)
      }

      // Simulate progress (actual progress tracking requires backend support)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      // Upload to API
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload asset')
      }

      const result = await response.json()

      toast({
        title: 'Upload successful',
        description: `${type === 'video' ? 'Video' : 'Audio'} "${selectedFile.name}" uploaded successfully`,
      })

      // Reset form
      setSelectedFile(null)
      setTags('')
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent
      if (onUploadComplete) {
        onUploadComplete()
      }
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
    <Card className="bg-primary-300 border-primary-500/20 rounded-2xl p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-accent-mist-blue" />
          <h3 className="font-display text-lg font-semibold text-secondary-700">
            Upload {type === 'video' ? 'Background Video' : 'Background Music'}
          </h3>
        </div>

        {/* File Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary-700">
            {type === 'video' ? 'Video File' : 'Audio File'}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="w-full rounded-xl border border-secondary-300 bg-primary-100 p-3 text-secondary-700 file:mr-4 file:rounded-lg file:border-0 file:bg-accent-sage/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-sage hover:file:bg-accent-sage/20 focus:border-accent-sage focus:outline-none focus:ring-2 focus:ring-accent-sage/20"
          />
          <p className="text-xs text-secondary-500">
            {type === 'video'
              ? 'Supported: MP4, WebM, MOV, AVI, MKV (Max 500 MB)'
              : 'Supported: MP3, WAV, M4A, AAC, OGG (Max 500 MB)'}
          </p>
        </div>

        {/* Tags Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary-700">
            Tags (optional)
          </label>
          <Input
            placeholder="e.g., nature, city, abstract"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isUploading}
            className="rounded-xl"
          />
          <p className="text-xs text-secondary-500">
            Comma-separated tags for easier filtering
          </p>
        </div>

        {/* Selected File Info */}
        {selectedFile && !isUploading && (
          <div className="rounded-xl border border-accent-sage/20 bg-accent-sage/5 p-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent-sage flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-700 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-secondary-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-600">Uploading...</span>
              <span className="font-medium text-accent-mist-blue">{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-primary-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-sage to-accent-mist-blue transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {type === 'video' ? 'Video' : 'Music'}
            </>
          )}
        </Button>

        {/* Info */}
        <div className="rounded-xl border border-accent-lavender/20 bg-accent-lavender/5 p-3">
          <p className="text-xs text-secondary-600">
            <strong>Tip:</strong> {type === 'video'
              ? 'Upload high-quality background videos for professional-looking reels. Videos will be cropped to 9:16 aspect ratio.'
              : 'Upload royalty-free music to enhance your reels. Music volume will be automatically adjusted.'}
          </p>
        </div>
      </div>
    </Card>
  )
}
