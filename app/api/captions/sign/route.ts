/**
 * POST /api/captions/sign
 *
 * Generate a fresh signed URL for an ASS file in Supabase Storage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface SignCaptionsPayload {
  storagePath: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = (await req.json()) as SignCaptionsPayload
    if (!payload?.storagePath) {
      return NextResponse.json({ error: 'storagePath is required' }, { status: 400 })
    }

    const userPrefix = `projects/${user.id}/`
    const isUserPath = payload.storagePath.startsWith(userPrefix)
    const isOneoffPath = payload.storagePath.startsWith('projects/oneoff/')

    if (!isUserPath) {
      if (!isOneoffPath) {
        return NextResponse.json({ error: 'Invalid storage path' }, { status: 403 })
      }

      const parts = payload.storagePath.split('/')
      const sessionId = parts[2]
      if (!sessionId) {
        return NextResponse.json({ error: 'Invalid storage path' }, { status: 403 })
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (projectError || !project) {
        return NextResponse.json({ error: 'Invalid storage path' }, { status: 403 })
      }
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('projects')
      .createSignedUrl(payload.storagePath, 3600)

    if (urlError || !urlData?.signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL', details: urlError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ assUrl: urlData.signedUrl })
  } catch (error) {
    console.error('[Captions] Sign error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
