/**
 * Modal WhisperX STT API Integration
 *
 * Type definitions and utility functions for integrating with the existing
 * Modal WhisperX API for speech-to-text transcription with word-level timestamps.
 *
 * Base URL: https://abhirooprasad--whisperx-apis-fastapi-app.modal.run
 *
 * IMPORTANT: This API already exists. Do NOT rebuild it. Only integrate.
 * ALL calls to Modal API must be server-side (Next.js API routes only).
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Word-level transcription with timestamp and confidence score
 */
export interface TranscriptionWord {
  word: string
  start: number // seconds
  end: number // seconds
  score: number // confidence score (0-1)
}

/**
 * Segment containing multiple words
 */
export interface TranscriptionSegment {
  text: string
  start: number // seconds
  end: number // seconds
  words: TranscriptionWord[]
}

/**
 * Complete transcription response from WhisperX API
 */
export interface TranscriptionResponse {
  text: string // Full transcript
  language: string // Detected or specified language code
  duration: number // Total audio duration in seconds
  segments: TranscriptionSegment[]
}

/**
 * Transcription request parameters
 */
export interface TranscriptionRequest {
  audioFile: File | Blob // Audio file to transcribe
  language?: string // Optional language code (e.g., "en", "es") - auto-detected if not provided
}

/**
 * Health check response
 */
export interface WhisperXHealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  model?: string // e.g., "large-v3-turbo"
  gpu_available?: boolean
  alignment_available?: boolean
}

/**
 * Language info
 */
export interface LanguageInfo {
  code: string // e.g., "en"
  name: string // e.g., "English"
}

/**
 * Languages list response
 */
export interface LanguagesResponse {
  languages: LanguageInfo[]
  total: number
}

// ============================================================================
// Constants
// ============================================================================

export const WHISPERX_API_BASE_URL = process.env.WHISPERX_API_BASE_URL || 'https://abhirooprasad--whisperx-apis-fastapi-app.modal.run'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Call WhisperX API with retry logic (for lightweight endpoints)
 *
 * Similar to callModalWithRetry from coqui.ts, but for WhisperX endpoints.
 *
 * @param url - The full URL to call
 * @param options - Fetch options
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Response object
 * @throws Error if all retries fail
 */
export async function callWhisperXWithRetry(
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
    `Failed to call WhisperX API after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  )
}

/**
 * Call WhisperX API for transcription (NO RETRIES, NO TIMEOUT - expensive operation)
 *
 * Transcription can take several minutes for long audio files. We do NOT want to:
 * - Retry automatically (costs money and time)
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
export async function callWhisperXTranscribe(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // NO timeout - wait as long as it takes
  // NO retries - only try once
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new Error(`WhisperX transcription error: ${response.status} ${response.statusText}`)
  }

  return response
}

/**
 * Generate storage path for caption files
 *
 * Path logic:
 * - One-off (no userId): projects/oneoff/{sessionId}/captions/{timestamp}.srt
 * - Logged-in: projects/{userId}/{projectId}/captions/{timestamp}.srt
 *
 * @param userId - User ID (null for one-off studio)
 * @param projectId - Project ID (required for logged-in users)
 * @param sessionId - Session ID (required for one-off studio)
 * @returns Storage path string
 */
export function generateCaptionStoragePath(
  userId: string | null | undefined,
  projectId: string | null | undefined,
  sessionId: string | null | undefined,
  extension: 'srt' | 'json' = 'srt'
): string {
  const timestamp = Date.now()

  if (userId && projectId) {
    // Logged-in user path
    return `projects/${userId}/${projectId}/captions/${timestamp}.${extension}`
  } else if (sessionId) {
    // One-off studio path
    return `projects/oneoff/${sessionId}/captions/${timestamp}.${extension}`
  } else {
    // Fallback: use generic path with timestamp
    const fallbackSession = `session-${timestamp}`
    return `projects/oneoff/${fallbackSession}/captions/${timestamp}.${extension}`
  }
}

/**
 * User-friendly error messages for common failures
 */
export function getWhisperXErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'Transcription timed out. The audio may be too long. Please try a shorter file.'
    }
    if (error.message.includes('Failed to call WhisperX API')) {
      return 'Unable to connect to the transcription service. Please try again in a moment.'
    }
    if (error.message.includes('Client error')) {
      return 'Invalid audio file. Please check your file format and try again.'
    }
    if (error.message.includes('Server error')) {
      return 'The transcription service is experiencing issues. Please try again later.'
    }
  }
  return 'Failed to transcribe audio. Please try again.'
}

/**
 * Estimate transcription time based on audio duration
 * WhisperX large-v3-turbo is ~6x faster than real-time
 *
 * @param audioDurationSec - Audio duration in seconds
 * @returns Estimated transcription time in seconds
 */
export function estimateTranscriptionTime(audioDurationSec: number): number {
  // WhisperX large-v3-turbo: ~6x faster than real-time
  // Add 2s overhead for model loading and alignment
  return Math.ceil(audioDurationSec / 6) + 2
}

/**
 * Validate audio file for transcription
 * Supported formats: WAV, MP3, M4A, FLAC
 *
 * @param file - Audio file to validate
 * @returns True if valid, throws error otherwise
 */
export function validateAudioFile(file: File | Blob | any): boolean {
  const validTypes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/x-m4a',
    'audio/flac',
    'audio/x-flac',
  ]

  // Handle different file object types (browser File, Node.js File-like, Blob)
  const fileType = (file.type || '').toLowerCase()
  const fileName = (file.name || '').toLowerCase()

  // If no type or name, we can't validate - assume valid (will fail on API if invalid)
  if (!fileType && !fileName) {
    return true
  }

  // Check MIME type
  if (fileType && validTypes.some(type => fileType.includes(type))) {
    return true
  }

  // Check file extension as fallback
  if (fileName) {
    const validExtensions = ['.wav', '.mp3', '.m4a', '.flac']
    if (validExtensions.some(ext => fileName.endsWith(ext))) {
      return true
    }
  }

  throw new Error('Invalid audio format. Supported formats: WAV, MP3, M4A, FLAC')
}

// ============================================================================
// TODO: Future Features
// ============================================================================

/**
 * TODO: Add speaker diarization support (when WhisperX adds it)
 *
 * Speaker diarization identifies different speakers in the audio and labels them.
 * Useful for multi-speaker content (interviews, podcasts, etc.)
 *
 * Expected response format:
 * ```json
 * {
 *   "words": [
 *     {"word": "Hello", "start": 0.0, "end": 0.5, "speaker": "SPEAKER_00"},
 *     {"word": "Hi", "start": 0.6, "end": 0.8, "speaker": "SPEAKER_01"}
 *   ]
 * }
 * ```
 */

/**
 * TODO: Add punctuation and capitalization post-processing
 *
 * WhisperX may not always include perfect punctuation. Consider using:
 * - deepmultilingualpunctuation library
 * - LLM-based post-processing (Claude/GPT)
 *
 * This will improve caption readability.
 */
