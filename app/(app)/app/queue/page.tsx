'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getJobs, retryJob as retryJobAction } from './actions'

interface Job {
  id: string
  project_id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress_percent: number | null
  error_message: string | null
  output_storage_path: string | null
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
}

export default function QueuePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadJobs()
  }, [])

  // Poll for running jobs
  useEffect(() => {
    const hasRunningJobs = jobs.some(
      (job) => job.status === 'running' || job.status === 'pending'
    )

    if (!hasRunningJobs) return

    const interval = setInterval(() => {
      loadJobs()
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [jobs])

  const loadJobs = async () => {
    try {
      const result = await getJobs()

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      setJobs(result.jobs)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async (jobId: string) => {
    const result = await retryJobAction(jobId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Job requeued',
      description: 'The job has been added back to the queue',
    })

    loadJobs()
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-24 rounded-2xl bg-primary-300 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-primary-300 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold text-secondary-700 tracking-tight">
          Render Queue
        </h1>
        <p className="text-secondary-500 mt-2">
          Monitor your video rendering jobs and their progress
        </p>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card className="p-12 text-center bg-primary-300 border-primary-500/20">
          <div className="max-w-md mx-auto">
            <p className="text-lg text-secondary-700 mb-2">No render jobs yet</p>
            <p className="text-secondary-500 mb-6">
              Render jobs will appear here when you generate videos from your projects
            </p>
            <Link href="/app">
              <Button className="rounded-xl">Go to Projects</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onRetry={handleRetry} />
          ))}
        </div>
      )}
    </div>
  )
}

interface JobCardProps {
  job: Job
  onRetry: (jobId: string) => void
}

function JobCard({ job, onRetry }: JobCardProps) {
  const statusConfig = {
    pending: {
      color: 'bg-secondary-300 text-secondary-600',
      label: 'Pending',
    },
    running: {
      color: 'bg-accent-mist-blue/10 text-accent-mist-blue',
      label: 'Running',
    },
    completed: {
      color: 'bg-accent-sage/10 text-accent-sage',
      label: 'Completed',
    },
    failed: {
      color: 'bg-red-100 text-red-600',
      label: 'Failed',
    },
  }

  const config = statusConfig[job.status]
  const progress = job.progress_percent || 0

  return (
    <Card className="p-6 bg-primary-300 border-primary-500/20">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-secondary-700">
                Render Job
              </h3>
              <p className="text-sm text-secondary-500 mt-1">
                ID: {job.id.slice(0, 8)}...
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-sm font-medium ${config.color}`}
            >
              {config.label}
            </span>
          </div>

          {/* Progress Bar (for running jobs) */}
          {job.status === 'running' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-600">Progress</span>
                <span className="font-medium text-secondary-700">{progress}%</span>
              </div>
              <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-sage transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message (for failed jobs) */}
          {job.status === 'failed' && job.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {job.error_message}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-secondary-500">Created</span>
              <p className="text-secondary-700 font-medium">
                {new Date(job.created_at).toLocaleString()}
              </p>
            </div>
            {job.completed_at && (
              <div>
                <span className="text-secondary-500">Completed</span>
                <p className="text-secondary-700 font-medium">
                  {new Date(job.completed_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href={`/app/projects/${job.project_id}`}>
              <Button variant="outline" className="rounded-xl">
                View Project
              </Button>
            </Link>
            {job.status === 'failed' && (
              <Button
                onClick={() => onRetry(job.id)}
                className="rounded-xl bg-accent-lavender hover:bg-accent-lavender/90"
              >
                Retry Job
              </Button>
            )}
            {job.status === 'completed' && job.output_storage_path && (
              <Button className="rounded-xl bg-accent-sage hover:bg-accent-sage/90">
                Download Video
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
