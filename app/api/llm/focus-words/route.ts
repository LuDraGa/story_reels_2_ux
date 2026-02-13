/**
 * POST /api/llm/focus-words
 *
 * AI-powered focus word detection using OpenAI GPT API
 *
 * This endpoint:
 * 1. Accepts full transcription text
 * 2. Uses GPT to identify important/emphatic words
 * 3. Returns word indices to emphasize in captions
 *
 * Use case: TikTok-style captions with key words highlighted
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// ============================================================================
// Types
// ============================================================================

interface FocusWordsRequest {
  text: string // Full transcription text
  maxWords?: number // Maximum number of words to emphasize (default: 5)
}

interface FocusWordsResponse {
  focusWords: number[] // Word indices (0-indexed)
  words: string[] // All words (for reference)
  reasoning?: string // Why these words were chosen (optional)
}

// ============================================================================
// OpenAI Client
// ============================================================================

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey === 'your-openai-api-key') {
    console.warn('[LLM] OPENAI_API_KEY not configured - focus word detection disabled')
    return null
  }

  return new OpenAI({
    apiKey,
  })
}

// ============================================================================
// Focus Word Detection Prompt
// ============================================================================

const FOCUS_WORDS_PROMPT = `You are a caption specialist for social media content. Your task is to identify the most important, attention-grabbing words in a transcript that should be visually emphasized in captions.

Guidelines for selecting focus words:
1. **Impact words**: Action verbs, emotional words, surprising statements
2. **Key nouns**: Main subjects, unique names, important concepts
3. **Emphasis markers**: Words that would naturally be stressed when spoken
4. **Storytelling peaks**: Words at climactic or pivotal moments
5. **Avoid**: Common words (the, a, is, it, this), filler words, conjunctions

You will be given:
- Full transcript text
- Maximum number of words to emphasize

You MUST respond with ONLY a JSON object in this exact format:
{
  "focusIndices": [2, 7, 15, 23, 31],
  "reasoning": "Brief explanation of why these words were chosen"
}

The indices should be 0-indexed word positions in the transcript.

Example:
Transcript: "My daughters have a strained relationship with each other"
Words: ["My", "daughters", "have", "a", "strained", "relationship", "with", "each", "other"]
Response: {"focusIndices": [1, 4, 5], "reasoning": "daughters (subject), strained (emotional impact), relationship (key concept)"}

Now identify focus words in the following transcript.`

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(req: NextRequest) {
  console.log('[LLM] Focus word detection request started')

  try {
    // Parse request body
    const body: FocusWordsRequest = await req.json()
    const { text, maxWords = 5 } = body

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    if (text.length < 10) {
      return NextResponse.json(
        { error: 'Text is too short (minimum 10 characters)' },
        { status: 400 }
      )
    }

    // Split text into words for reference
    const words = text.split(/\s+/).filter(w => w.length > 0)

    console.log('[LLM] Text analysis:', {
      wordCount: words.length,
      maxWords,
      textPreview: text.substring(0, 100) + '...',
    })

    // Check if API key is configured
    const openai = getOpenAIClient()

    if (!openai) {
      // Fallback: No LLM available, return empty focus words
      console.warn('[LLM] API key not configured, returning empty focus words')
      return NextResponse.json({
        focusWords: [],
        words,
        reasoning: 'LLM not configured - focus word detection disabled',
      })
    }

    // Call OpenAI GPT API
    console.log('[LLM] Calling OpenAI API...')
    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast, cost-effective model
      max_tokens: 500,
      temperature: 0.3, // Low temperature for consistent results
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: FOCUS_WORDS_PROMPT,
        },
        {
          role: 'user',
          content: `Transcript: "${text}"

Maximum focus words: ${maxWords}
Total words: ${words.length}

Respond with JSON only.`,
        },
      ],
    })

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('[LLM] OpenAI API response received:', {
      elapsedTime: `${elapsedTime}s`,
      model: completion.model,
      finishReason: completion.choices[0].finish_reason,
    })

    // Extract text from response
    const responseText = completion.choices[0].message.content || ''

    console.log('[LLM] Raw response:', responseText)

    // Parse JSON response
    let focusIndices: number[] = []
    let reasoning = ''

    try {
      // Try to extract JSON from response (handle code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      focusIndices = parsed.focusIndices || []
      reasoning = parsed.reasoning || ''

      // Validate indices
      focusIndices = focusIndices
        .filter((idx: number) => idx >= 0 && idx < words.length)
        .slice(0, maxWords) // Enforce max words limit

      console.log('[LLM] Parsed focus words:', {
        indices: focusIndices,
        words: focusIndices.map((idx: number) => words[idx]),
        reasoning,
      })
    } catch (parseError) {
      console.error('[LLM] Failed to parse Claude response:', parseError)
      console.error('[LLM] Raw response:', responseText)

      // Fallback: Return empty focus words
      return NextResponse.json({
        focusWords: [],
        words,
        reasoning: 'Failed to parse LLM response',
      })
    }

    // Return focus words
    return NextResponse.json({
      focusWords: focusIndices,
      words,
      reasoning,
    })
  } catch (error) {
    console.error('[LLM] Focus word detection error:', error)

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      console.error('[LLM] OpenAI API error:', {
        status: error.status,
        message: error.message,
        type: error.type,
      })

      // Rate limit error
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Please try again in a moment.',
            details: 'OpenAI API rate limit reached',
          },
          { status: 429 }
        )
      }

      // Auth error
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: 'Invalid API key. Please check OPENAI_API_KEY configuration.',
            details: 'OpenAI API authentication failed',
          },
          { status: 500 }
        )
      }
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to detect focus words',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Utility: Manual Focus Word Selection (Fallback)
// ============================================================================

/**
 * Simple heuristic-based focus word detection (no LLM)
 *
 * Used as fallback when LLM is not available or fails.
 * Selects words based on:
 * - Length (longer words tend to be more important)
 * - Position (words at key positions in sentences)
 * - Part of speech heuristics (avoid common stopwords)
 */
function selectFocusWordsHeuristic(
  words: string[],
  maxWords: number = 5
): number[] {
  // Common stopwords to avoid
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'it', 'its', 'they', 'them', 'their', 'my', 'your', 'his',
    'her', 'our', 'i', 'you', 'he', 'she', 'we',
  ])

  // Score each word
  const scores = words.map((word, idx) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')

    // Skip stopwords
    if (stopwords.has(cleanWord)) {
      return { idx, score: 0 }
    }

    // Score based on word length (longer = more important)
    let score = cleanWord.length

    // Bonus for capitalized words (proper nouns)
    if (word[0] === word[0].toUpperCase()) {
      score += 3
    }

    // Bonus for words with punctuation (often emphasis)
    if (/[!?.]/.test(word)) {
      score += 2
    }

    return { idx, score }
  })

  // Sort by score and take top N
  const topIndices = scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxWords)
    .map(s => s.idx)
    .sort((a, b) => a - b) // Sort by position

  return topIndices
}
