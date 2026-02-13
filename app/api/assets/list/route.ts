/**
 * GET /api/assets/list
 *
 * List background video or music assets
 *
 * Query parameters:
 * - type: 'video' | 'audio' | 'all' (default: 'all')
 * - tag: filter by tag (optional)
 * - limit: max number of results (default: 50)
 *
 * Returns assets owned by the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// ============================================================================
// Types
// ============================================================================

interface Asset {
  id: string
  storage_path: string
  public_url: string
  file_name: string
  file_type: 'video' | 'audio'
  duration_sec: number | null
  width: number | null
  height: number | null
  file_size_mb: number
  tags: string[]
  created_at: string
}

interface ListResponse {
  assets: Asset[]
  total: number
  type: string
  tag?: string
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function GET(req: NextRequest) {
  console.log('[Assets] List request started')

  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[Assets] Unauthorized - user not logged in')
      return NextResponse.json(
        { error: 'Authentication required to list assets' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('[Assets] Query params:', { type, tag, limit })

    // Build query
    let query = supabase
      .from('background_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by type
    if (type !== 'all') {
      query = query.eq('file_type', type)
    }

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data: assets, error } = await query

    if (error) {
      console.error('[Assets] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assets', details: error.message },
        { status: 500 }
      )
    }

    console.log('[Assets] Found', assets?.length || 0, 'assets')

    // Get signed URLs for all assets
    const assetsWithUrls = await Promise.all(
      (assets || []).map(async (asset) => {
        // Create signed URL (1 year expiry)
        // Use the 'backgrounds' bucket for background_assets table
        // @ts-ignore
        const { data: urlData, error: urlError } = await supabase.storage
          .from('backgrounds')
          // @ts-ignore
          .createSignedUrl(asset.storage_path, 31536000) // 1 year

        if (urlError) {
          // @ts-ignore
          console.error(`[Assets] Failed to create signed URL for ${asset.storage_path}:`, urlError)
        }

        return {
          // @ts-ignore
          id: asset.id,
          // @ts-ignore
          storage_path: asset.storage_path,
          public_url: urlData?.signedUrl || '',
          // @ts-ignore
          file_name: asset.file_name,
          // @ts-ignore
          file_type: asset.file_type,
          // @ts-ignore
          duration_sec: asset.duration_sec,
          // @ts-ignore
          width: asset.width,
          // @ts-ignore
          height: asset.height,
          // @ts-ignore
          file_size_mb: asset.file_size_mb,
          // @ts-ignore
          tags: asset.tags || [],
          // @ts-ignore
          created_at: asset.created_at,
        }
      })
    )

    // Filter out assets with empty URLs (failed signed URL creation)
    const validAssets = assetsWithUrls.filter(asset => asset.public_url && asset.public_url.length > 0)

    console.log('[Assets] Returning', validAssets.length, 'valid assets (', assetsWithUrls.length - validAssets.length, 'failed)')

    const response: ListResponse = {
      assets: validAssets,
      total: validAssets.length,
      type,
      tag: tag || undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Assets] List error:', error)
    return NextResponse.json(
      {
        error: 'Failed to list assets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
