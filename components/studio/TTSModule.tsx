'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { Speaker, AudioResponse } from '@/lib/api/coqui'

interface TTSModuleProps {
  script: string
  sessionId: string
  audioUrl: string | null
  selectedSpeakerId: string | null
  onSpeakerSelect: (speakerId: string) => void
  onAudioGenerated: (audioUrl: string, storagePath: string) => void
}

/**
 * TTS Module - Step 3
 *
 * Generate audio from script using Modal Coqui TTS API
 */
export function TTSModule({
  script,
  sessionId,
  audioUrl,
  selectedSpeakerId,
  onSpeakerSelect,
  onAudioGenerated,
}: TTSModuleProps) {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Fetch speakers on mount (with 15-day localStorage cache)
  useEffect(() => {
    async function fetchSpeakers(forceRefresh: boolean = false) {
      setIsLoadingSpeakers(true)
      try {
        // Check localStorage cache first (only on client, after mount)
        if (!forceRefresh && typeof window !== 'undefined') {
          const cached = localStorage.getItem('tts_speakers_cache')
          if (cached) {
            try {
              const { data, timestamp } = JSON.parse(cached)
              const age = Date.now() - timestamp
              const fifteenDays = 15 * 24 * 60 * 60 * 1000 // 15 days in milliseconds

              // Use cache if less than 15 days old
              if (age < fifteenDays) {
                console.log(`Using cached speakers (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`)
                setSpeakers(data)

                // Auto-select first speaker if none selected
                if (!selectedSpeakerId && data.length > 0) {
                  onSpeakerSelect(data[0].id)
                }

                setIsLoadingSpeakers(false)
                return
              } else {
                console.log('Speaker cache expired (>15 days), fetching fresh data')
              }
            } catch (e) {
              console.warn('Failed to parse speaker cache, fetching fresh data')
            }
          }
        }

        // Fetch from API
        const response = await fetch('/api/voice/speakers')
        if (!response.ok) {
          throw new Error('Failed to fetch speakers')
        }
        const data = await response.json()
        setSpeakers(data)

        // Cache in localStorage with timestamp (only on client)
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'tts_speakers_cache',
            JSON.stringify({
              data,
              timestamp: Date.now(),
            })
          )
        }

        // Auto-select first speaker if none selected
        if (!selectedSpeakerId && data.length > 0) {
          onSpeakerSelect(data[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch speakers:', error)
        toast({
          title: 'Failed to load speakers',
          description: 'Please refresh the page to try again',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingSpeakers(false)
      }
    }

    fetchSpeakers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    if (!script || !selectedSpeakerId) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: script,
          speaker_id: selectedSpeakerId,
          language: 'en',
          sessionId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate audio')
      }

      const data: AudioResponse = await response.json()
      onAudioGenerated(data.audioUrl, data.storagePath)

      toast({
        title: 'Audio generated',
        description: 'Your voiceover is ready to preview',
      })
    } catch (error) {
      console.error('Failed to generate audio:', error)
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const isEmpty = script.trim() === ''
  const canGenerate = !isEmpty && selectedSpeakerId && !isGenerating

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>3. Text-to-Speech</CardTitle>
            <CardDescription>Generate voiceover from your script</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isEmpty ? (
              <span className="rounded-full bg-secondary-300 px-3 py-1 text-xs font-medium text-secondary-500">
                Idle
              </span>
            ) : isGenerating ? (
              <span className="rounded-full bg-accent-mist-blue/10 px-3 py-1 text-xs font-medium text-accent-mist-blue">
                Processing
              </span>
            ) : audioUrl ? (
              <span className="rounded-full bg-accent-sage/10 px-3 py-1 text-xs font-medium text-accent-sage">
                Ready
              </span>
            ) : (
              <span className="rounded-full bg-secondary-300 px-3 py-1 text-xs font-medium text-secondary-500">
                Idle
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty && (
          <div className="rounded-xl border border-secondary-300 bg-primary-200 p-4 text-center text-sm text-secondary-600">
            Save your script to generate audio
          </div>
        )}

        {!isEmpty && (
          <>
            {/* Speaker Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">
                Voice
              </label>
              {isLoadingSpeakers ? (
                <div className="rounded-xl border border-secondary-300 bg-primary-100 p-4 text-center text-sm text-secondary-500">
                  Loading voices...
                </div>
              ) : (
                <select
                  value={selectedSpeakerId || ''}
                  onChange={(e) => onSpeakerSelect(e.target.value)}
                  className="w-full rounded-xl border border-secondary-300 bg-primary-100 p-3 text-secondary-700 focus:border-accent-sage focus:outline-none focus:ring-2 focus:ring-accent-sage/20"
                >
                  <option value="">Select a voice</option>
                  {speakers.map((speaker) => (
                    <option key={speaker.id} value={speaker.id}>
                      {speaker.name}
                      {speaker.language && ` (${speaker.language})`}
                      {speaker.gender && ` - ${speaker.gender}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-100 border-t-transparent"></span>
                  Generating audio...
                </>
              ) : audioUrl ? (
                'Regenerate Audio'
              ) : (
                'Generate Audio'
              )}
            </Button>

            {/* Loading Message */}
            {isGenerating && (
              <div className="rounded-xl border border-accent-mist-blue/20 bg-accent-mist-blue/5 p-4 text-center text-sm text-secondary-600">
                <p className="font-medium text-accent-mist-blue">Generating your audio...</p>
                <p className="mt-1 text-xs text-secondary-500">
                  This may take 1-2 minutes. Please wait.
                </p>
              </div>
            )}

            {/* Audio Preview */}
            {audioUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">
                  Preview
                </label>
                <audio
                  controls
                  src={audioUrl}
                  className="w-full rounded-xl"
                  preload="metadata"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
