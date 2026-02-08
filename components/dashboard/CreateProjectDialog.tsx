'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createProject } from '@/app/(app)/app/actions'

interface CreateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Create Project Dialog
 *
 * Modal for creating new projects
 */
export function CreateProjectDialog({ isOpen, onClose }: CreateProjectDialogProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a project title',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', title)

      const result = await createProject(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Project created',
        description: 'Your new project has been created successfully',
      })

      setTitle('')
      onClose()
      router.refresh()

      // Optionally navigate to the new project
      if ('project' in result && result.project) {
        router.push(`/app/projects/${result.project.id}`)
      }
    } catch (error) {
      console.error('Create project error:', error)
      toast({
        title: 'Failed to create project',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <Card className="w-full max-w-md bg-primary-300 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-secondary-700">
              Create New Project
            </h2>
            <p className="mt-1 text-sm text-secondary-500">
              Give your project a name to get started
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">
              Project Title
            </label>
            <Input
              type="text"
              placeholder="My Awesome Reel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="bg-primary-200 border-primary-500 rounded-xl"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
