/**
 * ASS (Advanced SubStation Alpha) File Parser
 *
 * Parses ASS subtitle files into JavaScript objects for editing,
 * and serializes them back to ASS format.
 *
 * ASS Format Structure:
 * - [Script Info] - Metadata (title, resolution, etc.)
 * - [V4+ Styles] - Style definitions
 * - [Events] - Dialogue/caption events
 */

import type { ASSStyle } from './ass-presets'
import { parseASSTime, formatASSTime } from './ass-presets'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Parsed ASS file structure
 */
export interface ParsedASS {
  /** Script metadata (title, resolution, etc.) */
  scriptInfo: Record<string, string>
  /** Style definitions */
  styles: ASSStyle[]
  /** Caption/dialogue events */
  captions: ParsedCaption[]
  /** Original raw ASS content (for debugging) */
  raw: string
}

/**
 * Parsed caption/dialogue event
 */
export interface ParsedCaption {
  /** Caption index (0-based) */
  index: number
  /** Layer (z-index for overlapping captions) */
  layer: number
  /** Start time in seconds */
  start: number
  /** End time in seconds */
  end: number
  /** Style name (references styles array) */
  style: string
  /** Actor/speaker name (usually empty) */
  name: string
  /** Left margin in pixels */
  marginL: number
  /** Right margin in pixels */
  marginR: number
  /** Vertical margin in pixels */
  marginV: number
  /** Effect name (usually empty) */
  effect: string
  /** Raw ASS text with tags (e.g., "{\k50}hello{\k30}world") */
  text: string
  /** Plain text without ASS tags (for editing) */
  plainText: string
}

/**
 * Parse error with context
 */
export class ASSParseError extends Error {
  constructor(
    message: string,
    public line?: number,
    public section?: string
  ) {
    super(message)
    this.name = 'ASSParseError'
  }
}

// ============================================================================
// Main Parse Function
// ============================================================================

/**
 * Parse ASS file content into structured objects
 *
 * @param assContent - Raw ASS file content as string
 * @returns Parsed ASS structure
 * @throws ASSParseError if file is malformed
 *
 * @example
 * const parsed = parseASS(assFileContent)
 * console.log(parsed.captions.length) // Number of captions
 * console.log(parsed.styles[0].Fontname) // First style's font
 */
export function parseASS(assContent: string): ParsedASS {
  if (!assContent || typeof assContent !== 'string') {
    throw new ASSParseError('ASS content must be a non-empty string')
  }

  const lines = assContent.split('\n')
  let currentSection: string | null = null

  const scriptInfo: Record<string, string> = {}
  const styles: ASSStyle[] = []
  const captions: ParsedCaption[] = []

  let styleFormat: string[] = []
  let eventFormat: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines and comments
    if (!line || line.startsWith(';')) continue

    // Detect section headers
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1).trim()
      continue
    }

    // Parse based on current section
    try {
      switch (currentSection) {
        case 'Script Info':
          parseScriptInfoLine(line, scriptInfo)
          break

        case 'V4+ Styles':
          if (line.startsWith('Format:')) {
            styleFormat = parseFormatLine(line)
          } else if (line.startsWith('Style:')) {
            const style = parseStyleLine(line, styleFormat)
            styles.push(style)
          }
          break

        case 'Events':
          if (line.startsWith('Format:')) {
            eventFormat = parseFormatLine(line)
          } else if (line.startsWith('Dialogue:')) {
            const caption = parseDialogueLine(line, eventFormat, captions.length)
            captions.push(caption)
          }
          break
      }
    } catch (error) {
      throw new ASSParseError(
        `Parse error at line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        i + 1,
        currentSection || undefined
      )
    }
  }

  // Validation
  if (styles.length === 0) {
    throw new ASSParseError('No styles found in ASS file')
  }
  if (captions.length === 0) {
    throw new ASSParseError('No dialogue events found in ASS file')
  }

  return {
    scriptInfo,
    styles,
    captions,
    raw: assContent,
  }
}

// ============================================================================
// Section Parsers
// ============================================================================

/**
 * Parse a Script Info line (key: value)
 */
function parseScriptInfoLine(line: string, scriptInfo: Record<string, string>): void {
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) return

  const key = line.slice(0, colonIndex).trim()
  const value = line.slice(colonIndex + 1).trim()

  scriptInfo[key] = value
}

/**
 * Parse a Format line (comma-separated field names)
 */
function parseFormatLine(line: string): string[] {
  const formatPart = line.replace(/^Format:\s*/, '')
  return formatPart.split(',').map(f => f.trim())
}

/**
 * Parse a Style line into ASSStyle object
 *
 * Expected format: "Style: Name,Fontname,Fontsize,..."
 */
function parseStyleLine(line: string, format: string[]): ASSStyle {
  const stylePart = line.replace(/^Style:\s*/, '')
  const values = stylePart.split(',').map(v => v.trim())

  const style: any = {}

  for (let i = 0; i < format.length && i < values.length; i++) {
    const field = format[i]
    const value = values[i]

    // Type conversions
    if (field === 'Fontsize' || field === 'ScaleX' || field === 'ScaleY' ||
        field === 'Spacing' || field === 'Angle' || field === 'Outline' ||
        field === 'Shadow' || field === 'Alignment' || field === 'MarginL' ||
        field === 'MarginR' || field === 'MarginV' || field === 'Encoding' ||
        field === 'BorderStyle') {
      style[field] = parseFloat(value) || 0
    } else if (field === 'Bold' || field === 'Italic' || field === 'Underline' ||
               field === 'StrikeOut') {
      style[field] = parseInt(value) || 0
    } else {
      style[field] = value
    }
  }

  return style as ASSStyle
}

/**
 * Parse a Dialogue line into ParsedCaption object
 */
function parseDialogueLine(line: string, format: string[], index: number): ParsedCaption {
  const dialoguePart = line.replace(/^Dialogue:\s*/, '')

  // Split carefully - Text field may contain commas
  const values: string[] = []
  let current = ''
  let fieldCount = 0
  const maxFields = format.length - 1 // All fields except Text

  for (let i = 0; i < dialoguePart.length; i++) {
    if (dialoguePart[i] === ',' && fieldCount < maxFields) {
      values.push(current.trim())
      current = ''
      fieldCount++
    } else {
      current += dialoguePart[i]
    }
  }
  values.push(current.trim()) // Last field (Text)

  const caption: any = { index }

  for (let i = 0; i < format.length && i < values.length; i++) {
    const field = format[i]
    const value = values[i]

    switch (field) {
      case 'Layer':
        caption.layer = parseInt(value) || 0
        break
      case 'Start':
        caption.start = parseASSTime(value)
        break
      case 'End':
        caption.end = parseASSTime(value)
        break
      case 'Style':
        caption.style = value
        break
      case 'Name':
        caption.name = value
        break
      case 'MarginL':
        caption.marginL = parseInt(value) || 0
        break
      case 'MarginR':
        caption.marginR = parseInt(value) || 0
        break
      case 'MarginV':
        caption.marginV = parseInt(value) || 0
        break
      case 'Effect':
        caption.effect = value
        break
      case 'Text':
        caption.text = value
        caption.plainText = stripASSTags(value)
        break
    }
  }

  return caption as ParsedCaption
}

// ============================================================================
// ASS Tag Utilities
// ============================================================================

/**
 * Strip ASS formatting tags from text to get plain text
 *
 * Removes tags like {\k50}, {\r}, {\fs70}, {\c&H00FFFF&}, etc.
 *
 * @param text - Text with ASS tags
 * @returns Plain text without tags
 *
 * @example
 * stripASSTags("{\\k50}hello{\\k30}world") // "helloworld"
 * stripASSTags("{\\r\\fs70}focus{\\r}normal") // "focusnormal"
 */
export function stripASSTags(text: string): string {
  // Remove all {...} blocks
  return text.replace(/\{[^}]*\}/g, '')
}

/**
 * Rebuild ASS text with tags (for karaoke timing)
 *
 * This is a simplified version - preserves existing tags structure
 * For MVP, we'll keep the tag structure from the original ASS file
 *
 * @param plainText - Plain text
 * @param originalText - Original text with tags (to preserve structure)
 * @returns Text with ASS tags
 */
export function rebuildASSText(plainText: string, originalText: string): string {
  // For MVP: If text hasn't changed much, try to preserve tags
  const originalPlain = stripASSTags(originalText)

  if (plainText === originalPlain) {
    // Text unchanged, keep original tags
    return originalText
  }

  // Preserve positional overrides when text changes
  const prefixMatch = originalText.match(/^(\{[^}]*\})+/)
  const prefix = prefixMatch ? prefixMatch[0] : ''
  const overrideTags: string[] = []
  const alignmentMatch = prefix.match(/\\an\d+/gi)
  if (alignmentMatch) {
    overrideTags.push(...alignmentMatch)
  }
  const positionMatch = prefix.match(/\\pos\([^)]*\)/gi)
  if (positionMatch) {
    overrideTags.push(...positionMatch)
  }

  const overridePrefix = overrideTags.length ? `{${overrideTags.join('')}}` : ''
  return `${overridePrefix}${plainText}`
}

// ============================================================================
// Serialization (ASS Object → String)
// ============================================================================

/**
 * Serialize parsed ASS back to ASS file format
 *
 * @param parsed - Parsed ASS structure
 * @returns ASS file content as string
 *
 * @example
 * const parsed = parseASS(originalContent)
 * // ... modify parsed.captions ...
 * const newContent = serializeASS(parsed)
 */
export function serializeASS(parsed: ParsedASS): string {
  let output = ''

  // [Script Info]
  output += '[Script Info]\n'
  output += '; Modified by Reel Story Studio ASS Editor\n'
  for (const [key, value] of Object.entries(parsed.scriptInfo)) {
    output += `${key}: ${value}\n`
  }
  output += '\n'

  // [V4+ Styles]
  output += '[V4+ Styles]\n'
  output += 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'

  for (const style of parsed.styles) {
    output += serializeStyle(style) + '\n'
  }
  output += '\n'

  // [Events]
  output += '[Events]\n'
  output += 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'

  for (const caption of parsed.captions) {
    output += serializeDialogue(caption) + '\n'
  }

  return output
}

/**
 * Serialize ASSStyle to Style line
 */
function serializeStyle(style: ASSStyle): string {
  return [
    'Style:',
    style.Name,
    style.Fontname,
    style.Fontsize,
    style.PrimaryColour,
    style.SecondaryColour,
    style.OutlineColour,
    style.BackColour,
    style.Bold,
    style.Italic,
    style.Underline,
    style.StrikeOut,
    style.ScaleX,
    style.ScaleY,
    style.Spacing,
    style.Angle,
    style.BorderStyle,
    style.Outline,
    style.Shadow,
    style.Alignment,
    style.MarginL,
    style.MarginR,
    style.MarginV,
    style.Encoding,
  ].join(',')
}

/**
 * Serialize ParsedCaption to Dialogue line
 */
function serializeDialogue(caption: ParsedCaption): string {
  const start = formatASSTime(caption.start)
  const end = formatASSTime(caption.end)

  const parts = [
    caption.layer,
    start,
    end,
    caption.style,
    caption.name,
    caption.marginL,
    caption.marginR,
    caption.marginV,
    caption.effect,
    caption.text, // Use caption.text (with tags), not plainText
  ]

  return 'Dialogue: ' + parts.join(',')
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate parsed ASS structure
 *
 * @param parsed - Parsed ASS to validate
 * @returns True if valid
 * @throws ASSParseError if invalid
 */
export function validateParsedASS(parsed: ParsedASS): boolean {
  if (!parsed.styles || parsed.styles.length === 0) {
    throw new ASSParseError('Parsed ASS must have at least one style')
  }

  if (!parsed.captions || parsed.captions.length === 0) {
    throw new ASSParseError('Parsed ASS must have at least one caption')
  }

  // Validate each caption
  for (let i = 0; i < parsed.captions.length; i++) {
    const caption = parsed.captions[i]

    if (caption.start < 0) {
      throw new ASSParseError(`Caption ${i}: start time cannot be negative`)
    }

    if (caption.end <= caption.start) {
      throw new ASSParseError(`Caption ${i}: end time must be after start time`)
    }

    if (!caption.style) {
      throw new ASSParseError(`Caption ${i}: style name is required`)
    }

    // Check if style exists
    const styleExists = parsed.styles.some(s => s.Name === caption.style)
    if (!styleExists) {
      throw new ASSParseError(`Caption ${i}: style "${caption.style}" not found`)
    }
  }

  return true
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get caption at specific time
 *
 * @param captions - Array of captions
 * @param time - Time in seconds
 * @returns Caption at that time, or null
 */
export function getCaptionAtTime(captions: ParsedCaption[], time: number): ParsedCaption | null {
  return captions.find(c => c.start <= time && c.end > time) || null
}

/**
 * Sort captions by start time
 *
 * @param captions - Array of captions
 * @returns Sorted array (mutates original)
 */
export function sortCaptionsByTime(captions: ParsedCaption[]): ParsedCaption[] {
  return captions.sort((a, b) => a.start - b.start)
}

/**
 * Get total duration of all captions
 *
 * @param captions - Array of captions
 * @returns Duration in seconds
 */
export function getTotalDuration(captions: ParsedCaption[]): number {
  if (captions.length === 0) return 0
  const lastCaption = captions[captions.length - 1]
  return lastCaption.end
}

/**
 * Check if captions overlap
 *
 * @param caption1 - First caption
 * @param caption2 - Second caption
 * @returns True if they overlap
 */
export function captionsOverlap(caption1: ParsedCaption, caption2: ParsedCaption): boolean {
  return caption1.start < caption2.end && caption2.start < caption1.end
}
