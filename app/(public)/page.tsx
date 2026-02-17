'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStudioState } from '@/hooks/useStudioState'
import { IngestModule } from '@/components/studio/IngestModule'
import { ScriptModule } from '@/components/studio/ScriptModule'
import { TTSModule } from '@/components/studio/TTSModule'
import { VideoModule } from '@/components/studio/VideoModule'
import { ExportModule } from '@/components/studio/ExportModule'

export default function Home() {
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
    <main className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-display text-5xl font-bold text-secondary-700 tracking-tight">
            Reel Story Studio
          </h1>
          <p className="font-sans text-lg text-secondary-500 leading-relaxed">
            Create engaging voiceovers with AI-powered text-to-speech.
            <br />
            No login required - your work is saved locally.
          </p>
        </div>

        {/* Pipeline Modules */}
        <div className="space-y-6">
          {/* Module 1: Ingest */}
          <IngestModule
            sourceText={state.sourceText}
            onSave={updateSourceText}
          />

          {/* Module 2: Script */}
          <ScriptModule
            script={state.script}
            onSave={updateScript}
          />

          {/* Module 3: TTS */}
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

          {/* Module 4: Video */}
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

          {/* Module 5: Export */}
          <ExportModule
            audioUrl={state.audioUrl}
            videoUrl={state.videoUrl}
          />
        </div>

        {/* Auth CTA */}
        <Card className="bg-gradient-to-br from-accent-lavender/5 to-accent-mist-blue/5 border-accent-lavender/20 rounded-2xl shadow-sm p-6">
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
    </main>
  )
}
