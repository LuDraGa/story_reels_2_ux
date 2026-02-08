'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog'
import { getProjects } from './actions'

interface Project {
  id: string
  title: string
  status: string
  created_at: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const result = await getProjects()
      if (!result.error) {
        setProjects(result.projects)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasProjects = projects.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-secondary-700 tracking-tight">
            Projects
          </h1>
          <p className="text-secondary-500 mt-2">
            Manage your reel projects and workflows
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="rounded-xl px-6 py-3"
        >
          + New Project
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-primary-300" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasProjects && (
        <Card className="bg-primary-300 border-primary-500 rounded-2xl shadow-md p-12">
          <div className="text-center space-y-4">
            <div className="text-secondary-400 text-6xl">📽️</div>
            <div className="space-y-2">
              <h3 className="font-display text-xl font-semibold text-secondary-700">
                No projects yet
              </h3>
              <p className="text-secondary-500 text-sm max-w-md mx-auto">
                Create your first project to start building engaging short-form video reels with AI-powered audio.
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="rounded-xl px-6 py-3 mt-4"
            >
              Create First Project
            </Button>
          </div>
        </Card>
      )}

      {/* Projects Grid */}
      {!isLoading && hasProjects && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              status={project.status}
              createdAt={project.created_at}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          loadProjects() // Refresh projects after creating
        }}
      />
    </div>
  )
}
