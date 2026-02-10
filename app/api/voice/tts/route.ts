import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  COQUI_API_BASE_URL,
  callModalTTS,
  generateAudioStoragePath,
  getUserFriendlyErrorMessage,
} from '@/lib/api/coqui'
import type { AudioResponse, TTSRequest } from '@/lib/api/coqui'

/**
 * POST /api/voice/tts
 *
 * Text-to-Speech endpoint using Modal Coqui API
 *
 * Flow:
 * 1. Parse request body (text, speaker_id, language, projectId, userId, sessionId)
 * 2. Call Modal API /tts endpoint
 * 3. Receive binary WAV audio
 * 4. Upload to Supabase Storage (projects bucket)
 * 5. Return public URL and storage path
 *
 * Storage paths:
 * - One-off: projects/oneoff/{sessionId}/audio/{timestamp}.wav
 * - Logged-in: projects/{userId}/{projectId}/audio/{timestamp}.wav
 *
 * @param request - Request with TTSRequest body
 * @returns AudioResponse JSON with audioUrl, storagePath, durationSec
 */
export async function POST(request: Request) {
  try {
    // 1. Parse request body
    const body = await request.json() as TTSRequest
    const { text, speaker_id, language, projectId, userId, sessionId } = body

    console.log('[TTS] Request received:', {
      textLength: text?.length,
      speaker_id,
      language,
      hasUserId: !!userId,
      hasSessionId: !!sessionId,
      hasProjectId: !!projectId
    })

    // Validate required fields
    if (!text || !speaker_id || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: text, speaker_id, language' },
        { status: 400 }
      )
    }

    // Validate storage path parameters
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required for storage path generation' },
        { status: 400 }
      )
    }

    // 2. Call Modal API /tts endpoint (NO RETRIES, NO TIMEOUT - expensive operation)
    // Waits as long as needed, no automatic retries
    console.log('[TTS] Calling Modal API...')
    const response = await callModalTTS(`${COQUI_API_BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        speaker_id,
        language,
      }),
    })

    console.log('[TTS] Modal API response:', {
      status: response.status,
      contentType: response.headers.get('content-type')
    })

    // 3. Get binary WAV audio
    const audioBuffer = await response.arrayBuffer()
    console.log('[TTS] Audio buffer size:', audioBuffer.byteLength)

    // 4. Determine storage strategy: authenticated users → Supabase, anonymous → data URL
    const isAuthenticated = !!userId
    console.log('[TTS] User authentication status:', isAuthenticated ? 'authenticated' : 'anonymous')

    let audioUrl: string
    let storagePath: string

    if (!isAuthenticated) {
      // Anonymous user (one-off studio) - return audio as base64 data URL
      console.log('[TTS] Anonymous user, returning audio as data URL (no Supabase upload)')

      const base64Audio = Buffer.from(audioBuffer).toString('base64')
      audioUrl = `data:audio/wav;base64,${base64Audio}`
      storagePath = 'temp://not-stored' // Placeholder

      console.log('[TTS] Audio converted to data URL (size:', base64Audio.length, 'chars)')
    } else {
      // Authenticated user - upload to Supabase Storage
      const supabase = await createSupabaseServerClient()
      storagePath = generateAudioStoragePath(userId, projectId, sessionId)

      console.log('[TTS] Uploading to Supabase Storage:', {
        bucket: 'projects',
        path: storagePath,
        size: audioBuffer.byteLength
      })

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/wav',
          upsert: false, // Don't overwrite existing files
        })

      if (uploadError) {
        console.error('[TTS] Supabase storage upload error:', uploadError)
        throw new Error(`Failed to upload audio to storage: ${uploadError.message}`)
      }

      console.log('[TTS] Upload successful, generating signed URL...')

      // Generate signed URL (valid for 1 year = 31536000 seconds)
      // Signed URLs work for both public and private buckets
      const { data: urlData, error: urlError } = await supabase.storage
        .from('projects')
        .createSignedUrl(storagePath, 31536000) // 1 year

      console.log('[TTS] Signed URL generated:', urlData?.signedUrl)

      if (urlError || !urlData?.signedUrl) {
        console.error('[TTS] Failed to generate signed URL:', urlError)
        throw new Error('Failed to get signed URL for uploaded audio')
      }

      audioUrl = urlData.signedUrl
    }

    // TODO: Detect audio duration using FFprobe
    // Example: ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 audio.wav
    // This requires:
    // 1. Installing FFmpeg on the server/container
    // 2. Creating a Node.js wrapper to execute FFprobe
    // 3. Parsing the output to get duration in seconds
    // For now, returning null for durationSec
    const durationSec = null

    // TODO: Convert WAV to M4A/MP3 for smaller file sizes
    // Example: ffmpeg -i input.wav -c:a aac -b:a 128k output.m4a
    // This will:
    // 1. Reduce file size significantly (WAV is uncompressed)
    // 2. Improve loading times for audio preview
    // 3. Reduce storage costs

    // Return success response
    console.log('[TTS] Success! Returning response:', {
      audioUrl,
      storagePath,
      durationSec: null
    })

    return NextResponse.json({
      audioUrl,
      storagePath,
      durationSec: null,
    } as AudioResponse)
  } catch (error) {
    console.error('[TTS] Error occurred:', error)
    console.error('[TTS] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Return user-friendly error
    return NextResponse.json(
      {
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
