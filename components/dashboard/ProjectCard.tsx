'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { deleteProject } from '@/app/(app)/app/actions'

interface ProjectCardProps {
  id: string
  title: string
  status: string
  createdAt: string
}

/**
 * Project Card Component
 *
 * Displays project info with actions (open, delete)
 */
export function ProjectCard({ id, title, status, createdAt }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteProject(id)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Project deleted',
        description: 'Your project has been deleted successfully',
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Failed to delete',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }

  const statusColor = {
    draft: 'bg-secondary-400 text-secondary-600',
    processing: 'bg-accent-mist-blue/10 text-accent-mist-blue',
    ready: 'bg-accent-sage/10 text-accent-sage',
  }[status] || 'bg-secondary-300 text-secondary-500'

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">Created {formattedDate}</CardDescription>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}>
            {status}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Link href={`/app/projects/${id}`} className="flex-1">
            <Button className="w-full">Open Project</Button>
          </Link>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
