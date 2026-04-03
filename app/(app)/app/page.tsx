'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStudioState } from '@/hooks/useStudioState'
import { IngestModule } from '@/components/studio/IngestModule'
import { ScriptModule } from '@/components/studio/ScriptModule'
import { TTSModule } from '@/components/studio/TTSModule'
import { VideoModule } from '@/components/studio/VideoModule'
import { ExportModule } from '@/components/studio/ExportModule'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getProjects } from './actions'
import type { User } from '@supabase/supabase-js'

interface Project {
  id: string
  title: string
  status: string
  created_at: string
}

// ─── Logged-in: Projects Dashboard ───────────────────────────────────────────

function ProjectsDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const result = await getProjects()
      if (!result.error) setProjects(result.projects)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadProjects() }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-secondary-700 tracking-tight">
            Projects
          </h1>
          <p className="text-secondary-500 mt-2">
            Manage your reel projects and workflows
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl px-6 py-3">
          + New Project
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-primary-300" />
          ))}
        </div>
      )}

      {!isLoading && projects.length === 0 && (
        <Card className="bg-primary-300 border-primary-500 rounded-2xl shadow-md p-12">
          <div className="text-center space-y-4">
            <div className="text-secondary-400 text-6xl">📽️</div>
            <div className="space-y-2">
              <h3 className="font-display text-xl font-semibold text-secondary-700">
                No projects yet
              </h3>
              <p className="text-secondary-500 text-sm max-w-md mx-auto">
                Create your first project to start building engaging short-form video reels.
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl px-6 py-3 mt-4">
              Create First Project
            </Button>
          </div>
        </Card>
      )}

      {!isLoading && projects.length > 0 && (
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

      <CreateProjectDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          loadProjects()
        }}
      />
    </div>
  )
}

// ─── Not logged in: One-off Studio ───────────────────────────────────────────

function Studio() {
  const {
    state,
    updateSourceText,
    updateScript,
    updateSelectedSpeaker,
    updateAudio,
    updateVideo,
    updateCaptions,
    updateCaptionStyle,
    updateSelectedVideos,
    updateSelectedMusic,
  } = useStudioState()

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h1 className="font-display text-5xl font-bold text-secondary-700 tracking-tight">
          Reel Story Studio
        </h1>
        <p className="font-sans text-lg text-secondary-500 leading-relaxed">
          Create engaging voiceovers with AI-powered text-to-speech.
          <br />
          <span className="text-sm">No login required — your work is saved locally.</span>
        </p>
      </div>

      <div className="space-y-6">
        <IngestModule sourceText={state.sourceText} onSave={updateSourceText} />
        <ScriptModule script={state.script} onSave={updateScript} />
        <TTSModule
          script={state.script}
          sessionId={state.sessionId}
          projectId={undefined}
          audioUrl={state.audioUrl}
          selectedSpeakerId={state.selectedSpeakerId}
          onSpeakerSelect={updateSelectedSpeaker}
          onAudioGenerated={updateAudio}
          srtUrl={state.srtUrl}
          assUrl={state.assUrl}
          captionStyle={state.captionStyle}
          captionMetadata={state.captionMetadata}
          onCaptionsGenerated={updateCaptions}
          onCaptionStyleChange={updateCaptionStyle}
        />
        <VideoModule
          audioUrl={state.audioUrl}
          assUrl={state.assUrl}
          assPath={state.assPath}
          videoUrl={state.videoUrl}
          selectedVideos={state.selectedVideos}
          selectedMusic={state.selectedMusic}
          onVideoGenerated={updateVideo}
          onVideoSelect={updateSelectedVideos}
          onMusicSelect={updateSelectedMusic}
        />
        <ExportModule audioUrl={state.audioUrl} videoUrl={state.videoUrl} />
      </div>

      <Card className="bg-gradient-to-br from-accent-lavender/5 to-accent-mist-blue/5 border-accent-lavender/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-secondary-700 mb-1">
              Want to save multiple projects?
            </h3>
            <p className="text-secondary-500 text-sm">
              Sign in to access your dashboard and manage unlimited projects.
            </p>
          </div>
          <Link href="/login">
            <Button
              variant="outline"
              className="border-accent-lavender text-accent-lavender hover:bg-accent-lavender/10 rounded-xl whitespace-nowrap"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

// ─── Page: switches based on auth ────────────────────────────────────────────

export default function AppPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Loading — avoid flash of wrong view
  if (user === undefined) return null

  return user ? <ProjectsDashboard /> : <Studio />
}
