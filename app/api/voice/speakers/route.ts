import { NextResponse } from 'next/server'
import { COQUI_API_BASE_URL, callModalWithRetry, getUserFriendlyErrorMessage } from '@/lib/api/coqui'
import type { Speaker } from '@/lib/api/coqui'

/**
 * GET /api/voice/speakers
 *
 * Get list of available TTS speakers from Modal Coqui API
 * Returns an array of speaker objects with id, name, language, and gender
 *
 * @returns Array of Speaker objects
 */
export async function GET() {
  try {
    // Call Modal API /speakers endpoint with retry logic
    const response = await callModalWithRetry(`${COQUI_API_BASE_URL}/speakers`)

    // Parse response
    const data = await response.json()

    // Handle the nested speakers array format: { speakers: ["name1", "name2", ...], count: 58 }
    let speakerNames: string[]

    if (data.speakers && Array.isArray(data.speakers)) {
      // New format: { speakers: [...] }
      speakerNames = data.speakers
    } else if (Array.isArray(data)) {
      // Old format: direct array
      speakerNames = data
    } else {
      throw new Error('Invalid response format: expected speakers array')
    }

    // Transform speaker names into Speaker objects
    const speakers: Speaker[] = speakerNames.map((name) => ({
      id: name, // Use name as ID (Modal API expects speaker name)
      name: name,
      language: 'en', // Default language
      gender: undefined, // Gender info not provided by API
    }))

    // Return speakers list
    return NextResponse.json(speakers)
  } catch (error) {
    console.error('Failed to fetch speakers:', error)

    // Return error response
    return NextResponse.json(
      {
        error: getUserFriendlyErrorMessage(error),
        speakers: [], // Return empty array as fallback
      },
      { status: 503 }
    )
  }
}
