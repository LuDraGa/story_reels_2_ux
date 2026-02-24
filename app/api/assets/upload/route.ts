/**
 * POST /api/assets/upload
 *
 * Upload background video or music asset to Supabase Storage
 *
 * This endpoint:
 * 1. Accepts video or audio file upload
 * 2. Validates file type and size
 * 3. Probes video metadata (duration, resolution, etc.)
 * 4. Uploads to Supabase Storage
 * 5. Stores metadata in background_assets table
 * 6. Returns asset info with signed URL
 *
 * IMPORTANT: Only authenticated users can upload assets
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { probeVideo } from '@/lib/api/ffmpeg'

// ============================================================================
// Types
// ============================================================================

interface UploadResponse {
  id: string
  storage_path: string
  public_url: string
  file_name: string
  file_type: 'video' | 'audio'
  duration_sec?: number
  width?: number
  height?: number
  file_size_mb: number
  tags: string[]
}

// ============================================================================
// Constants
// ============================================================================

const MAX_FILE_SIZE_MB = 500 // 500 MB max
const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
]
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', // .mp3
  'audio/wav',
  'audio/mp4', // .m4a
  'audio/aac',
  'audio/ogg',
]

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(req: NextRequest) {
  console.log('[Assets] Upload request started')

  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[Assets] Unauthorized - user not logged in')
      return NextResponse.json(
        { error: 'Authentication required to upload assets' },
        { status: 401 }
      )
    }

    console.log('[Assets] User authenticated:', user.id)

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const fileType = (formData.get('type') as 'video' | 'audio') || 'video'
    const tags = (formData.get('tags') as string)?.split(',').filter(Boolean) || []
    const clientDuration = formData.get('client_duration') ? parseFloat(formData.get('client_duration') as string) : null

    // Validate file
    if (!file) {
      console.error('[Assets] Missing file')
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    console.log('[Assets] File info:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      assetType: fileType,
    })

    // Validate file type
    const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type)
    const isAudio = SUPPORTED_AUDIO_TYPES.includes(file.type)

    if (!isVideo && !isAudio) {
      console.error('[Assets] Unsupported file type:', file.type)
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}`,
          supported: [...SUPPORTED_VIDEO_TYPES, ...SUPPORTED_AUDIO_TYPES],
        },
        { status: 400 }
      )
    }

    // Validate file size
    const fileSizeMB = file.size / 1024 / 1024
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      console.error('[Assets] File too large:', fileSizeMB, 'MB')
      return NextResponse.json(
        {
          error: `File size (${fileSizeMB.toFixed(1)} MB) exceeds maximum (${MAX_FILE_SIZE_MB} MB)`,
        },
        { status: 400 }
      )
    }

    // Generate storage path with sanitized filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4'

    // Sanitize filename: remove special characters, spaces, keep only alphanumeric, hyphens, underscores
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace invalid chars with underscore
      .substring(0, 50) // Limit length

    const fileName = `${timestamp}_${sanitizedName}.${fileExtension}`
    const storagePath = `backgrounds/${user.id}/${fileName}`

    console.log('[Assets] Uploading to:', storagePath)

    // Upload to Supabase Storage (backgrounds bucket)
    const { error: uploadError } = await supabase.storage
      .from('backgrounds')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Assets] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      )
    }

    console.log('[Assets] File uploaded successfully')

    // Get public URL (signed URL for 1 year)
    const { data: urlData } = await supabase.storage
      .from('backgrounds')
      .createSignedUrl(storagePath, 31536000) // 1 year

    const publicUrl = urlData?.signedUrl || ''

    // Probe video metadata (skip for audio files)
    let metadata: {
      duration_sec?: number
      width?: number
      height?: number
      fps?: number
      codec?: string
    } = {}

    if (isVideo && publicUrl) {
      try {
        console.log('[Assets] Probing video metadata for URL:', publicUrl.substring(0, 100))
        const probeResult = await probeVideo(publicUrl)
        metadata = {
          duration_sec: probeResult.duration_sec,
          width: probeResult.width,
          height: probeResult.height,
          fps: probeResult.fps,
          codec: probeResult.codec,
        }
        console.log('[Assets] Video metadata probed successfully:', metadata)
      } catch (probeError) {
        console.error('[Assets] Failed to probe video:', probeError)
        console.error('[Assets] Probe error details:', {
          message: probeError instanceof Error ? probeError.message : 'Unknown error',
          url: publicUrl.substring(0, 100),
          isVideo,
        })

        // Use client-detected duration as fallback
        if (clientDuration && clientDuration > 0) {
          console.log('[Assets] Using client-detected duration as fallback:', clientDuration)
          metadata.duration_sec = clientDuration
        }
      }
    } else {
      console.log('[Assets] Skipping probe:', { isVideo, hasUrl: !!publicUrl })

      // Still use client duration if available
      if (clientDuration && clientDuration > 0 && isVideo) {
        console.log('[Assets] Using client-detected duration:', clientDuration)
        metadata.duration_sec = clientDuration
      }
    }

    // Store metadata in database
    // @ts-ignore - Supabase type inference issue
    const { data: asset, error: dbError } = await supabase
      .from('background_assets')
      // @ts-ignore
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_type: fileType,
        duration_sec: metadata.duration_sec || null,
        width: metadata.width || null,
        height: metadata.height || null,
        file_size_mb: fileSizeMB,
        tags: tags,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Assets] Database error:', dbError)
      // Try to delete uploaded file
      await supabase.storage.from('backgrounds').remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to save asset metadata', details: dbError.message },
        { status: 500 }
      )
    }

    // @ts-ignore
    console.log('[Assets] Asset created:', asset.id)

    // Return asset info
    // @ts-ignore
    const response: UploadResponse = {
      // @ts-ignore
      id: asset.id,
      // @ts-ignore
      storage_path: asset.storage_path,
      public_url: publicUrl,
      // @ts-ignore
      file_name: asset.file_name,
      // @ts-ignore
      file_type: asset.file_type,
      // @ts-ignore
      duration_sec: asset.duration_sec || undefined,
      // @ts-ignore
      width: asset.width || undefined,
      // @ts-ignore
      height: asset.height || undefined,
      // @ts-ignore
      file_size_mb: asset.file_size_mb,
      // @ts-ignore
      tags: asset.tags || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Assets] Upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
