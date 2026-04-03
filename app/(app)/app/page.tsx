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

export default function AppPage() {
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

  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProjects()
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProjects()
      } else {
        setProjects([])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProjects = async () => {
    setIsLoadingProjects(true)
    try {
      const result = await getProjects()
      if (!result.error) setProjects(result.projects)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Studio Header */}
      <div className="text-center space-y-3">
        <h1 className="font-display text-5xl font-bold text-secondary-700 tracking-tight">
          Reel Story Studio
        </h1>
        <p className="font-sans text-lg text-secondary-500 leading-relaxed">
          Create engaging voiceovers with AI-powered text-to-speech.
          {!user && (
            <>
              <br />
              <span className="text-sm">No login required — your work is saved locally.</span>
            </>
          )}
        </p>
      </div>

      {/* Studio Pipeline */}
      <div className="space-y-6">
        <IngestModule
          sourceText={state.sourceText}
          onSave={updateSourceText}
        />
        <ScriptModule
          script={state.script}
          onSave={updateScript}
        />
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
        <ExportModule
          audioUrl={state.audioUrl}
          videoUrl={state.videoUrl}
        />
      </div>

      {/* Projects Section */}
      {user ? (
        <div className="space-y-6 border-t border-primary-500 pt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-secondary-700">
                Your Projects
              </h2>
              <p className="text-secondary-500 text-sm mt-1">
                Saved project pipelines
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="rounded-xl px-5"
            >
              + New Project
            </Button>
          </div>

          {isLoadingProjects && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-36 animate-pulse bg-primary-300" />
              ))}
            </div>
          )}

          {!isLoadingProjects && projects.length === 0 && (
            <Card className="bg-primary-300 border-primary-500 rounded-2xl p-8 text-center">
              <p className="text-secondary-500 text-sm">
                No projects yet.{' '}
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="text-accent-sage font-medium hover:underline underline-offset-2"
                >
                  Create your first project
                </button>
              </p>
            </Card>
          )}

          {!isLoadingProjects && projects.length > 0 && (
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
      ) : (
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
      )}
    </div>
  )
}
