/**
 * ASS Parser Tests
 *
 * Tests for parsing and serializing ASS subtitle files
 */

import {
  parseASS,
  serializeASS,
  stripASSTags,
  getCaptionAtTime,
  sortCaptionsByTime,
  getTotalDuration,
  captionsOverlap,
  validateParsedASS,
  ASSParseError,
} from '../ass-parser'

// Sample ASS file content (minimal valid ASS)
const SAMPLE_ASS = `[Script Info]
Title: Test Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Hello world
Dialogue: 0,0:00:02.00,0:00:04.00,Default,,0,0,0,,{\\k50}This{\\k30}has{\\k40}karaoke
Dialogue: 0,0:00:04.00,0:00:06.00,Default,,0,0,0,,Final caption
`

describe('ASS Parser', () => {
  describe('parseASS', () => {
    it('should parse valid ASS file', () => {
      const parsed = parseASS(SAMPLE_ASS)

      expect(parsed).toBeDefined()
      expect(parsed.scriptInfo).toBeDefined()
      expect(parsed.styles).toBeDefined()
      expect(parsed.captions).toBeDefined()
    })

    it('should parse Script Info section', () => {
      const parsed = parseASS(SAMPLE_ASS)

      expect(parsed.scriptInfo['Title']).toBe('Test Captions')
      expect(parsed.scriptInfo['ScriptType']).toBe('v4.00+')
      expect(parsed.scriptInfo['PlayResX']).toBe('1080')
      expect(parsed.scriptInfo['PlayResY']).toBe('1920')
    })

    it('should parse Styles section', () => {
      const parsed = parseASS(SAMPLE_ASS)

      expect(parsed.styles).toHaveLength(1)
      expect(parsed.styles[0].Name).toBe('Default')
      expect(parsed.styles[0].Fontname).toBe('Arial')
      expect(parsed.styles[0].Fontsize).toBe(48)
      expect(parsed.styles[0].Alignment).toBe(2)
    })

    it('should parse Events section', () => {
      const parsed = parseASS(SAMPLE_ASS)

      expect(parsed.captions).toHaveLength(3)
      expect(parsed.captions[0].text).toBe('Hello world')
      expect(parsed.captions[0].plainText).toBe('Hello world')
      expect(parsed.captions[1].text).toBe('{\\k50}This{\\k30}has{\\k40}karaoke')
      expect(parsed.captions[1].plainText).toBe('Thishaskaraoke')
    })

    it('should parse timing correctly', () => {
      const parsed = parseASS(SAMPLE_ASS)

      expect(parsed.captions[0].start).toBe(0)
      expect(parsed.captions[0].end).toBe(2)
      expect(parsed.captions[1].start).toBe(2)
      expect(parsed.captions[1].end).toBe(4)
    })

    it('should throw error for empty content', () => {
      expect(() => parseASS('')).toThrow(ASSParseError)
      expect(() => parseASS('')).toThrow('non-empty string')
    })

    it('should throw error for invalid content', () => {
      expect(() => parseASS('not a valid ass file')).toThrow(ASSParseError)
    })

    it('should handle comments and empty lines', () => {
      const assWithComments = `[Script Info]
; This is a comment
Title: Test

; Another comment

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&H00000000&,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Test
`

      const parsed = parseASS(assWithComments)
      expect(parsed.scriptInfo['Title']).toBe('Test')
      expect(parsed.captions).toHaveLength(1)
    })
  })

  describe('serializeASS', () => {
    it('should serialize back to ASS format', () => {
      const parsed = parseASS(SAMPLE_ASS)
      const serialized = serializeASS(parsed)

      expect(serialized).toContain('[Script Info]')
      expect(serialized).toContain('[V4+ Styles]')
      expect(serialized).toContain('[Events]')
      expect(serialized).toContain('Dialogue:')
    })

    it('should be reversible (parse → serialize → parse)', () => {
      const parsed1 = parseASS(SAMPLE_ASS)
      const serialized = serializeASS(parsed1)
      const parsed2 = parseASS(serialized)

      expect(parsed2.captions).toHaveLength(parsed1.captions.length)
      expect(parsed2.styles).toHaveLength(parsed1.styles.length)
      expect(parsed2.captions[0].text).toBe(parsed1.captions[0].text)
    })

    it('should preserve modifications', () => {
      const parsed = parseASS(SAMPLE_ASS)

      // Modify a caption
      parsed.captions[0].plainText = 'Modified text'
      parsed.captions[0].text = 'Modified text'

      const serialized = serializeASS(parsed)
      const reparsed = parseASS(serialized)

      expect(reparsed.captions[0].text).toBe('Modified text')
    })
  })

  describe('stripASSTags', () => {
    it('should remove simple tags', () => {
      expect(stripASSTags('{\\k50}hello')).toBe('hello')
      expect(stripASSTags('{\\r}test')).toBe('test')
    })

    it('should remove multiple tags', () => {
      expect(stripASSTags('{\\k50}hello{\\k30}world')).toBe('helloworld')
    })

    it('should remove complex tags', () => {
      expect(stripASSTags('{\\r\\fs70\\c&H00FFFF&}focus{\\r}normal')).toBe('focusnormal')
    })

    it('should handle text without tags', () => {
      expect(stripASSTags('plain text')).toBe('plain text')
    })

    it('should handle empty string', () => {
      expect(stripASSTags('')).toBe('')
    })
  })

  describe('validateParsedASS', () => {
    it('should validate correct ASS', () => {
      const parsed = parseASS(SAMPLE_ASS)
      expect(() => validateParsedASS(parsed)).not.toThrow()
    })

    it('should reject ASS without styles', () => {
      const parsed = parseASS(SAMPLE_ASS)
      parsed.styles = []

      expect(() => validateParsedASS(parsed)).toThrow('at least one style')
    })

    it('should reject ASS without captions', () => {
      const parsed = parseASS(SAMPLE_ASS)
      parsed.captions = []

      expect(() => validateParsedASS(parsed)).toThrow('at least one caption')
    })

    it('should reject caption with negative start time', () => {
      const parsed = parseASS(SAMPLE_ASS)
      parsed.captions[0].start = -1

      expect(() => validateParsedASS(parsed)).toThrow('cannot be negative')
    })

    it('should reject caption with end <= start', () => {
      const parsed = parseASS(SAMPLE_ASS)
      parsed.captions[0].end = parsed.captions[0].start

      expect(() => validateParsedASS(parsed)).toThrow('must be after start')
    })

    it('should reject caption with invalid style', () => {
      const parsed = parseASS(SAMPLE_ASS)
      parsed.captions[0].style = 'NonexistentStyle'

      expect(() => validateParsedASS(parsed)).toThrow('style')
      expect(() => validateParsedASS(parsed)).toThrow('not found')
    })
  })

  describe('Utility functions', () => {
    let parsed: ReturnType<typeof parseASS>

    beforeEach(() => {
      parsed = parseASS(SAMPLE_ASS)
    })

    describe('getCaptionAtTime', () => {
      it('should find caption at given time', () => {
        const caption = getCaptionAtTime(parsed.captions, 1)
        expect(caption).toBeDefined()
        expect(caption?.text).toBe('Hello world')
      })

      it('should return null if no caption at time', () => {
        const caption = getCaptionAtTime(parsed.captions, 10)
        expect(caption).toBeNull()
      })

      it('should find caption at exact start time', () => {
        const caption = getCaptionAtTime(parsed.captions, 2)
        expect(caption?.plainText).toBe('Thishaskaraoke')
      })
    })

    describe('sortCaptionsByTime', () => {
      it('should sort captions by start time', () => {
        const unsorted = [
          { ...parsed.captions[2], start: 4 },
          { ...parsed.captions[0], start: 0 },
          { ...parsed.captions[1], start: 2 },
        ]

        const sorted = sortCaptionsByTime(unsorted)

        expect(sorted[0].start).toBe(0)
        expect(sorted[1].start).toBe(2)
        expect(sorted[2].start).toBe(4)
      })
    })

    describe('getTotalDuration', () => {
      it('should return end time of last caption', () => {
        const duration = getTotalDuration(parsed.captions)
        expect(duration).toBe(6) // Last caption ends at 6 seconds
      })

      it('should return 0 for empty array', () => {
        const duration = getTotalDuration([])
        expect(duration).toBe(0)
      })
    })

    describe('captionsOverlap', () => {
      it('should detect overlapping captions', () => {
        const caption1 = { ...parsed.captions[0], start: 0, end: 3 }
        const caption2 = { ...parsed.captions[1], start: 2, end: 5 }

        expect(captionsOverlap(caption1, caption2)).toBe(true)
      })

      it('should detect non-overlapping captions', () => {
        const caption1 = { ...parsed.captions[0], start: 0, end: 2 }
        const caption2 = { ...parsed.captions[1], start: 2, end: 4 }

        expect(captionsOverlap(caption1, caption2)).toBe(false)
      })

      it('should handle touching captions', () => {
        const caption1 = { ...parsed.captions[0], start: 0, end: 2 }
        const caption2 = { ...parsed.captions[1], start: 2, end: 4 }

        // Touching but not overlapping
        expect(captionsOverlap(caption1, caption2)).toBe(false)
      })
    })
  })
})
