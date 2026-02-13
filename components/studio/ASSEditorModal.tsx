'use client'

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getCaptionAtTime, parseASS, serializeASS } from '@/lib/captions/ass-parser'
import { EditorSidebar } from './editor/EditorSidebar'
import { VideoPlayer } from './editor/VideoPlayer'
import { Timeline } from './editor/Timeline'
import type { EditorAction, EditorState } from './editor/types'

interface ASSEditorModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  assUrl: string
  videoUrl?: string | null
  onSave: (newAssUrl: string) => void
}

const initialState: EditorState = {
  parsed: null,
  selectedCaptionIndex: null,
  videoUrl: '',
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  isLoading: false,
  error: null,
  isDirty: false,
  isSaving: false,
}

const getDraftKey = (projectId: string) => `ass-editor-draft:${projectId}`

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false }
    case 'LOAD_ASS_SUCCESS':
      return {
        ...state,
        parsed: action.payload,
        videoUrl: action.videoUrl,
        isLoading: false,
        error: null,
        isDirty: false,
      }
    case 'SET_CAPTIONS': {
      if (!state.parsed) return state
      return {
        ...state,
        parsed: { ...state.parsed, captions: action.captions },
        isDirty: true,
      }
    }
    case 'SELECT_CAPTION':
      return { ...state, selectedCaptionIndex: action.index }
    case 'UPDATE_CAPTION': {
      if (!state.parsed) return state
      const updatedCaptions = state.parsed.captions.map((caption) =>
        caption.index === action.index ? { ...caption, ...action.caption } : caption
      )
      return {
        ...state,
        parsed: { ...state.parsed, captions: updatedCaptions },
        isDirty: true,
      }
    }
    case 'DELETE_CAPTION': {
      if (!state.parsed) return state
      const remaining = state.parsed.captions.filter(
        (caption) => caption.index !== action.index
      )
      return {
        ...state,
        parsed: { ...state.parsed, captions: remaining },
        selectedCaptionIndex:
          state.selectedCaptionIndex === action.index ? null : state.selectedCaptionIndex,
        isDirty: true,
      }
    }
    case 'ADD_CAPTION': {
      if (!state.parsed) return state
      return {
        ...state,
        parsed: { ...state.parsed, captions: [...state.parsed.captions, action.caption] },
        isDirty: true,
      }
    }
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.time }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing }
    case 'SET_DURATION':
      return { ...state, duration: action.duration }
    case 'SET_SAVING':
      return { ...state, isSaving: action.saving }
    case 'SAVE_SUCCESS':
      return { ...state, isSaving: false, isDirty: false }
    case 'MARK_DIRTY':
      return { ...state, isDirty: true }
    case 'MARK_CLEAN':
      return { ...state, isDirty: false }
    default:
      return state
  }
}

export function ASSEditorModal({
  isOpen,
  onClose,
  projectId,
  assUrl,
  videoUrl,
  onSave: _onSave,
}: ASSEditorModalProps) {
  const { toast } = useToast()
  const [state, dispatch] = useReducer(editorReducer, initialState)
  const originalAssRef = useRef<string | null>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    const loadASS = async () => {
      dispatch({ type: 'SET_LOADING', loading: true })
      try {
        const response = await fetch(assUrl)
        if (!response.ok) {
          throw new Error('Failed to load ASS file')
        }
        const assContent = await response.text()
        originalAssRef.current = assContent
        let parsed = parseASS(assContent)
        let usedDraft = false

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(getDraftKey(projectId))
          if (stored) {
            try {
              const draft = JSON.parse(stored) as { assUrl?: string; content?: string }
              if (draft.assUrl === assUrl && draft.content) {
                if (draft.content !== assContent) {
                  parsed = parseASS(draft.content)
                  usedDraft = true
                } else {
                  localStorage.removeItem(getDraftKey(projectId))
                }
              }
            } catch (error) {
              console.warn('Failed to read ASS draft:', error)
            }
          }
        }

        if (!isMounted) return
        dispatch({
          type: 'LOAD_ASS_SUCCESS',
          payload: parsed,
          videoUrl: videoUrl || '',
        })
        if (usedDraft) {
          dispatch({ type: 'MARK_DIRTY' })
          setDraftLoaded(true)
        } else {
          setDraftLoaded(false)
        }
      } catch (error) {
        if (!isMounted) return
        const message = error instanceof Error ? error.message : 'Unable to load captions'
        dispatch({ type: 'SET_ERROR', error: message })
        toast({
          title: 'Caption editor error',
          description: message,
          variant: 'destructive',
        })
      }
    }

    loadASS()

    return () => {
      isMounted = false
    }
  }, [assUrl, isOpen, projectId, toast, videoUrl])

  const handleDiscardDraft = () => {
    if (!originalAssRef.current) return
    try {
      localStorage.removeItem(getDraftKey(projectId))
      const parsed = parseASS(originalAssRef.current)
      dispatch({
        type: 'LOAD_ASS_SUCCESS',
        payload: parsed,
        videoUrl: videoUrl || '',
      })
      dispatch({ type: 'MARK_CLEAN' })
      setDraftLoaded(false)
    } catch (error) {
      console.error('Failed to discard draft:', error)
    }
  }

  useEffect(() => {
    if (!state.parsed || !state.isDirty) return
    const timeout = window.setTimeout(() => {
      try {
        const content = serializeASS(state.parsed)
        const payload = {
          assUrl,
          content,
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem(getDraftKey(projectId), JSON.stringify(payload))
      } catch (error) {
        console.error('Failed to save ASS draft:', error)
      }
    }, 500)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [assUrl, projectId, state.isDirty, state.parsed])

  const currentCaptionIndex = useMemo(() => {
    if (!state.parsed) return null
    const active = getCaptionAtTime(state.parsed.captions, state.currentTime)
    return active ? active.index : null
  }, [state.parsed, state.currentTime])

  const sidebarDuration = useMemo(() => {
    if (!state.parsed || state.parsed.captions.length === 0) return state.duration
    const maxCaptionEnd = state.parsed.captions.reduce(
      (maxEnd, caption) => Math.max(maxEnd, caption.end),
      0
    )
    return Math.max(state.duration, maxCaptionEnd)
  }, [state.duration, state.parsed])

  const extractOverrides = (text: string) => {
    const alignmentMatch = text.match(/\\an(\d+)/i)
    const positionMatch = text.match(/\\pos\(([-\d.]+),\s*([-\d.]+)\)/i)
    const alignment = alignmentMatch ? Number(alignmentMatch[1]) : undefined
    const position = positionMatch
      ? {
          x: Number(positionMatch[1]),
          y: Number(positionMatch[2]),
        }
      : undefined
    return {
      alignment: Number.isFinite(alignment) ? alignment : undefined,
      position:
        position && Number.isFinite(position.x) && Number.isFinite(position.y)
          ? position
          : undefined,
    }
  }

  const updateCaptionOverrides = (
    text: string,
    overrides: { alignment?: number; position?: { x: number; y: number } | null }
  ) => {
    const prefixMatch = text.match(/^(\{[^}]*\})+/)
    const prefix = prefixMatch ? prefixMatch[0] : ''
    const remainder = text.slice(prefix.length)
    const cleanedPrefix = prefix
      .replace(/\\pos\([^)]*\)/gi, '')
      .replace(/\\an\d+/gi, '')
      .replace(/\{\s*\}/g, '')
    const overrideTags: string[] = []
    if (overrides.alignment) {
      overrideTags.push(`\\an${overrides.alignment}`)
    }
    if (overrides.position) {
      const x = Math.round(overrides.position.x)
      const y = Math.round(overrides.position.y)
      overrideTags.push(`\\pos(${x},${y})`)
    }
    const overridePrefix = overrideTags.length ? `{${overrideTags.join('')}}` : ''
    const combined = `${overridePrefix}${cleanedPrefix}${remainder}`.replace(/\{\s*\}/g, '')
    return combined
  }

  const reindexCaptions = (captions: ParsedCaption[]) =>
    captions.map((caption, index) => ({ ...caption, index }))

  const updateCaptions = (captions: ParsedCaption[], selectedIndex: number | null) => {
    dispatch({ type: 'SET_CAPTIONS', captions })
    dispatch({ type: 'SELECT_CAPTION', index: selectedIndex })
  }

  const handleDeleteCaption = () => {
    if (!state.parsed || state.selectedCaptionIndex === null) return
    const targetIndex = state.parsed.captions.findIndex(
      (caption) => caption.index === state.selectedCaptionIndex
    )
    const nextCaptions = state.parsed.captions.filter(
      (caption) => caption.index !== state.selectedCaptionIndex
    )
    const reindexed = reindexCaptions(nextCaptions)
    const nextSelection =
      reindexed.length === 0
        ? null
        : Math.min(Math.max(targetIndex, 0), reindexed.length - 1)
    updateCaptions(reindexed, nextSelection)
  }

  const handleAddCaption = () => {
    if (!state.parsed) return
    const baseDuration = sidebarDuration || state.currentTime + 1
    const start = Math.min(state.currentTime, Math.max(baseDuration - 0.5, 0))
    const end = Math.min(start + 1, baseDuration)
    const styleName = state.parsed.captions[0]?.style || state.parsed.styles[0]?.Name || 'Default'
    const baseCaption =
      state.parsed.captions.find(
        (caption) => caption.index === state.selectedCaptionIndex
      ) || state.parsed.captions[0]
    const newCaption: ParsedCaption = {
      index: state.parsed.captions.length,
      layer: baseCaption?.layer ?? 0,
      start,
      end: Math.max(end, start + 0.1),
      style: baseCaption?.style ?? styleName,
      name: baseCaption?.name ?? '',
      marginL: baseCaption?.marginL ?? 0,
      marginR: baseCaption?.marginR ?? 0,
      marginV: baseCaption?.marginV ?? 0,
      effect: baseCaption?.effect ?? '',
      text: 'New caption',
      plainText: 'New caption',
    }

    const insertIndex =
      state.parsed.captions.findIndex(
        (caption) => caption.index === state.selectedCaptionIndex
      )
    const nextCaptions = [...state.parsed.captions]
    if (insertIndex >= 0 && insertIndex < nextCaptions.length) {
      nextCaptions.splice(insertIndex + 1, 0, newCaption)
    } else {
      nextCaptions.push(newCaption)
    }

    const reindexed = reindexCaptions(nextCaptions)
    const nextSelection =
      insertIndex >= 0 ? Math.min(insertIndex + 1, reindexed.length - 1) : reindexed.length - 1
    updateCaptions(reindexed, nextSelection)
  }

  const handleSplitCaption = () => {
    if (!state.parsed || state.selectedCaptionIndex === null) return
    const index = state.selectedCaptionIndex
    const captions = [...state.parsed.captions]
    const targetIndex = captions.findIndex((caption) => caption.index === index)
    if (targetIndex === -1) return
    const caption = captions[targetIndex]
    const minGap = 0.1
    let splitTime = state.currentTime
    if (splitTime <= caption.start + minGap || splitTime >= caption.end - minGap) {
      splitTime = caption.start + (caption.end - caption.start) / 2
    }

    const words = (caption.plainText || caption.text).trim().split(/\s+/).filter(Boolean)
    let firstText = caption.plainText || caption.text
    let secondText = caption.plainText || caption.text
    if (words.length >= 2) {
      const midpoint = Math.ceil(words.length / 2)
      firstText = words.slice(0, midpoint).join(' ')
      secondText = words.slice(midpoint).join(' ')
    } else if (words.length === 1) {
      const text = words[0]
      const mid = Math.ceil(text.length / 2)
      firstText = text.slice(0, mid)
      secondText = text.slice(mid)
    }

    const updatedFirst: ParsedCaption = {
      ...caption,
      end: splitTime,
      text: firstText,
      plainText: firstText,
    }
    const updatedSecond: ParsedCaption = {
      ...caption,
      start: splitTime,
      text: secondText,
      plainText: secondText,
    }

    captions.splice(targetIndex, 1, updatedFirst, updatedSecond)
    const reindexed = reindexCaptions(captions)
    updateCaptions(reindexed, Math.min(targetIndex + 1, reindexed.length - 1))
  }

  const handleMergeCaption = () => {
    if (!state.parsed || state.selectedCaptionIndex === null) return
    const captions = [...state.parsed.captions]
    const targetIndex = captions.findIndex(
      (caption) => caption.index === state.selectedCaptionIndex
    )
    if (targetIndex === -1 || targetIndex === captions.length - 1) return
    const current = captions[targetIndex]
    const next = captions[targetIndex + 1]
    const mergedText = `${current.plainText || current.text} ${next.plainText || next.text}`.trim()
    const merged: ParsedCaption = {
      ...current,
      end: next.end,
      text: mergedText,
      plainText: mergedText,
    }
    captions.splice(targetIndex, 2, merged)
    const reindexed = reindexCaptions(captions)
    updateCaptions(reindexed, Math.min(targetIndex, reindexed.length - 1))
  }

  const selectedCaptionOverrides = useMemo(() => {
    if (!state.parsed || state.selectedCaptionIndex === null) {
      return { alignment: 2, position: null }
    }
    const caption = state.parsed.captions.find(
      (item) => item.index === state.selectedCaptionIndex
    )
    if (!caption) return { alignment: 2, position: null }
    const overrides = extractOverrides(caption.text)
    const styleAlignment = state.parsed.styles.find(
      (style) => style.Name === caption.style
    )?.Alignment
    return {
      alignment: overrides.alignment ?? (typeof styleAlignment === 'number' ? styleAlignment : 2),
      position: overrides.position ?? null,
    }
  }, [state.parsed, state.selectedCaptionIndex])

  const handleSelectCaption = (index: number) => {
    dispatch({ type: 'SELECT_CAPTION', index })
    if (!state.parsed) return
    const selected = state.parsed.captions.find((caption) => caption.index === index)
    if (selected) {
      dispatch({ type: 'SET_CURRENT_TIME', time: selected.start })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-secondary-900 text-secondary-100">
      <div className="flex items-center justify-between border-b border-secondary-800 px-6 py-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Caption Editor</h2>
          <p className="text-xs text-secondary-400">
            Project {projectId} • ASS draft editor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="rounded-lg border-secondary-700 text-secondary-200"
          >
            Save Draft
          </Button>
          {draftLoaded && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardDraft}
              className="rounded-lg border-secondary-700 text-secondary-200"
            >
              Discard Draft
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled
            className="rounded-lg bg-gradient-sage text-white"
          >
            Apply Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-lg border-secondary-700 text-secondary-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6">
          {state.isLoading ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-secondary-800 bg-secondary-900/40 text-secondary-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading captions...
            </div>
          ) : state.error ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-sm text-red-200">
              {state.error}
            </div>
          ) : (
            <VideoPlayer
              videoUrl={state.videoUrl}
              currentTime={state.currentTime}
              isPlaying={state.isPlaying}
              onTimeUpdate={(time) => dispatch({ type: 'SET_CURRENT_TIME', time })}
              onPlayPause={(playing) => dispatch({ type: 'SET_PLAYING', playing })}
              onLoadedMetadata={(duration) => dispatch({ type: 'SET_DURATION', duration })}
              captions={state.parsed?.captions}
              styles={state.parsed?.styles}
              scriptInfo={state.parsed?.scriptInfo}
            />
          )}
        </div>

        {state.parsed && !state.isLoading ? (
          <EditorSidebar
            captions={state.parsed.captions}
            selectedIndex={state.selectedCaptionIndex}
            currentIndex={currentCaptionIndex}
            duration={sidebarDuration}
            isDirty={state.isDirty}
            currentTime={state.currentTime}
            alignment={selectedCaptionOverrides.alignment}
            position={selectedCaptionOverrides.position}
            onSelectCaption={handleSelectCaption}
            onUpdateCaption={(index, updates) =>
              dispatch({ type: 'UPDATE_CAPTION', index, caption: updates })
            }
            onUpdateAlignment={(alignment) => {
              if (!state.parsed || state.selectedCaptionIndex === null) return
              const caption = state.parsed.captions.find(
                (item) => item.index === state.selectedCaptionIndex
              )
              if (!caption) return
              const newText = updateCaptionOverrides(caption.text, {
                alignment,
                position: selectedCaptionOverrides.position,
              })
              dispatch({
                type: 'UPDATE_CAPTION',
                index: caption.index,
                caption: { text: newText },
              })
            }}
            onUpdatePosition={(position) => {
              if (!state.parsed || state.selectedCaptionIndex === null) return
              const caption = state.parsed.captions.find(
                (item) => item.index === state.selectedCaptionIndex
              )
              if (!caption) return
              const newText = updateCaptionOverrides(caption.text, {
                alignment: selectedCaptionOverrides.alignment,
                position,
              })
              dispatch({
                type: 'UPDATE_CAPTION',
                index: caption.index,
                caption: { text: newText },
              })
            }}
            onAddCaption={handleAddCaption}
            onDeleteCaption={handleDeleteCaption}
            onSplitCaption={handleSplitCaption}
            onMergeCaption={handleMergeCaption}
          />
        ) : (
          <aside className="w-[420px] border-l border-secondary-800 bg-secondary-900/60 p-4">
            <div className="rounded-xl border border-secondary-800 bg-secondary-900/40 p-4 text-sm text-secondary-400">
              {state.isLoading ? 'Loading caption list...' : 'No captions available.'}
            </div>
          </aside>
        )}
      </div>

      <div className="h-40 border-t border-secondary-800 bg-secondary-900/70 px-6 py-4">
        <Timeline
          duration={sidebarDuration}
          currentTime={state.currentTime}
          captions={state.parsed?.captions || []}
          selectedIndex={state.selectedCaptionIndex}
          currentIndex={currentCaptionIndex}
          onSeek={(time) => dispatch({ type: 'SET_CURRENT_TIME', time })}
          onSelectCaption={handleSelectCaption}
          onUpdateCaption={(index, updates) =>
            dispatch({ type: 'UPDATE_CAPTION', index, caption: updates })
          }
        />
      </div>
    </div>
  )
}
