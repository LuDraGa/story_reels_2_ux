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
  project_id?: string | null
  audio_url: string
  background_videos: string[]
  subtitles_url?: string | null
  subtitles_path?: string | null
  music_url?: string | null
  music_volume?: number
}

interface ComposeResponse {
  video_url: string
  storage_path: string | null
  duration_sec?: number
  file_size_mb?: number
  processing_time_sec?: number
  is_temporary_url?: boolean
  temporary_url_expires_hours?: number
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
      project_id = null,
      audio_url,
      background_videos,
      subtitles_url = null,
      subtitles_path = null,
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
      has_subtitles: !!subtitles_url || !!subtitles_path,
      has_music: !!music_url,
      music_volume,
    })

    const supabase = await createSupabaseServerClient()

    let resolvedSubtitlesUrl = subtitles_url
    if (subtitles_path && subtitles_path.startsWith('projects/')) {
      const { data: subtitleData, error: subtitleError } = await supabase.storage
        .from('projects')
        .createSignedUrl(subtitles_path, 3600)

      if (subtitleError) {
        console.warn('[Video Compose] Failed to sign subtitles path:', subtitleError.message)
      } else if (subtitleData?.signedUrl) {
        resolvedSubtitlesUrl = subtitleData.signedUrl
      }
    }

    // Probe audio file to get actual duration
    console.log('[Video Compose] Probing audio duration from URL:', audio_url.substring(0, 100))
    let audioDuration = 30 // Fallback to 30 seconds if probe fails

    try {
      const { probeVideo } = await import('@/lib/api/ffmpeg')
      console.log('[Video Compose] Calling probe API...')
      const audioProbe = await probeVideo(audio_url)
      audioDuration = audioProbe.duration_sec
      console.log('[Video Compose] Audio probe successful! Duration:', audioDuration, 'seconds')
    } catch (error) {
      console.error('[Video Compose] Audio probe FAILED:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        audioUrl: audio_url.substring(0, 150),
      })
      console.warn('[Video Compose] Using fallback duration of 30 seconds')
    }

    // Call FFmpeg API to compose video
    console.log('[Video Compose] Calling FFmpeg API with params:', {
      backgroundVideosCount: background_videos.length,
      duration: audioDuration,
      hasSubtitles: !!resolvedSubtitlesUrl,
      hasMusic: !!music_url,
      musicVolume: music_volume,
    })
    const ffmpegResult = await composeReel({
      background_videos,
      audio_url,
      duration: audioDuration,
      subtitles_url: resolvedSubtitlesUrl,
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
    console.log('[Video Compose] Downloading composed video from:', ffmpegResult.output_url)
    const videoResponse = await fetch(ffmpegResult.output_url)
    if (!videoResponse.ok) {
      console.error('[Video Compose] Download failed:', {
        status: videoResponse.status,
        statusText: videoResponse.statusText,
        url: ffmpegResult.output_url,
      })
      throw new Error(`Failed to download composed video: ${videoResponse.status} ${videoResponse.statusText}`)
    }
    const videoBuffer = await videoResponse.arrayBuffer()

    console.log('[Video Compose] Video downloaded:', {
      size_mb: (videoBuffer.byteLength / 1024 / 1024).toFixed(2),
    })

    // Get Supabase client (try to get user, but support anonymous for one-off studio)
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

    // Check if video is too large for Supabase (Free tier: 50MB, Pro: 5GB)
    // We'll use 100MB as safe threshold
    const MAX_SUPABASE_UPLOAD_MB = 100
    const videoSizeMB = videoBuffer.byteLength / 1024 / 1024

    let signedUrl: string
    let isTemporaryUrl = false

    if (videoSizeMB > MAX_SUPABASE_UPLOAD_MB) {
      console.log(`[Video Compose] Video too large (${videoSizeMB.toFixed(2)}MB), using temporary Modal URL`)
      // Use Modal's output URL directly (valid for 24 hours)
      signedUrl = ffmpegResult.output_url
      isTemporaryUrl = true
    } else {
      console.log('[Video Compose] Uploading to Supabase:', storagePath)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(storagePath, videoBuffer, {
          contentType: 'video/mp4',
          upsert: false,
        })

      if (uploadError) {
        // If upload fails due to size limit, fall back to Modal URL
        if (uploadError.message?.includes('exceeded') || uploadError.statusCode === '413') {
          console.warn('[Video Compose] Upload exceeded limit, using temporary Modal URL')
          signedUrl = ffmpegResult.output_url
          isTemporaryUrl = true
        } else {
          console.error('[Video Compose] Upload error:', uploadError)
          return NextResponse.json(
            { error: 'Failed to upload video', details: uploadError.message },
            { status: 500 }
          )
        }
      } else {
        console.log('[Video Compose] Video uploaded successfully')

        // Get signed URL (1 year expiry)
        const { data: urlData } = await supabase.storage
          .from('projects')
          .createSignedUrl(storagePath, 31536000) // 1 year

        signedUrl = urlData?.signedUrl || ''

        if (!signedUrl) {
          console.error('[Video Compose] Failed to generate signed URL')
          return NextResponse.json(
            { error: 'Failed to generate signed URL' },
            { status: 500 }
          )
        }
      }
    }

    if (user && project_id) {
      const { error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .eq('user_id', user.id)
        .single()

      if (projectError) {
        console.warn('[Video Compose] Skipping video asset save:', projectError.message)
      } else {
        const { error: assetError } = await supabase.from('video_assets').insert({
          project_id,
          storage_path: storagePath,
          background_asset_id: null,
          srt_path: null,
          render_settings_json: {
            subtitles_path: subtitles_path,
            subtitles_url: resolvedSubtitlesUrl,
            background_videos,
            music_url,
            music_volume,
          },
        })

        if (assetError) {
          console.warn('[Video Compose] Failed to save video asset:', assetError.message)
        }
      }
    }

    // Build response
    const response: ComposeResponse = {
      video_url: signedUrl,
      storage_path: isTemporaryUrl ? null : storagePath,
      duration_sec: ffmpegResult.duration_sec || undefined,
      file_size_mb: ffmpegResult.file_size_mb || undefined,
      processing_time_sec: ffmpegResult.processing_time_sec || undefined,
      is_temporary_url: isTemporaryUrl,
      temporary_url_expires_hours: isTemporaryUrl ? 24 : undefined,
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
