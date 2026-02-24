'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getAssets() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', assets: [] }
  }

  // Fetch user's background assets
  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('background_assets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching assets:', error)
    return { error: 'Failed to fetch assets', assets: [] }
  }

  // Generate public URLs for each asset
  const assetsWithUrls = (data || []).map((asset: any) => {
    const { data: urlData } = supabase.storage
      .from('backgrounds')
      .getPublicUrl(asset.storage_path)

    return {
      ...asset,
      public_url: urlData.publicUrl,
    }
  })

  return { assets: assetsWithUrls }
}

export async function createAsset(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const title = formData.get('title') as string
  const tags = formData.get('tags') as string
  const file = formData.get('file') as File

  if (!title || !file) {
    return { error: 'Title and file are required' }
  }

  try {
    // Determine file type from MIME type
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')
    const fileType = isVideo ? 'video' : isAudio ? 'audio' : 'video' // Default to video for legacy compatibility
    const fileSizeMB = file.size / 1024 / 1024

    // Upload file to Supabase Storage
    // Sanitize filename: remove special characters, spaces, keep only alphanumeric, hyphens, underscores
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace invalid chars with underscore
      .substring(0, 50) // Limit length

    const fileName = `${timestamp}_${sanitizedName}.${fileExtension}`
    const storagePath = `backgrounds/${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('backgrounds')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Failed to upload file' }
    }

    // Get public URL (use signed URL for probing)
    const {
      data: { publicUrl },
    } = supabase.storage.from('backgrounds').getPublicUrl(storagePath)

    // Get signed URL for probing
    const { data: signedUrlData } = await supabase.storage
      .from('backgrounds')
      .createSignedUrl(storagePath, 60) // 1 minute for probing

    // Probe video metadata if it's a video
    let duration_sec: number | null = null
    let width: number | null = null
    let height: number | null = null

    if (isVideo && signedUrlData?.signedUrl) {
      try {
        console.log('[Assets] Probing video metadata...')
        const { probeVideo } = await import('@/lib/api/ffmpeg')
        const probe = await probeVideo(signedUrlData.signedUrl)
        duration_sec = probe.duration_sec
        width = probe.width
        height = probe.height
        console.log('[Assets] Probe successful:', { duration_sec, width, height })
      } catch (error) {
        console.error('[Assets] Failed to probe video:', error)
        // Continue without metadata
      }
    }

    // Create database record
    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    // @ts-ignore - Supabase type inference issue
    const { data: asset, error: dbError } = await supabase
      .from('background_assets')
      // @ts-ignore
      .insert({
        user_id: user.id,
        name: title.trim(), // Column is 'name' not 'title'
        file_name: file.name, // Original filename
        file_type: fileType, // 'video' or 'audio'
        storage_path: storagePath,
        file_size_mb: fileSizeMB,
        duration_sec: duration_sec,
        width: width,
        height: height,
        tags: tagsArray,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('backgrounds').remove([storagePath])
      return { error: 'Failed to save asset' }
    }

    revalidatePath('/app/assets')
    return { success: true, asset }
  } catch (error) {
    console.error('Create asset error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to create asset',
    }
  }
}

export async function deleteAsset(assetId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Get asset to find storage path
    // @ts-ignore - Supabase type inference issue
    const { data: asset } = await supabase
      .from('background_assets')
      .select('storage_path')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (!asset) {
      return { error: 'Asset not found' }
    }

    // Delete from storage
    // @ts-ignore
    const storagePath = asset.storage_path
    await supabase.storage.from('backgrounds').remove([storagePath])

    // Delete from database
    // @ts-ignore - Supabase type inference issue
    const { error } = await supabase
      .from('background_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete error:', error)
      return { error: 'Failed to delete asset' }
    }

    revalidatePath('/app/assets')
    return { success: true }
  } catch (error) {
    console.error('Delete asset error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to delete asset',
    }
  }
}

export async function updateAssetTags(assetId: string, tags: string[]) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // @ts-ignore - Supabase type inference issue
  const { error } = await supabase
    .from('background_assets')
    // @ts-ignore
    .update({ tags })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Update tags error:', error)
    return { error: 'Failed to update tags' }
  }

  revalidatePath('/app/assets')
  return { success: true }
}
