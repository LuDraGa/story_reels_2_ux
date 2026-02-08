'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Server Actions for Project Workspace
 */

export async function getProjectDetails(projectId: string) {
  const supabase = await createSupabaseServerClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Fetch project
  // @ts-ignore
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError) {
    return { error: 'Project not found' }
  }

  // Fetch latest script version
  // @ts-ignore
  const { data: scriptVersions } = await supabase
    .from('script_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)

  // Fetch latest audio asset
  // @ts-ignore
  const { data: audioAssets } = await supabase
    .from('audio_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)

  // Fetch latest video asset
  // @ts-ignore
  const { data: videoAssets } = await supabase
    .from('video_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)

  return {
    project,
    script: scriptVersions?.[0] || null,
    audio: audioAssets?.[0] || null,
    video: videoAssets?.[0] || null,
  }
}

export async function saveScript(projectId: string, text: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Calculate estimated duration (words / 150 wpm)
  const wordCount = text.trim().split(/\s+/).length
  const estimatedDurationSec = Math.ceil((wordCount / 150) * 60)

  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('script_versions')
    // @ts-ignore
    .insert({
      project_id: projectId,
      text,
      estimated_duration_sec: estimatedDurationSec,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Failed to save script' }
  }

  revalidatePath(`/app/projects/${projectId}`)
  return { success: true, script: data }
}

export async function saveAudioAsset(
  projectId: string,
  mode: string,
  speakerId: string | null,
  storagePath: string,
  durationSec: number | null
) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('audio_assets')
    // @ts-ignore
    .insert({
      project_id: projectId,
      mode,
      speaker_id: speakerId,
      storage_path: storagePath,
      duration_sec: durationSec,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Failed to save audio asset' }
  }

  revalidatePath(`/app/projects/${projectId}`)
  return { success: true, asset: data }
}

export async function saveVideoAsset(
  projectId: string,
  storagePath: string,
  backgroundAssetId: string | null = null
) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('video_assets')
    // @ts-ignore
    .insert({
      project_id: projectId,
      storage_path: storagePath,
      background_asset_id: backgroundAssetId,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Failed to save video asset' }
  }

  revalidatePath(`/app/projects/${projectId}`)
  return { success: true, asset: data }
}
