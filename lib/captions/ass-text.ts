/**
 * ASS Text Utilities
 *
 * Helpers to convert ASS text (with tags) into readable plain text
 * for editor display.
 */

const PUNCTUATION_START = /^[,.:!?)}\]]/

export function assTextToPlain(text: string): string {
  if (!text) return ''
  const normalized = text.replace(/\\N/gi, '\n').replace(/\\h/gi, ' ')
  const segments = normalized.split(/\{[^}]*\}/g)

  let output = ''
  for (const segment of segments) {
    if (!segment) continue
    const needsSpace =
      output.length > 0 &&
      !/\s$/.test(output) &&
      !/^\s/.test(segment) &&
      !PUNCTUATION_START.test(segment)
    if (needsSpace) {
      output += ' '
    }
    output += segment
  }

  return output
}
