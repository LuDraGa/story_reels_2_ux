/**
 * SRT Caption Generator
 *
 * Converts WhisperX transcription JSON to SRT (SubRip Text) format
 * with support for:
 * - Basic sentence-based captions
 * - Karaoke-style word-by-word captions
 * - Focus word emphasis (for LLM-detected important words)
 */

import type { TranscriptionResponse, TranscriptionWord } from '@/lib/api/whisperx'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * SRT caption entry
 */
export interface SRTEntry {
  index: number // 1-based index
  startTime: string // HH:MM:SS,mmm
  endTime: string // HH:MM:SS,mmm
  text: string // Caption text
}

/**
 * Caption generation options
 */
export interface CaptionOptions {
  /**
   * Caption style
   * - 'sentence': Group words into sentences (3-7 words per line)
   * - 'word': One word per caption (karaoke-style)
   */
  style: 'sentence' | 'word'

  /**
   * Maximum words per caption (for sentence style)
   */
  maxWordsPerCaption?: number

  /**
   * Maximum characters per line
   */
  maxCharsPerLine?: number

  /**
   * Focus words to emphasize (from LLM analysis)
   * Format: array of word indices to emphasize
   */
  focusWords?: number[]

  /**
   * Focus word marker (for manual styling in video editor)
   * Example: "[FOCUS]amazing[/FOCUS]"
   */
  focusMarker?: string
}

// ============================================================================
// SRT Formatting Functions
// ============================================================================

/**
 * Convert seconds to SRT timestamp format (HH:MM:SS,mmm)
 *
 * @param seconds - Time in seconds
 * @returns SRT-formatted timestamp
 */
export function formatSRTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

/**
 * Generate SRT file content from entries
 *
 * @param entries - Array of SRT entries
 * @returns SRT file content as string
 */
export function generateSRTContent(entries: SRTEntry[]): string {
  return entries
    .map(entry => {
      return `${entry.index}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`
    })
    .join('\n')
}

// ============================================================================
// Caption Generation Functions
// ============================================================================

/**
 * Generate sentence-style captions (3-7 words per line)
 *
 * Groups words into natural sentences/phrases for readability.
 * This is the standard style for most videos.
 *
 * @param transcription - WhisperX transcription response
 * @param options - Caption options
 * @returns Array of SRT entries
 */
export function generateSentenceCaptions(
  transcription: TranscriptionResponse,
  options: CaptionOptions
): SRTEntry[] {
  const maxWords = options.maxWordsPerCaption || 5
  const maxChars = options.maxCharsPerLine || 50
  const focusWords = new Set(options.focusWords || [])
  const focusMarker = options.focusMarker || ''

  const entries: SRTEntry[] = []
  let currentEntry: SRTEntry | null = null
  let currentWords: string[] = []
  let currentWordCount = 0
  let wordIndex = 0

  // Flatten all words from all segments
  const allWords: TranscriptionWord[] = transcription.segments.flatMap(
    seg => seg.words
  )

  for (const word of allWords) {
    // Check if this word should be emphasized
    const isFocusWord = focusWords.has(wordIndex)
    const wordText = isFocusWord && focusMarker
      ? `${focusMarker}${word.word}${focusMarker.replace('[', '[/')}`
      : word.word

    // Start new entry if needed
    if (!currentEntry) {
      currentEntry = {
        index: entries.length + 1,
        startTime: formatSRTTimestamp(word.start),
        endTime: formatSRTTimestamp(word.end),
        text: '',
      }
      currentWords = []
      currentWordCount = 0
    }

    // Add word to current entry
    currentWords.push(wordText)
    currentWordCount++
    currentEntry.endTime = formatSRTTimestamp(word.end)

    const currentText = currentWords.join(' ')

    // Check if we should break to new line
    const shouldBreak =
      currentWordCount >= maxWords ||
      currentText.length >= maxChars ||
      // Break on sentence-ending punctuation
      /[.!?]$/.test(word.word)

    if (shouldBreak) {
      currentEntry.text = currentText
      entries.push(currentEntry)
      currentEntry = null
    }

    wordIndex++
  }

  // Add final entry if exists
  if (currentEntry && currentWords.length > 0) {
    currentEntry.text = currentWords.join(' ')
    entries.push(currentEntry)
  }

  return entries
}

/**
 * Generate word-by-word captions (karaoke-style)
 *
 * Creates one caption per word for TikTok/Instagram-style highlighting.
 * Each word appears individually, synced to audio.
 *
 * @param transcription - WhisperX transcription response
 * @param options - Caption options
 * @returns Array of SRT entries
 */
export function generateWordCaptions(
  transcription: TranscriptionResponse,
  options: CaptionOptions
): SRTEntry[] {
  const focusWords = new Set(options.focusWords || [])
  const focusMarker = options.focusMarker || ''

  const entries: SRTEntry[] = []
  let wordIndex = 0

  // Flatten all words from all segments
  const allWords: TranscriptionWord[] = transcription.segments.flatMap(
    seg => seg.words
  )

  for (const word of allWords) {
    // Check if this word should be emphasized
    const isFocusWord = focusWords.has(wordIndex)
    const wordText = isFocusWord && focusMarker
      ? `${focusMarker}${word.word}${focusMarker.replace('[', '[/')}`
      : word.word

    entries.push({
      index: entries.length + 1,
      startTime: formatSRTTimestamp(word.start),
      endTime: formatSRTTimestamp(word.end),
      text: wordText,
    })

    wordIndex++
  }

  return entries
}

/**
 * Generate advanced multi-line karaoke captions
 *
 * Creates rolling captions where:
 * - 3-5 words visible at once
 * - Current word is highlighted
 * - Previous/next words are dimmed
 *
 * Example:
 * ```
 * word word [CURRENT] word word
 * ```
 *
 * This is the most engaging style for short-form video (TikTok/Reels).
 *
 * @param transcription - WhisperX transcription response
 * @param options - Caption options
 * @returns Array of SRT entries
 */
export function generateKaraokeCaptions(
  transcription: TranscriptionResponse,
  options: CaptionOptions
): SRTEntry[] {
  const wordsPerLine = options.maxWordsPerCaption || 5
  const focusWords = new Set(options.focusWords || [])
  const focusMarker = options.focusMarker || '[FOCUS]'

  const entries: SRTEntry[] = []

  // Flatten all words from all segments
  const allWords: TranscriptionWord[] = transcription.segments.flatMap(
    seg => seg.words
  )

  // Create rolling window of words
  for (let i = 0; i < allWords.length; i++) {
    const currentWord = allWords[i]

    // Get context words (before and after current word)
    const contextStart = Math.max(0, i - Math.floor(wordsPerLine / 2))
    const contextEnd = Math.min(allWords.length, i + Math.ceil(wordsPerLine / 2))
    const contextWords = allWords.slice(contextStart, contextEnd)

    // Build caption text with current word highlighted
    const captionText = contextWords
      .map((word, idx) => {
        const globalIdx = contextStart + idx
        const isCurrent = globalIdx === i
        const isFocus = focusWords.has(globalIdx)

        if (isCurrent) {
          // Current word - always highlight
          return isFocus && focusMarker
            ? `<b><u>${focusMarker}${word.word}${focusMarker.replace('[', '[/')}</u></b>`
            : `<b>${word.word}</b>`
        } else {
          // Context word - show normally or with focus marker
          return isFocus && focusMarker
            ? `${focusMarker}${word.word}${focusMarker.replace('[', '[/')}`
            : word.word
        }
      })
      .join(' ')

    entries.push({
      index: entries.length + 1,
      startTime: formatSRTTimestamp(currentWord.start),
      endTime: formatSRTTimestamp(currentWord.end),
      text: captionText,
    })
  }

  return entries
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generate SRT captions from WhisperX transcription
 *
 * @param transcription - WhisperX transcription response
 * @param options - Caption generation options
 * @returns SRT file content as string
 */
export function generateSRT(
  transcription: TranscriptionResponse,
  options: CaptionOptions = { style: 'sentence' }
): string {
  let entries: SRTEntry[]

  switch (options.style) {
    case 'word':
      entries = generateWordCaptions(transcription, options)
      break
    case 'sentence':
    default:
      entries = generateSentenceCaptions(transcription, options)
      break
  }

  return generateSRTContent(entries)
}

/**
 * Generate karaoke-style SRT (shorthand for advanced users)
 */
export function generateKaraokeSRT(
  transcription: TranscriptionResponse,
  focusWords: number[] = []
): string {
  const entries = generateKaraokeCaptions(transcription, {
    style: 'word', // Not used for karaoke, but required
    maxWordsPerCaption: 5,
    focusWords,
    focusMarker: '[FOCUS]',
  })

  return generateSRTContent(entries)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract plain text from SRT file (remove timestamps and formatting)
 *
 * @param srtContent - SRT file content
 * @returns Plain text transcript
 */
export function extractTextFromSRT(srtContent: string): string {
  const lines = srtContent.split('\n')
  const textLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip index lines (numbers)
    if (/^\d+$/.test(line)) continue

    // Skip timestamp lines
    if (/-->/.test(line)) continue

    // Skip empty lines
    if (!line) continue

    // Add text line
    textLines.push(line)
  }

  return textLines.join(' ')
}

/**
 * Get total duration from SRT file
 *
 * @param srtContent - SRT file content
 * @returns Duration in seconds
 */
export function getSRTDuration(srtContent: string): number {
  const lines = srtContent.split('\n')
  let maxTime = 0

  for (const line of lines) {
    if (/-->/.test(line)) {
      const match = line.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
      if (match) {
        const [, hours, minutes, seconds, milliseconds] = match
        const time =
          parseInt(hours) * 3600 +
          parseInt(minutes) * 60 +
          parseInt(seconds) +
          parseInt(milliseconds) / 1000

        maxTime = Math.max(maxTime, time)
      }
    }
  }

  return maxTime
}
