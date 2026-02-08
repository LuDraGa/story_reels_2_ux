'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * One-Off Studio State
 *
 * Manages state for the one-off studio (no login required)
 * Persists to localStorage for session continuity
 */
export interface StudioState {
  sessionId: string // Unique session identifier (persists across reloads)
  sourceText: string // Raw input text from Ingest module
  script: string // Edited script text
  audioUrl: string | null // Supabase Storage URL for generated audio
  storagePath: string | null // Storage path in Supabase
  selectedSpeakerId: string | null // Selected TTS speaker ID
  videoUrl: string | null // Video URL (stub for now)
}

const STORAGE_KEY = 'reel-studio-state'

/**
 * Generate a new session ID
 */
function generateSessionId(): string {
  return crypto.randomUUID()
}

/**
 * Load state from localStorage
 */
function loadStateFromStorage(): StudioState | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    return parsed as StudioState
  } catch (error) {
    console.error('Failed to load studio state from localStorage:', error)
    return null
  }
}

/**
 * Save state to localStorage
 */
function saveStateToStorage(state: StudioState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save studio state to localStorage:', error)
  }
}

/**
 * Get initial state (empty state for SSR, populated from localStorage on client)
 *
 * IMPORTANT: Returns consistent empty state for both server and initial client render
 * to avoid hydration mismatches. localStorage is loaded in useEffect after hydration.
 */
function getInitialState(): StudioState {
  // Return empty state - will be populated from localStorage in useEffect
  return {
    sessionId: '', // Will be generated or loaded after mount
    sourceText: '',
    script: '',
    audioUrl: null,
    storagePath: null,
    selectedSpeakerId: null,
    videoUrl: null,
  }
}

/**
 * Hook for managing one-off studio state with localStorage persistence
 *
 * @returns Studio state and update functions
 */
export function useStudioState() {
  const [state, setState] = useState<StudioState>(getInitialState)
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after mount (avoid hydration mismatch)
  useEffect(() => {
    const stored = loadStateFromStorage()

    if (stored) {
      // Load existing session from localStorage
      setState(stored)
    } else if (!state.sessionId) {
      // Generate new sessionId only on client
      setState(prev => ({
        ...prev,
        sessionId: generateSessionId()
      }))
    }

    setIsHydrated(true)
  }, []) // Run once on mount

  // Save to localStorage whenever state changes (but only after hydration)
  useEffect(() => {
    if (isHydrated && state.sessionId) {
      saveStateToStorage(state)
    }
  }, [state, isHydrated])

  // Update source text (from Ingest module)
  const updateSourceText = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      sourceText: text,
      // Auto-copy to script if script is empty
      script: prev.script === '' ? text : prev.script,
    }))
  }, [])

  // Update script (from Script module)
  const updateScript = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      script: text,
    }))
  }, [])

  // Update selected speaker
  const updateSelectedSpeaker = useCallback((speakerId: string) => {
    setState(prev => ({
      ...prev,
      selectedSpeakerId: speakerId,
    }))
  }, [])

  // Update audio (from TTS module)
  const updateAudio = useCallback((audioUrl: string, storagePath: string) => {
    setState(prev => ({
      ...prev,
      audioUrl,
      storagePath,
    }))
  }, [])

  // Update video (from Video module)
  const updateVideo = useCallback((videoUrl: string) => {
    setState(prev => ({
      ...prev,
      videoUrl,
    }))
  }, [])

  // Clear audio (for re-generation)
  const clearAudio = useCallback(() => {
    setState(prev => ({
      ...prev,
      audioUrl: null,
      storagePath: null,
    }))
  }, [])

  // Clear video (for re-generation)
  const clearVideo = useCallback(() => {
    setState(prev => ({
      ...prev,
      videoUrl: null,
    }))
  }, [])

  // Reset all state (clear localStorage)
  const resetState = useCallback(() => {
    const newState = {
      sessionId: generateSessionId(),
      sourceText: '',
      script: '',
      audioUrl: null,
      storagePath: null,
      selectedSpeakerId: null,
      videoUrl: null,
    }
    setState(newState)
    saveStateToStorage(newState)
  }, [])

  return {
    state,
    isLoading,
    setIsLoading,
    updateSourceText,
    updateScript,
    updateSelectedSpeaker,
    updateAudio,
    updateVideo,
    clearAudio,
    clearVideo,
    resetState,
  }
}
