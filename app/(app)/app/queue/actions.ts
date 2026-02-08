'use server'

import { getAllJobs, retryJob as retryJobUtil } from '@/lib/api/jobs'

export async function getJobs() {
  try {
    const jobs = await getAllJobs()
    return { jobs }
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      jobs: [],
    }
  }
}

export async function retryJob(jobId: string) {
  try {
    const job = await retryJobUtil(jobId)

    if (!job) {
      return { error: 'Failed to retry job' }
    }

    return { success: true, job }
  } catch (error) {
    console.error('Failed to retry job:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to retry job',
    }
  }
}
