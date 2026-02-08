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

  return { assets: data || [] }
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
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`
    const storagePath = `backgrounds/${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('projects')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Failed to upload file' }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('projects').getPublicUrl(storagePath)

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
        title: title.trim(),
        storage_path: storagePath,
        tags: tagsArray,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('projects').remove([storagePath])
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
    await supabase.storage.from('projects').remove([storagePath])

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
