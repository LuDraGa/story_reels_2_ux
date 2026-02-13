/**
 * ASS (Advanced SubStation Alpha) Caption Presets
 *
 * Defines visual styles for different platforms (TikTok, Instagram, YouTube)
 * with support for karaoke word-highlighting effects.
 *
 * ASS Format Reference:
 * - Colors are in BGR hex format: &H00BBGGRR& (NOT RGB!)
 * - Alignment: 1-3=bottom, 4-6=middle, 7-9=top (left/center/right)
 * - Font sizes are in points
 * - Karaoke effect uses \k tags with centisecond duration
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * ASS Style definition matching ASS format specification
 */
export interface ASSStyle {
  Name: string
  Fontname: string
  Fontsize: number
  PrimaryColour: string // Main text color (BGR hex)
  SecondaryColour: string // Karaoke fill color (BGR hex)
  OutlineColour: string // Outline/border color (BGR hex)
  BackColour: string // Shadow color (BGR hex)
  Bold: number // -1 = true, 0 = false
  Italic: number // -1 = true, 0 = false
  Underline: number // -1 = true, 0 = false
  StrikeOut: number // -1 = true, 0 = false
  ScaleX: number // Horizontal scale (100 = normal)
  ScaleY: number // Vertical scale (100 = normal)
  Spacing: number // Letter spacing
  Angle: number // Rotation angle
  BorderStyle: number // 1 = outline + drop shadow, 3 = opaque box
  Outline: number // Outline thickness (pixels)
  Shadow: number // Shadow depth (pixels)
  Alignment: number // 1-9 (numpad layout)
  MarginL: number // Left margin (pixels)
  MarginR: number // Right margin (pixels)
  MarginV: number // Vertical margin (pixels)
  Encoding: number // Character encoding (1 = default)
}

/**
 * Preset metadata
 */
export interface PresetInfo {
  id: string
  name: string
  description: string
  style: ASSStyle
  focusStyle?: ASSStyle // Optional style for emphasized words
}

// ============================================================================
// Color Conversion Utilities
// ============================================================================

/**
 * Convert RGB color to BGR hex format for ASS
 *
 * ASS uses BGR format: &H00BBGGRR& (reversed from RGB)
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @param alpha - Alpha component (0-255, default 0 = opaque)
 * @returns BGR hex string in ASS format
 *
 * @example
 * rgbToBGR(255, 255, 0) // Yellow → "&H0000FFFF&"
 * rgbToBGR(0, 255, 255) // Cyan → "&H00FFFF00&"
 * rgbToBGR(0, 0, 0) // Black → "&H00000000&"
 */
export function rgbToBGR(r: number, g: number, b: number, alpha: number = 0): string {
  const rHex = r.toString(16).padStart(2, '0').toUpperCase()
  const gHex = g.toString(16).padStart(2, '0').toUpperCase()
  const bHex = b.toString(16).padStart(2, '0').toUpperCase()
  const aHex = alpha.toString(16).padStart(2, '0').toUpperCase()

  return `&H${aHex}${bHex}${gHex}${rHex}&`
}

/**
 * Convert BGR hex to RGB color
 *
 * @param bgrHex - BGR hex string (e.g., "&H0000FFFF&")
 * @returns RGB object { r, g, b, alpha }
 */
export function bgrToRGB(bgrHex: string): { r: number; g: number; b: number; alpha: number } {
  // Remove &H and & markers
  const hex = bgrHex.replace(/&H|&/g, '')

  // Parse AABBGGRR
  const alpha = parseInt(hex.substring(0, 2), 16)
  const b = parseInt(hex.substring(2, 4), 16)
  const g = parseInt(hex.substring(4, 6), 16)
  const r = parseInt(hex.substring(6, 8), 16)

  return { r, g, b, alpha }
}

/**
 * Predefined colors in ASS BGR format
 */
export const ASSColors = {
  // Basic colors
  WHITE: rgbToBGR(255, 255, 255),
  BLACK: rgbToBGR(0, 0, 0),
  RED: rgbToBGR(255, 0, 0),
  GREEN: rgbToBGR(0, 255, 0),
  BLUE: rgbToBGR(0, 0, 255),
  YELLOW: rgbToBGR(255, 255, 0),
  CYAN: rgbToBGR(0, 255, 255),
  MAGENTA: rgbToBGR(255, 0, 255),

  // TikTok brand colors
  TIKTOK_YELLOW: rgbToBGR(254, 221, 64), // #FEDD40
  TIKTOK_PINK: rgbToBGR(254, 44, 85), // #FE2C55
  TIKTOK_CYAN: rgbToBGR(37, 244, 238), // #25F4EE

  // Instagram brand colors
  INSTAGRAM_PURPLE: rgbToBGR(193, 53, 132), // #C13584
  INSTAGRAM_ORANGE: rgbToBGR(253, 87, 48), // #FD5730

  // Subtle colors
  LIGHT_GRAY: rgbToBGR(200, 200, 200),
  DARK_GRAY: rgbToBGR(50, 50, 50),
  OFF_WHITE: rgbToBGR(245, 245, 245),
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format seconds to ASS time format: h:mm:ss.cc
 *
 * ASS uses centiseconds (1/100th of a second) for precision
 *
 * @param seconds - Time in seconds (can be decimal)
 * @returns Formatted time string
 *
 * @example
 * formatASSTime(0) // "0:00:00.00"
 * formatASSTime(65.5) // "0:01:05.50"
 * formatASSTime(3661.23) // "1:01:01.23"
 */
export function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const cs = Math.floor((seconds % 1) * 100) // centiseconds

  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

/**
 * Parse ASS time format to seconds
 *
 * @param timeStr - ASS time string (h:mm:ss.cc)
 * @returns Time in seconds
 */
export function parseASSTime(timeStr: string): number {
  const parts = timeStr.split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const secParts = parts[2].split('.')
  const s = parseInt(secParts[0], 10)
  const cs = parseInt(secParts[1], 10)

  return h * 3600 + m * 60 + s + cs / 100
}

/**
 * Calculate karaoke duration in centiseconds
 *
 * Used for \k tags in ASS karaoke effect
 *
 * @param startSec - Word start time in seconds
 * @param endSec - Word end time in seconds
 * @returns Duration in centiseconds
 *
 * @example
 * calculateKaraokeDuration(1.5, 2.0) // 50 (0.5 seconds = 50 centiseconds)
 */
export function calculateKaraokeDuration(startSec: number, endSec: number): number {
  return Math.round((endSec - startSec) * 100)
}

// ============================================================================
// ASS Style Presets
// ============================================================================

/**
 * TikTok Style - Bold yellow highlighting with Impact font
 *
 * Characteristics:
 * - Impact font (bold, condensed)
 * - Large font size (60pt)
 * - Yellow primary with black outline
 * - Karaoke effect highlights words as they play
 * - Bottom-center alignment
 */
const TIKTOK_STYLE: ASSStyle = {
  Name: 'TikTok',
  Fontname: 'Impact',
  Fontsize: 60,
  PrimaryColour: ASSColors.WHITE, // Text starts white
  SecondaryColour: ASSColors.TIKTOK_YELLOW, // Karaoke fills with yellow
  OutlineColour: ASSColors.BLACK, // Black outline
  BackColour: rgbToBGR(0, 0, 0, 128), // Semi-transparent shadow
  Bold: -1, // Bold
  Italic: 0,
  Underline: 0,
  StrikeOut: 0,
  ScaleX: 100,
  ScaleY: 100,
  Spacing: 0,
  Angle: 0,
  BorderStyle: 1, // Outline + drop shadow
  Outline: 4, // Thick outline
  Shadow: 2, // Medium shadow
  Alignment: 2, // Bottom-center
  MarginL: 50,
  MarginR: 50,
  MarginV: 50,
  Encoding: 1,
}

/**
 * Instagram Style - Clean white text with subtle outline
 *
 * Characteristics:
 * - Helvetica Neue (or Arial fallback)
 * - Medium font size (48pt)
 * - White text with dark outline
 * - Minimal shadow
 * - Bottom-center alignment
 */
const INSTAGRAM_STYLE: ASSStyle = {
  Name: 'Instagram',
  Fontname: 'Helvetica Neue',
  Fontsize: 48,
  PrimaryColour: ASSColors.WHITE,
  SecondaryColour: ASSColors.OFF_WHITE, // Subtle karaoke effect
  OutlineColour: ASSColors.DARK_GRAY,
  BackColour: rgbToBGR(0, 0, 0, 100),
  Bold: 0, // Regular weight
  Italic: 0,
  Underline: 0,
  StrikeOut: 0,
  ScaleX: 100,
  ScaleY: 100,
  Spacing: 0,
  Angle: 0,
  BorderStyle: 1,
  Outline: 2, // Thin outline
  Shadow: 1, // Light shadow
  Alignment: 2, // Bottom-center
  MarginL: 40,
  MarginR: 40,
  MarginV: 40,
  Encoding: 1,
}

/**
 * YouTube Style - Standard readable captions
 *
 * Characteristics:
 * - Arial font
 * - Medium font size (42pt)
 * - White text on semi-transparent black background
 * - No karaoke effect (static captions)
 * - Bottom-center alignment
 */
const YOUTUBE_STYLE: ASSStyle = {
  Name: 'YouTube',
  Fontname: 'Arial',
  Fontsize: 42,
  PrimaryColour: ASSColors.WHITE,
  SecondaryColour: ASSColors.WHITE, // No karaoke effect
  OutlineColour: ASSColors.BLACK,
  BackColour: rgbToBGR(0, 0, 0, 180), // More opaque background
  Bold: 0,
  Italic: 0,
  Underline: 0,
  StrikeOut: 0,
  ScaleX: 100,
  ScaleY: 100,
  Spacing: 0,
  Angle: 0,
  BorderStyle: 3, // Opaque box background
  Outline: 0, // No outline (box background instead)
  Shadow: 0, // No shadow
  Alignment: 2, // Bottom-center
  MarginL: 30,
  MarginR: 30,
  MarginV: 30,
  Encoding: 1,
}

/**
 * Focus Style - Large, bright emphasis for important words
 *
 * Characteristics:
 * - Impact font (bold)
 * - Extra large font size (70pt)
 * - Cyan color with thick outline
 * - Used for AI-detected focus words
 * - Bottom-center alignment
 */
const FOCUS_STYLE: ASSStyle = {
  Name: 'Focus',
  Fontname: 'Impact',
  Fontsize: 70,
  PrimaryColour: ASSColors.CYAN,
  SecondaryColour: ASSColors.TIKTOK_CYAN, // Bright cyan karaoke
  OutlineColour: ASSColors.BLACK,
  BackColour: rgbToBGR(0, 0, 0, 150),
  Bold: -1,
  Italic: 0,
  Underline: 0,
  StrikeOut: 0,
  ScaleX: 100,
  ScaleY: 100,
  Spacing: 2, // Slightly spaced
  Angle: 0,
  BorderStyle: 1,
  Outline: 5, // Extra thick outline
  Shadow: 3, // Strong shadow
  Alignment: 2, // Bottom-center
  MarginL: 50,
  MarginR: 50,
  MarginV: 60, // Slightly higher
  Encoding: 1,
}

// ============================================================================
// Preset Exports
// ============================================================================

/**
 * All available presets
 */
export const ASS_PRESETS: Record<string, PresetInfo> = {
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Bold yellow highlighting with Impact font (viral style)',
    style: TIKTOK_STYLE,
    focusStyle: FOCUS_STYLE,
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    description: 'Clean white text with subtle outline (stories style)',
    style: INSTAGRAM_STYLE,
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    description: 'Standard readable captions (accessibility focused)',
    style: YOUTUBE_STYLE,
  },
}

/**
 * Get preset by ID
 */
export function getPreset(presetId: string): PresetInfo {
  const preset = ASS_PRESETS[presetId]
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}. Available: ${Object.keys(ASS_PRESETS).join(', ')}`)
  }
  return preset
}

/**
 * Format ASS style definition for [V4+ Styles] section
 *
 * @param style - ASSStyle object
 * @returns Formatted style line
 */
export function formatStyleLine(style: ASSStyle): string {
  const fields = [
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
  ]

  return 'Style: ' + fields.join(',')
}

/**
 * Get default preset (TikTok)
 */
export function getDefaultPreset(): PresetInfo {
  return ASS_PRESETS.tiktok
}
