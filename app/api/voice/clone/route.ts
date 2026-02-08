import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  COQUI_API_BASE_URL,
  callModalTTS,
  generateAudioStoragePath,
  getUserFriendlyErrorMessage,
} from '@/lib/api/coqui'
import type { AudioResponse } from '@/lib/api/coqui'

/**
 * POST /api/voice/clone
 *
 * Voice cloning endpoint using Modal Coqui API
 *
 * Flow:
 * 1. Parse FormData (text, language, reference_audio, projectId, userId, sessionId)
 * 2. Forward FormData to Modal API /voice-clone endpoint
 * 3. Receive binary WAV audio
 * 4. Upload to Supabase Storage (projects bucket)
 * 5. Return public URL and storage path
 *
 * Storage paths:
 * - One-off: projects/oneoff/{sessionId}/audio/{timestamp}.wav
 * - Logged-in: projects/{userId}/{projectId}/audio/{timestamp}.wav
 *
 * @param request - Request with FormData body
 * @returns AudioResponse JSON with audioUrl, storagePath, durationSec
 */
export async function POST(request: Request) {
  try {
    // 1. Parse FormData
    const formData = await request.formData()

    const text = formData.get('text') as string
    const language = formData.get('language') as string
    const reference_audio = formData.get('reference_audio') as File
    const projectId = formData.get('projectId') as string | null
    const userId = formData.get('userId') as string | null
    const sessionId = formData.get('sessionId') as string | null

    // Validate required fields
    if (!text || !language || !reference_audio) {
      return NextResponse.json(
        { error: 'Missing required fields: text, language, reference_audio' },
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

    // 2. Prepare FormData for Modal API
    const modalFormData = new FormData()
    modalFormData.append('text', text)
    modalFormData.append('language', language)
    modalFormData.append('reference_audio', reference_audio)

    // 3. Call Modal API /voice-clone endpoint (NO RETRIES, NO TIMEOUT - expensive operation)
    // Waits as long as needed, no automatic retries
    const response = await callModalTTS(`${COQUI_API_BASE_URL}/voice-clone`, {
      method: 'POST',
      body: modalFormData,
      // Note: Don't set Content-Type header - fetch will set it automatically with boundary
    })

    // 4. Get binary WAV audio
    const audioBuffer = await response.arrayBuffer()

    // 5. Upload to Supabase Storage
    const supabase = await createSupabaseServerClient()
    const storagePath = generateAudioStoragePath(userId, projectId, sessionId)

    const { error: uploadError } = await supabase.storage
      .from('projects')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/wav',
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      throw new Error(`Failed to upload audio to storage: ${uploadError.message}`)
    }

    // 6. Get public URL
    const { data: urlData } = supabase.storage
      .from('projects')
      .getPublicUrl(storagePath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded audio')
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
    return NextResponse.json({
      audioUrl: urlData.publicUrl,
      storagePath,
      durationSec,
    } as AudioResponse)
  } catch (error) {
    console.error('Voice cloning failed:', error)

    // Return user-friendly error
    return NextResponse.json(
      {
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
