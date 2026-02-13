/**
 * POST /api/stt/transcribe
 *
 * Transcribe audio to text with word-level timestamps using WhisperX API
 *
 * This endpoint:
 * 1. Accepts audio file (WAV, MP3, M4A, FLAC)
 * 2. Calls Modal WhisperX API for transcription
 * 3. Generates SRT captions (sentence style by default)
 * 4. Stores transcription JSON + SRT in Supabase Storage
 * 5. Returns transcription with URLs to both files
 *
 * IMPORTANT: This is a server-side route. NEVER call WhisperX from the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  WHISPERX_API_BASE_URL,
  callWhisperXTranscribe,
  generateCaptionStoragePath,
  validateAudioFile,
  getWhisperXErrorMessage,
  type TranscriptionResponse,
} from '@/lib/api/whisperx'
import { generateSRT } from '@/lib/captions/srt-generator'
import { generateASS } from '@/lib/captions/ass-generator'

export async function POST(req: NextRequest) {
  console.log('[STT] Transcription request started')

  try {
    // Parse multipart form data
    const formData = await req.formData()
    const audioFile = formData.get('file') as File | null
    const language = formData.get('language') as string | null
    const projectId = formData.get('projectId') as string | null
    const sessionId = formData.get('sessionId') as string | null
    const captionStyle = (formData.get('captionStyle') as string) || 'tiktok'
    const detectFocusWords = formData.get('detectFocusWords') === 'true'

    // Validate required fields
    if (!audioFile) {
      console.error('[STT] Missing audio file')
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // Validate audio file format
    try {
      validateAudioFile(audioFile)
    } catch (error) {
      console.error('[STT] Invalid audio file:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid audio file' },
        { status: 400 }
      )
    }

    console.log('[STT] Audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      language: language || 'auto-detect',
    })

    // Get user from Supabase (optional for one-off studio)
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || null

    console.log('[STT] User context:', {
      userId: userId || 'anonymous',
      projectId: projectId || 'one-off',
      sessionId: sessionId || 'none',
    })

    // Prepare WhisperX API request
    const whisperXFormData = new FormData()
    whisperXFormData.append('file', audioFile)
    if (language) {
      whisperXFormData.append('language', language)
    }

    // Call WhisperX API (NO retries, NO timeout - expensive operation)
    console.log('[STT] Calling WhisperX API...')
    const startTime = Date.now()

    const response = await callWhisperXTranscribe(
      `${WHISPERX_API_BASE_URL}/transcribe`,
      {
        method: 'POST',
        body: whisperXFormData,
      }
    )

    const transcription: TranscriptionResponse = await response.json()
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('[STT] Transcription complete:', {
      duration: transcription.duration,
      language: transcription.language,
      wordCount: transcription.segments.reduce(
        (sum, seg) => sum + seg.words.length,
        0
      ),
      elapsedTime: `${elapsedTime}s`,
    })

    // Generate SRT captions (sentence style with 5 words per line)
    console.log('[STT] Generating SRT captions...')
    const srtContent = generateSRT(transcription, {
      style: 'sentence',
      maxWordsPerCaption: 5,
      maxCharsPerLine: 50,
    })

    // Detect focus words using LLM (if requested)
    let focusWords: number[] = []
    if (detectFocusWords) {
      console.log('[STT] Detecting focus words with LLM...')
      try {
        const focusResponse = await fetch(`${req.nextUrl.origin}/api/llm/focus-words`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: transcription.text,
            maxWords: 5,
          }),
        })

        if (focusResponse.ok) {
          const focusData = await focusResponse.json()
          focusWords = focusData.focusWords || []
          console.log('[STT] Focus words detected:', focusWords)
        } else {
          console.warn('[STT] Focus word detection failed, continuing without focus words')
        }
      } catch (focusError) {
        console.error('[STT] Focus word detection error:', focusError)
        // Continue without focus words
      }
    }

    // Generate ASS captions with karaoke effect
    console.log('[STT] Generating ASS captions...')
    const assContent = generateASS(transcription, {
      preset: captionStyle,
      focusWords,
      maxWordsPerLine: 5,
      title: 'Reel Story Studio Captions',
      videoWidth: 1080,
      videoHeight: 1920,
    })

    // Determine storage strategy: authenticated users → Supabase, anonymous → data URLs
    const isAuthenticated = !!userId
    console.log('[STT] User authentication status:', isAuthenticated ? 'authenticated' : 'anonymous')

    let transcriptionUrl: string | null = null
    let srtUrl: string | null = null
    let assUrl: string | null = null
    let storagePath: string | null = null
    let srtPath: string | null = null
    let assPath: string | null = null

    if (!isAuthenticated) {
      // Anonymous user (one-off studio) - return as data URLs (no Supabase upload)
      console.log('[STT] Anonymous user, returning transcription/SRT/ASS as data URLs')

      // Create data URLs
      const transcriptionJson = JSON.stringify(transcription, null, 2)
      const transcriptionBase64 = Buffer.from(transcriptionJson).toString('base64')
      transcriptionUrl = `data:application/json;base64,${transcriptionBase64}`

      const srtBase64 = Buffer.from(srtContent).toString('base64')
      srtUrl = `data:text/plain;base64,${srtBase64}`

      const assBase64 = Buffer.from(assContent).toString('base64')
      assUrl = `data:text/plain;base64,${assBase64}`

      storagePath = 'temp://not-stored-json'
      srtPath = 'temp://not-stored-srt'
      assPath = 'temp://not-stored-ass'

      console.log('[STT] Transcription, SRT, and ASS converted to data URLs')
    } else {
      // Authenticated user - upload to Supabase Storage
      storagePath = generateCaptionStoragePath(userId, projectId, sessionId, 'json')
      srtPath = generateCaptionStoragePath(userId, projectId, sessionId, 'srt')
      assPath = storagePath.replace('.json', '.ass') // Same path pattern as SRT

      console.log('[STT] Storing transcription to:', storagePath)

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(storagePath, JSON.stringify(transcription, null, 2), {
          contentType: 'application/json',
          upsert: false,
        })

      if (uploadError) {
        console.error('[STT] Supabase upload error:', uploadError)
        // Don't fail request - just log error and continue
      }

      // Upload SRT captions
      console.log('[STT] Storing SRT to:', srtPath)
      const { error: srtUploadError } = await supabase.storage
        .from('projects')
        .upload(srtPath, srtContent, {
          contentType: 'text/plain',
          upsert: false,
        })

      if (srtUploadError) {
        console.error('[STT] SRT upload error:', srtUploadError)
        // Don't fail - continue without SRT
      }

      // Upload ASS captions
      console.log('[STT] Storing ASS to:', assPath)
      const { error: assUploadError } = await supabase.storage
        .from('projects')
        .upload(assPath, assContent, {
          contentType: 'text/plain',
          upsert: false,
        })

      if (assUploadError) {
        console.error('[STT] ASS upload error:', assUploadError)
        // Don't fail - continue without ASS
      }

      // Get signed URLs (1 hour expiry)
      if (!uploadError) {
        const { data: signedUrlData } = await supabase.storage
          .from('projects')
          .createSignedUrl(storagePath, 3600)

        transcriptionUrl = signedUrlData?.signedUrl || null
        console.log('[STT] Transcription URL generated:', transcriptionUrl ? 'yes' : 'no')
      }

      if (!srtUploadError) {
        const { data: srtSignedUrlData } = await supabase.storage
          .from('projects')
          .createSignedUrl(srtPath, 3600)

        srtUrl = srtSignedUrlData?.signedUrl || null
        console.log('[STT] SRT URL generated:', srtUrl ? 'yes' : 'no')
      }

      if (!assUploadError) {
        const { data: assSignedUrlData } = await supabase.storage
          .from('projects')
          .createSignedUrl(assPath, 3600)

        assUrl = assSignedUrlData?.signedUrl || null
        console.log('[STT] ASS URL generated:', assUrl ? 'yes' : 'no')
      }
    }

    // Return transcription response with SRT and ASS
    return NextResponse.json({
      transcription,
      storagePath,
      srtPath,
      assPath,
      transcriptionUrl,
      srtUrl,
      assUrl,
      focusWords,
      metadata: {
        duration: transcription.duration,
        language: transcription.language,
        wordCount: transcription.segments.reduce(
          (sum, seg) => sum + seg.words.length,
          0
        ),
        processingTime: parseFloat(elapsedTime),
        captionCount: srtContent.split('\n\n').length,
        style: captionStyle,
        hasFocusWords: focusWords.length > 0,
      },
    })
  } catch (error) {
    console.error('[STT] Transcription error:', error)

    const errorMessage = getWhisperXErrorMessage(error)

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
