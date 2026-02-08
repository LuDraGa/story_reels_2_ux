/**
 * Modal Coqui TTS API Integration
 *
 * Type definitions and utility functions for integrating with the existing
 * Modal Coqui TTS API.
 *
 * Base URL: https://abhirooprasad--coqui-apis-fastapi-app.modal.run
 *
 * IMPORTANT: This API already exists. Do NOT rebuild it. Only integrate.
 * ALL calls to Modal API must be server-side (Next.js API routes only).
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Speaker object returned from Modal API
 */
export interface Speaker {
  id: string
  name: string
  language?: string
  gender?: 'male' | 'female' | 'other'
}

/**
 * Text-to-Speech request parameters
 */
export interface TTSRequest {
  text: string
  speaker_id: string
  language: string
  // Optional: for storage path generation
  projectId?: string
  userId?: string
  sessionId?: string // For one-off studio (no login)
}

/**
 * Voice cloning request parameters
 */
export interface VoiceCloneRequest {
  text: string
  language: string
  reference_audio: File | Blob
  // Optional: for storage path generation
  projectId?: string
  userId?: string
  sessionId?: string // For one-off studio (no login)
}

/**
 * Audio response from our API wrappers
 */
export interface AudioResponse {
  audioUrl: string // Public Supabase Storage URL
  storagePath: string // Path in Supabase Storage bucket
  durationSec: number | null // TODO: Implement duration detection with FFprobe
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  version?: string
  timestamp?: string
}

/**
 * API Info response
 */
export interface ApiInfoResponse {
  name?: string
  version?: string
  endpoints?: string[]
  [key: string]: unknown // Allow additional fields
}

// ============================================================================
// Constants
// ============================================================================

export const COQUI_API_BASE_URL = process.env.COQUI_API_BASE_URL || 'https://abhirooprasad--coqui-apis-fastapi-app.modal.run'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Call Modal API with exponential backoff retry logic
 *
 * Retries failed requests up to maxRetries times with exponential backoff:
 * - Retry 1: Wait 1 second
 * - Retry 2: Wait 2 seconds
 * - Retry 3: Wait 4 seconds
 *
 * @param url - The full URL to call
 * @param options - Fetch options
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Response object
 * @throws Error if all retries fail
 */
export async function callModalWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  timeoutMs: number = 30000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(timeoutMs),
      })

      // If successful, return immediately
      if (response.ok) {
        return response
      }

      // If 4xx error (client error), don't retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`)
      }

      // If 5xx error (server error), retry with backoff
      lastError = new Error(`Server error: ${response.status} ${response.statusText}`)

      // Don't sleep on last attempt
      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't sleep on last attempt
      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to call Modal API after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  )
}

/**
 * Call Modal API for TTS generation (NO RETRIES, NO TIMEOUT - expensive operation)
 *
 * TTS generation is expensive and can take several minutes. We do NOT want to:
 * - Retry automatically (costs money)
 * - Timeout (wait as long as needed)
 *
 * Instead, we wait for the response no matter how long it takes.
 * User can manually retry if it fails.
 *
 * @param url - The full URL to call
 * @param options - Fetch options
 * @returns Response object
 * @throws Error if request fails
 */
export async function callModalTTS(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // NO timeout - wait as long as it takes
  // NO retries - only try once
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status} ${response.statusText}`)
  }

  return response
}

/**
 * Generate storage path for audio files
 *
 * Path logic:
 * - One-off (no userId): projects/oneoff/{sessionId}/audio/{timestamp}.wav
 * - Logged-in: projects/{userId}/{projectId}/audio/{timestamp}.wav
 *
 * @param userId - User ID (null for one-off studio)
 * @param projectId - Project ID (required for logged-in users)
 * @param sessionId - Session ID (required for one-off studio)
 * @returns Storage path string
 */
export function generateAudioStoragePath(
  userId: string | null | undefined,
  projectId: string | null | undefined,
  sessionId: string | null | undefined
): string {
  const timestamp = Date.now()

  if (userId && projectId) {
    // Logged-in user path
    return `projects/${userId}/${projectId}/audio/${timestamp}.wav`
  } else if (sessionId) {
    // One-off studio path
    return `projects/oneoff/${sessionId}/audio/${timestamp}.wav`
  } else {
    // Fallback: use generic path with timestamp
    const fallbackSession = `session-${timestamp}`
    return `projects/oneoff/${fallbackSession}/audio/${timestamp}.wav`
  }
}

/**
 * User-friendly error messages for common failures
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'Request timed out. The TTS service may be busy. Please try again.'
    }
    if (error.message.includes('Failed to call Modal API')) {
      return 'Unable to connect to the TTS service. Please try again in a moment.'
    }
    if (error.message.includes('Client error')) {
      return 'Invalid request. Please check your input and try again.'
    }
    if (error.message.includes('Server error')) {
      return 'The TTS service is experiencing issues. Please try again later.'
    }
  }
  return 'Failed to generate audio. Please try again.'
}

// ============================================================================
// TODO: Future Features
// ============================================================================

/**
 * TODO: Detect audio duration using FFprobe
 *
 * Example implementation:
 * ```bash
 * ffprobe -v error -show_entries format=duration \
 *   -of default=noprint_wrappers=1:nokey=1 audio.wav
 * ```
 *
 * This will require:
 * 1. Installing FFmpeg on the server/container
 * 2. Creating a Node.js wrapper to execute FFprobe
 * 3. Parsing the output to get duration in seconds
 * 4. Updating AudioResponse.durationSec from null to actual value
 */

/**
 * TODO: Convert WAV to M4A/MP3 for smaller file sizes
 *
 * Example implementation:
 * ```bash
 * ffmpeg -i input.wav -c:a aac -b:a 128k output.m4a
 * ```
 *
 * This will:
 * 1. Reduce file size significantly (WAV is uncompressed)
 * 2. Improve loading times for audio preview
 * 3. Reduce storage costs
 * 4. Require updating storage path logic to handle multiple formats
 */
