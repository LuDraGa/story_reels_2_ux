/**
 * POST /api/video/compose
 *
 * Compose final video using FFmpeg API:
 * - Background videos (stitched together)
 * - Audio track with captions
 * - Optional background music
 *
 * This endpoint:
 * 1. Calls FFmpeg API /ops/compose
 * 2. Downloads composed video
 * 3. Uploads to Supabase Storage
 * 4. Returns signed URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { composeReel } from '@/lib/api/ffmpeg'

// ============================================================================
// Types
// ============================================================================

interface ComposeRequest {
  audio_url: string
  background_videos: string[]
  subtitles_url?: string | null
  music_url?: string | null
  music_volume?: number
}

interface ComposeResponse {
  video_url: string
  storage_path: string
  duration_sec?: number
  file_size_mb?: number
  processing_time_sec?: number
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(req: NextRequest) {
  console.log('[Video Compose] Request started')

  try {
    // Parse request body
    const body: ComposeRequest = await req.json()
    const {
      audio_url,
      background_videos,
      subtitles_url = null,
      music_url = null,
      music_volume = 0.2,
    } = body

    // Validate inputs
    if (!audio_url) {
      console.error('[Video Compose] Missing audio_url')
      return NextResponse.json({ error: 'audio_url is required' }, { status: 400 })
    }

    if (!background_videos || background_videos.length === 0) {
      console.error('[Video Compose] Missing background_videos')
      return NextResponse.json(
        { error: 'At least one background video is required' },
        { status: 400 }
      )
    }

    console.log('[Video Compose] Inputs:', {
      audio_url,
      background_videos: background_videos.length,
      has_subtitles: !!subtitles_url,
      has_music: !!music_url,
      music_volume,
    })

    // Get audio duration from URL (probe it)
    // For now, we'll estimate duration from background videos
    // TODO: Probe audio file to get exact duration
    const estimatedDuration = 30 // Default to 30 seconds, will be determined by FFmpeg

    // Call FFmpeg API to compose video
    console.log('[Video Compose] Calling FFmpeg API...')
    const ffmpegResult = await composeReel({
      background_videos,
      audio_url,
      duration: estimatedDuration,
      subtitles_url,
      subtitle_format: 'ass', // Always use ASS format for TikTok-style captions
      music_url,
      music_volume,
      output_format: 'mp4',
    })

    console.log('[Video Compose] FFmpeg result:', {
      output_url: ffmpegResult.output_url,
      duration_sec: ffmpegResult.duration_sec,
      file_size_mb: ffmpegResult.file_size_mb,
      processing_time_sec: ffmpegResult.processing_time_sec,
    })

    // Download composed video from FFmpeg API
    console.log('[Video Compose] Downloading composed video...')
    const videoResponse = await fetch(ffmpegResult.output_url)
    if (!videoResponse.ok) {
      throw new Error('Failed to download composed video from FFmpeg API')
    }
    const videoBuffer = await videoResponse.arrayBuffer()

    console.log('[Video Compose] Video downloaded:', {
      size_mb: (videoBuffer.byteLength / 1024 / 1024).toFixed(2),
    })

    // Get Supabase client (try to get user, but support anonymous for one-off studio)
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Determine storage path (oneoff/ for anonymous, projects/{userId}/ for authenticated)
    const timestamp = Date.now()
    let storagePath: string

    if (user) {
      // Authenticated user
      storagePath = `projects/${user.id}/videos/${timestamp}_composed.mp4`
    } else {
      // Anonymous user (one-off studio)
      // Use session ID from request if available, otherwise generate one
      const sessionId = req.headers.get('x-session-id') || crypto.randomUUID()
      storagePath = `projects/oneoff/${sessionId}/videos/${timestamp}_composed.mp4`
    }

    console.log('[Video Compose] Uploading to Supabase:', storagePath)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('projects')
      .upload(storagePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Video Compose] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload video', details: uploadError.message },
        { status: 500 }
      )
    }

    console.log('[Video Compose] Video uploaded successfully')

    // Get signed URL (1 year expiry)
    const { data: urlData } = await supabase.storage
      .from('projects')
      .createSignedUrl(storagePath, 31536000) // 1 year

    const signedUrl = urlData?.signedUrl || ''

    if (!signedUrl) {
      console.error('[Video Compose] Failed to generate signed URL')
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      )
    }

    // Build response
    const response: ComposeResponse = {
      video_url: signedUrl,
      storage_path: storagePath,
      duration_sec: ffmpegResult.duration_sec || undefined,
      file_size_mb: ffmpegResult.file_size_mb || undefined,
      processing_time_sec: ffmpegResult.processing_time_sec || undefined,
    }

    console.log('[Video Compose] Success:', {
      storage_path: storagePath,
      duration_sec: response.duration_sec,
      file_size_mb: response.file_size_mb,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Video Compose] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compose video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
