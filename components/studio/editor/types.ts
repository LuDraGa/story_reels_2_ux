/**
 * ASS Editor Types
 *
 * Shared types for the ASS caption editor
 */

import type { ParsedASS, ParsedCaption } from '@/lib/captions/ass-parser'

/**
 * Editor state
 */
export interface EditorState {
  // Data
  parsed: ParsedASS | null
  selectedCaptionIndex: number | null

  // Video
  videoUrl: string
  currentTime: number
  isPlaying: boolean
  duration: number

  // UI
  isLoading: boolean
  error: string | null
  isDirty: boolean // Has unsaved changes
  isSaving: boolean
}

/**
 * Editor actions
 */
export type EditorAction =
  // Loading
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'LOAD_ASS_SUCCESS'; payload: ParsedASS; videoUrl: string }
  | { type: 'SET_CAPTIONS'; captions: ParsedCaption[] }
  | { type: 'UPDATE_STYLE'; name: string; updates: Partial<ParsedASS['styles'][number]> }

  // Caption operations
  | { type: 'SELECT_CAPTION'; index: number | null }
  | { type: 'UPDATE_CAPTION'; index: number; caption: Partial<ParsedCaption> }
  | { type: 'DELETE_CAPTION'; index: number }
  | { type: 'ADD_CAPTION'; caption: ParsedCaption }

  // Video controls
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SET_DURATION'; duration: number }

  // Saving
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_CLEAN' }
