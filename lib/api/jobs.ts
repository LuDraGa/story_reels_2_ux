/**
 * Job Queue Utilities
 *
 * Handles video rendering job creation, polling, and management
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface Job {
  id: string
  project_id: string
  type: 'render'
  status: JobStatus
  progress_percent: number | null
  error_message: string | null
  output_storage_path: string | null
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
}

export interface CreateJobParams {
  project_id: string
  type: 'render'
}

export interface UpdateJobParams {
  status?: JobStatus
  progress_percent?: number
  error_message?: string | null
  output_storage_path?: string | null
  started_at?: string | null
  completed_at?: string | null
}

/**
 * Create a new job in the queue
 */
export async function createJob(params: CreateJobParams): Promise<Job | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('jobs')
    // @ts-ignore
    .insert({
      project_id: params.project_id,
      type: params.type,
      status: 'pending',
      progress_percent: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create job:', error)
    return null
  }

  return data as Job
}

/**
 * Get a job by ID
 */
export async function getJob(jobId: string): Promise<Job | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    console.error('Failed to fetch job:', error)
    return null
  }

  return data as Job
}

/**
 * Get all jobs for the current user
 */
export async function getAllJobs(): Promise<Job[]> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get all projects for the user first
  // @ts-ignore
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)

  if (!projects || projects.length === 0) {
    return []
  }

  const projectIds = projects.map((p: any) => p.id)

  // Get jobs for these projects
  // @ts-ignore
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch jobs:', error)
    return []
  }

  return (data || []) as Job[]
}

/**
 * Update a job's status and metadata
 */
export async function updateJob(
  jobId: string,
  updates: UpdateJobParams
): Promise<Job | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('jobs')
    // @ts-ignore
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update job:', error)
    return null
  }

  return data as Job
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<Job | null> {
  return updateJob(jobId, {
    status: 'pending',
    progress_percent: 0,
    error_message: null,
    started_at: null,
    completed_at: null,
  })
}

/**
 * Simulate video rendering (stub for MVP)
 * In production, this would call FFmpeg API or processing queue
 */
export async function processRenderJob(jobId: string): Promise<void> {
  // Start the job
  await updateJob(jobId, {
    status: 'running',
    started_at: new Date().toISOString(),
    progress_percent: 0,
  })

  try {
    // Simulate rendering steps with progress
    const steps = [
      { progress: 20, delay: 1000, message: 'Loading assets...' },
      { progress: 40, delay: 1500, message: 'Processing audio...' },
      { progress: 60, delay: 2000, message: 'Rendering video...' },
      { progress: 80, delay: 1500, message: 'Adding effects...' },
      { progress: 100, delay: 1000, message: 'Finalizing...' },
    ]

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay))
      await updateJob(jobId, {
        progress_percent: step.progress,
      })
    }

    // Complete the job
    const outputPath = `projects/rendered/${jobId}/output_${Date.now()}.mp4`

    await updateJob(jobId, {
      status: 'completed',
      progress_percent: 100,
      output_storage_path: outputPath,
      completed_at: new Date().toISOString(),
    })
  } catch (error) {
    // Mark as failed
    await updateJob(jobId, {
      status: 'failed',
      error_message:
        error instanceof Error ? error.message : 'Unknown error occurred',
      completed_at: new Date().toISOString(),
    })
  }
}
