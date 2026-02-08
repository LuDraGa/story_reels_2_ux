import { NextResponse } from 'next/server'
import { COQUI_API_BASE_URL, callModalWithRetry, getUserFriendlyErrorMessage } from '@/lib/api/coqui'
import type { ApiInfoResponse } from '@/lib/api/coqui'

/**
 * GET /api/voice/api-info
 *
 * Get API information from Modal Coqui TTS API
 * Returns details about available endpoints and capabilities
 *
 * @returns ApiInfoResponse JSON
 */
export async function GET() {
  try {
    // Call Modal API /api-info endpoint with retry logic
    const response = await callModalWithRetry(`${COQUI_API_BASE_URL}/api-info`)

    // Parse response
    const data = await response.json()

    // Return API info
    return NextResponse.json(data as ApiInfoResponse)
  } catch (error) {
    console.error('API info request failed:', error)

    // Return error response
    return NextResponse.json(
      {
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 503 }
    )
  }
}
