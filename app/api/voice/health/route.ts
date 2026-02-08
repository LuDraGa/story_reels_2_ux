import { NextResponse } from 'next/server'
import { COQUI_API_BASE_URL, callModalWithRetry, getUserFriendlyErrorMessage } from '@/lib/api/coqui'
import type { HealthResponse } from '@/lib/api/coqui'

/**
 * GET /api/voice/health
 *
 * Health check endpoint for Modal Coqui TTS API
 * Returns the health status of the external TTS service
 *
 * @returns HealthResponse JSON
 */
export async function GET() {
  try {
    // Call Modal API /health endpoint with retry logic
    const response = await callModalWithRetry(`${COQUI_API_BASE_URL}/health`)

    // Parse response
    const data = await response.json()

    // Return health status
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ...data,
    } as HealthResponse)
  } catch (error) {
    console.error('Health check failed:', error)

    // Return degraded status with user-friendly message
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: getUserFriendlyErrorMessage(error),
      } as HealthResponse,
      { status: 503 }
    )
  }
}
