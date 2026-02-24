/**
 * Modal FFmpeg API Integration
 *
 * Type definitions and utility functions for integrating with the existing
 * Modal FFmpeg API for video composition and processing.
 *
 * Base URL: https://abhirooprasad--ffmpeg-api-fastapi-app.modal.run
 *
 * IMPORTANT: This API already exists. Do NOT rebuild it. Only integrate.
 * ALL calls to Modal API must be server-side (Next.js API routes only).
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Request to compose complete reel (all-in-one operation)
 */
export interface ComposeRequest {
  background_videos: string[] // Array of background video URLs
  audio_url: string // Voiceover audio URL
  duration: number // Target duration in seconds
  subtitles_url?: string | null // Optional ASS/SRT subtitle URL
  subtitle_format?: 'ass' | 'srt' // Subtitle format (default: ass)
  music_url?: string | null // Optional background music URL
  music_volume?: number // Music volume 0.0-1.0 (default: 0.2)
  output_format?: string // Output format (default: mp4)
}

/**
 * Request to overlay subtitles on video
 */
export interface OverlaySubtitlesRequest {
  video_url: string // Video URL
  subtitle_url: string // Subtitle file URL (ASS or SRT)
  subtitle_format?: 'ass' | 'srt' // Subtitle format (default: ass)
  font_size?: number | null // Optional font size override
}

/**
 * Request to mix or replace audio track
 */
export interface MixAudioRequest {
  video_url: string // Video URL
  audio_url: string // Audio URL to mix/replace
  audio_volume?: number // Audio volume 0.0-2.0 (default: 1.0)
  replace_audio?: boolean // Replace existing audio vs mix (default: true)
  music_volume?: number | null // Original video audio volume (if mixing)
}

/**
 * Request to trim video to duration
 */
export interface TrimRequest {
  input_url: string // Video URL
  duration: number // Target duration in seconds
}

/**
 * Request to concatenate multiple videos
 */
export interface ConcatRequest {
  videos: string[] // Array of video URLs
}

/**
 * Request to crop video to different aspect ratio
 */
export interface SmartCropRequest {
  input_url: string // Video URL
  target_aspect: '9:16' | '16:9' | '1:1' | '4:5' | '4:3' // Target aspect ratio
}

/**
 * Generic operation response
 */
export interface OperationResponse {
  output_url: string // URL to download processed video
  duration_sec?: number | null // Video duration in seconds
  file_size_mb?: number | null // File size in MB
  processing_time_sec?: number | null // Processing time
  metadata?: Record<string, any> | null // Additional metadata
}

/**
 * Video metadata from ffprobe
 */
export interface ProbeResponse {
  duration_sec: number // Duration in seconds
  width: number // Video width
  height: number // Video height
  fps: number // Frames per second
  codec: string // Video codec
  audio_codec?: string | null // Audio codec
  bitrate_kbps?: number | null // Bitrate in kbps
  size_mb?: number | null // File size in MB
  format: string // Container format
  has_audio: boolean // Has audio track
  has_video: boolean // Has video track
  metadata: Record<string, any> // Additional metadata
}

/**
 * API health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  ffmpeg_version?: string
  ffprobe_version?: string
  volume_mounted?: boolean
  gpu_available?: boolean
  disk_space_gb?: number | null
  uptime_seconds?: number | null
}

// ============================================================================
// Constants
// ============================================================================

export const FFMPEG_API_BASE_URL =
  process.env.FFMPEG_API_BASE_URL ||
  'https://abhirooprasad--ffmpeg-api-fastapi-app.modal.run'

export const FFMPEG_MAX_DURATION_SEC = 600 // 10 minutes

export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'webm', 'avi', 'mov', 'mkv']
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'aac', 'm4a', 'ogg']
export const SUPPORTED_SUBTITLE_FORMATS = ['ass', 'srt']
export const ASPECT_RATIOS = ['9:16', '16:9', '1:1', '4:5', '4:3'] as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Call FFmpeg API with timeout and error handling
 *
 * @param endpoint - API endpoint (e.g., '/ops/compose')
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 120000 = 2 minutes)
 * @returns Response object
 * @throws Error if request fails
 */
export async function callFFmpegAPI(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 120000 // 2 minutes for video processing
): Promise<Response> {
  const url = `${FFMPEG_API_BASE_URL}${endpoint}`

  console.log('[FFmpeg] Calling API:', endpoint)

  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`FFmpeg API error (${response.status}): ${errorText}`)
  }

  return response
}

/**
 * Compose complete reel with background videos, audio, and subtitles
 *
 * @param request - Compose request parameters
 * @returns Operation response with output video URL
 */
export async function composeReel(
  request: ComposeRequest
): Promise<OperationResponse> {
  const response = await callFFmpegAPI(
    '/ops/compose',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
    600000 // 10 minutes timeout for video composition (concat filter with re-encoding is slow)
  )

  return response.json()
}

/**
 * Overlay subtitles on video
 *
 * @param request - Overlay request parameters
 * @returns Operation response with output video URL
 */
export async function overlaySubtitles(
  request: OverlaySubtitlesRequest
): Promise<OperationResponse> {
  const response = await callFFmpegAPI('/ops/overlay-subtitles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return response.json()
}

/**
 * Mix or replace audio track
 *
 * @param request - Mix audio request parameters
 * @returns Operation response with output video URL
 */
export async function mixAudio(
  request: MixAudioRequest
): Promise<OperationResponse> {
  const response = await callFFmpegAPI('/ops/mix-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return response.json()
}

/**
 * Get video metadata using ffprobe
 *
 * @param videoUrl - URL of video to probe
 * @returns Video metadata
 */
export async function probeVideo(videoUrl: string): Promise<ProbeResponse> {
  const response = await callFFmpegAPI(
    `/probe?url=${encodeURIComponent(videoUrl)}`,
    { method: 'GET' },
    30000 // 30 second timeout for probe
  )

  return response.json()
}

/**
 * Check FFmpeg API health
 *
 * @returns Health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await callFFmpegAPI('/health', { method: 'GET' }, 10000)
  return response.json()
}

/**
 * Validate video duration against max allowed
 *
 * @param duration - Duration in seconds
 * @returns True if valid
 * @throws Error if duration exceeds maximum
 */
export function validateDuration(duration: number): boolean {
  if (duration > FFMPEG_MAX_DURATION_SEC) {
    throw new Error(
      `Video duration (${duration}s) exceeds maximum allowed (${FFMPEG_MAX_DURATION_SEC}s)`
    )
  }
  return true
}

/**
 * Validate video URL format
 *
 * @param url - Video URL to validate
 * @returns True if valid
 * @throws Error if URL is invalid
 */
export function validateVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs are supported')
    }
    return true
  } catch (error) {
    throw new Error(`Invalid video URL: ${url}`)
  }
}

/**
 * Estimate processing time based on video duration
 *
 * Rule of thumb: Processing takes ~0.1x to 0.5x real-time
 * (e.g., 60s video takes 6-30 seconds to process)
 *
 * @param duration - Video duration in seconds
 * @returns Estimated processing time in seconds
 */
export function estimateProcessingTime(duration: number): {
  min: number
  max: number
} {
  return {
    min: Math.ceil(duration * 0.1),
    max: Math.ceil(duration * 0.5),
  }
}

/**
 * Generate storage path for composed video
 *
 * @param userId - User ID (null for anonymous)
 * @param projectId - Project ID (null for one-off)
 * @param sessionId - Session ID (for anonymous users)
 * @returns Storage path string
 */
export function generateVideoStoragePath(
  userId: string | null | undefined,
  projectId: string | null | undefined,
  sessionId: string | null | undefined
): string {
  const timestamp = Date.now()

  if (userId && projectId) {
    // Authenticated user path
    return `projects/${userId}/${projectId}/videos/${timestamp}.mp4`
  } else if (sessionId) {
    // Anonymous user path
    return `projects/oneoff/${sessionId}/videos/${timestamp}.mp4`
  } else {
    // Fallback
    const fallbackSession = `session-${timestamp}`
    return `projects/oneoff/${fallbackSession}/videos/${timestamp}.mp4`
  }
}

/**
 * User-friendly error messages for common failures
 */
export function getFFmpegErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'Video processing timed out. The video may be too long. Please try a shorter duration.'
    }
    if (error.message.includes('Failed to call FFmpeg API')) {
      return 'Unable to connect to the video processing service. Please try again in a moment.'
    }
    if (error.message.includes('Client error')) {
      return 'Invalid video format or URL. Please check your files and try again.'
    }
    if (error.message.includes('Server error')) {
      return 'The video processing service is experiencing issues. Please try again later.'
    }
  }
  return 'Failed to process video. Please try again.'
}

/**
 * Format file size in MB to human-readable string
 *
 * @param sizeMb - File size in MB
 * @returns Formatted string (e.g., "15.2 MB" or "1.5 GB")
 */
export function formatFileSize(sizeMb: number): string {
  if (sizeMb < 1) {
    return `${(sizeMb * 1024).toFixed(1)} KB`
  } else if (sizeMb < 1024) {
    return `${sizeMb.toFixed(1)} MB`
  } else {
    return `${(sizeMb / 1024).toFixed(1)} GB`
  }
}
