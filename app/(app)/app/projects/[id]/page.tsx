'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { IngestModule } from '@/components/studio/IngestModule'
import { ScriptModule } from '@/components/studio/ScriptModule'
import { TTSModule } from '@/components/studio/TTSModule'
import { VideoModule } from '@/components/studio/VideoModule'
import { ExportModule } from '@/components/studio/ExportModule'
import { getProjectDetails, saveScript, saveAudioAsset } from './actions'

interface ProjectWorkspaceProps {
  params: { id: string }
}

export default function ProjectPage({ params }: ProjectWorkspaceProps) {
  const projectId = params.id
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sourceText, setSourceText] = useState('')
  const [script, setScript] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState<string | null>(null)
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  // Caption state
  const [srtUrl, setSrtUrl] = useState<string | null>(null)
  const [assUrl, setAssUrl] = useState<string | null>(null)
  const [assPath, setAssPath] = useState<string | null>(null)
  const [captionStyle, setCaptionStyle] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok')
  const [captionMetadata, setCaptionMetadata] = useState<any>(null)
  // Asset selection state
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    setIsLoading(true)
    try {
      const result = await getProjectDetails(projectId)

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      setProject(result.project)
      // @ts-ignore - Supabase type inference issue
      if (result.script) {
        // @ts-ignore
        setScript(result.script.text)
        // @ts-ignore
        setSourceText(result.script.text)
      }
      // @ts-ignore
      if (result.audio) {
        // Get audio URL from Supabase Storage
        // @ts-ignore
        const audioPath = result.audio.storage_path
        const audioSignedUrl = result.audio.signedUrl
        // TODO: Generate public URL from storage path
        // For now, we'll use the storage path as-is
        setStoragePath(audioPath)
        if (audioSignedUrl) {
          setAudioUrl(audioSignedUrl)
        }
      }
      // @ts-ignore
      if (result.video) {
        // @ts-ignore
        const videoPath = result.video.storage_path
        const videoSignedUrl = result.video.signedUrl
        // TODO: Generate public URL
        setVideoUrl(videoSignedUrl || videoPath)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveScript = async (text: string) => {
    setScript(text)
    const result = await saveScript(projectId, text)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const handleAudioGenerated = async (url: string, path: string) => {
    setAudioUrl(url)
    setStoragePath(path)

    // Save to database
    await saveAudioAsset(projectId, 'speaker', selectedSpeakerId, path, null)
  }

  const handleVideoGenerated = (url: string) => {
    setVideoUrl(url)
    // TODO: Save video asset to database
  }

  const handleCaptionsGenerated = (
    srt: string,
    transcription: string,
    ass: string,
    metadata?: any,
    newAssPath?: string | null
  ) => {
    setSrtUrl(srt)
    setAssUrl(ass)
    setAssPath(newAssPath || null)
    setCaptionMetadata(metadata)
    // TODO: Save caption assets to database
  }

  const handleCaptionStyleChange = (style: 'tiktok' | 'instagram' | 'youtube') => {
    setCaptionStyle(style)
  }

  const handleSourceTextSave = (text: string) => {
    setSourceText(text)
    // Auto-copy to script if script is empty (same as one-off studio)
    if (script === '') {
      setScript(text)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-24 rounded-2xl bg-primary-300 animate-pulse" />
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-primary-300 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <Card className="p-12 text-center">
        <p className="text-secondary-600">Project not found</p>
        <Link href="/app">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/app" className="text-secondary-500 hover:text-secondary-700">
              ← Back
            </Link>
          </div>
          <h1 className="font-display text-4xl font-bold text-secondary-700 tracking-tight">
            {project.title}
          </h1>
          <p className="text-secondary-500 mt-2">
            Modular pipeline: Ingest → Script → TTS → Video → Export
          </p>
        </div>
        <div className="flex gap-3">
          <span className={`rounded-full px-4 py-2 text-sm font-medium ${
            project.status === 'draft' ? 'bg-secondary-300 text-secondary-600' :
            project.status === 'processing' ? 'bg-accent-mist-blue/10 text-accent-mist-blue' :
            'bg-accent-sage/10 text-accent-sage'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Pipeline Modules */}
      <div className="space-y-6">
        {/* Module 1: Ingest */}
        <IngestModule
          sourceText={sourceText}
          onSave={handleSourceTextSave}
        />

        {/* Module 2: Script */}
        <ScriptModule
          script={script}
          onSave={handleSaveScript}
        />

        {/* Module 3: TTS */}
        <TTSModule
          script={script}
          sessionId={projectId} // Use projectId as sessionId for storage paths
          projectId={projectId}
          audioUrl={audioUrl}
          selectedSpeakerId={selectedSpeakerId}
          onSpeakerSelect={setSelectedSpeakerId}
          onAudioGenerated={handleAudioGenerated}
          srtUrl={srtUrl}
          assUrl={assUrl}
          captionStyle={captionStyle}
          captionMetadata={captionMetadata}
          onCaptionsGenerated={handleCaptionsGenerated}
          onCaptionStyleChange={handleCaptionStyleChange}
        />

        {/* Module 4: Video */}
        <VideoModule
          audioUrl={audioUrl}
          assUrl={assUrl}
          assPath={assPath}
          videoUrl={videoUrl}
          selectedVideos={selectedVideos}
          selectedMusic={selectedMusic}
          projectId={projectId}
          onAssUrlChange={setAssUrl}
          onVideoGenerated={handleVideoGenerated}
          onVideoSelect={setSelectedVideos}
          onMusicSelect={setSelectedMusic}
        />

        {/* Module 5: Export */}
        <ExportModule
          audioUrl={audioUrl}
          videoUrl={videoUrl}
        />
      </div>

      {/* TODO Note */}
      <Card className="bg-accent-lavender/5 border-accent-lavender/20 p-6">
        <p className="text-sm text-secondary-600">
          <strong className="text-accent-lavender">Note:</strong> Project data is saved to Supabase database.
          Script versions, audio assets, and video assets are stored with full version history.
        </p>
      </Card>
    </div>
  )
}
