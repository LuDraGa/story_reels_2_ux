'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Server Actions for Dashboard
 *
 * These handle project CRUD operations
 */

export async function createProject(formData: FormData) {
  const title = formData.get('title') as string

  if (!title || title.trim() === '') {
    return { error: 'Project title is required' }
  }

  const supabase = await createSupabaseServerClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to create a project' }
  }

  // Create project
  const { data, error } = await supabase
    .from('projects')
    // @ts-ignore - Supabase type inference issue with generated types
    .insert({
      user_id: user.id,
      title: title.trim(),
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    return { error: 'Failed to create project', success: false }
  }

  revalidatePath('/app')
  return { success: true, project: data as any }
}

export async function deleteProject(projectId: string) {
  const supabase = await createSupabaseServerClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Delete project (cascade will handle related records)
  // @ts-ignore - Supabase type inference issue
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id) // Ensure user owns the project

  if (error) {
    console.error('Error deleting project:', error)
    return { error: 'Failed to delete project' }
  }

  revalidatePath('/app')
  return { success: true }
}

export async function getProjects() {
  const supabase = await createSupabaseServerClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in', projects: [] }
  }

  // Fetch user's projects
  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return { error: 'Failed to fetch projects', projects: [] }
  }

  return { projects: data || [] }
}
