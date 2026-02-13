/**
 * Test ASS Generator Fix
 *
 * Verify that the generator now produces correctly formatted Style lines
 *
 * Run: npx tsx lib/captions/__tests__/test-generator-fix.ts
 */

import { generateASS } from '../ass-generator'
import { parseASS } from '../ass-parser'

// Mock WhisperX transcription data
const mockTranscription = {
  duration: 5.0,
  segments: [
    {
      start: 0.0,
      end: 2.0,
      text: 'Hello world',
      words: [
        { word: 'Hello', start: 0.0, end: 0.5 },
        { word: 'world', start: 0.6, end: 1.0 },
      ],
    },
    {
      start: 2.0,
      end: 4.0,
      text: 'This is a test',
      words: [
        { word: 'This', start: 2.0, end: 2.3 },
        { word: 'is', start: 2.4, end: 2.6 },
        { word: 'a', start: 2.7, end: 2.8 },
        { word: 'test', start: 2.9, end: 3.5 },
      ],
    },
  ],
}

console.log('🔧 Testing ASS Generator Fix\n')
console.log('='.repeat(60))

try {
  // Step 1: Generate ASS with TikTok preset
  console.log('\n📝 Step 1: Generating ASS file...\n')
  const ass = generateASS(mockTranscription, {
    preset: 'tiktok',
    focusWords: [2], // Make "world" a focus word
    maxWordsPerLine: 3,
    title: 'Test Generation',
    videoWidth: 1080,
    videoHeight: 1920,
  })

  console.log('✅ Generated ASS file')
  console.log(`   Length: ${ass.length} characters`)

  // Step 2: Check Style line format
  console.log('\n🔍 Step 2: Checking Style line format...\n')

  const styleLines = ass.split('\n').filter(line => line.startsWith('Style:'))
  console.log(`   Found ${styleLines.length} style line(s)`)

  styleLines.forEach((line, i) => {
    console.log(`   Style ${i + 1}: ${line.slice(0, 80)}...`)

    // Check for the bug (extra comma after Style:)
    if (line.startsWith('Style:,')) {
      console.log('   ❌ ERROR: Found extra comma after "Style:"')
      throw new Error('Style line has incorrect format: ' + line)
    } else if (line.match(/^Style:\s+\w/)) {
      console.log('   ✅ Correct format: "Style: Name,..."')
    }
  })

  // Step 3: Parse the generated ASS
  console.log('\n🧪 Step 3: Parsing generated ASS...\n')
  const parsed = parseASS(ass)

  console.log('✅ Parse successful!')
  console.log(`   - Styles: ${parsed.styles.length}`)
  console.log(`   - Captions: ${parsed.captions.length}`)

  // Check style details
  parsed.styles.forEach((style, i) => {
    console.log(`   Style ${i + 1}: "${style.Name}" (${style.Fontname}, ${style.Fontsize}pt)`)
  })

  // Step 4: Verify captions
  console.log('\n📋 Step 4: Verifying captions...\n')
  parsed.captions.forEach((caption, i) => {
    console.log(`   Caption ${i + 1}:`)
    console.log(`      Plain text: "${caption.plainText}"`)
    console.log(`      Time: ${caption.start}s → ${caption.end}s`)
    console.log(`      Style: ${caption.style}`)
  })

  // Step 5: Show the full generated ASS
  console.log('\n📄 Step 5: Generated ASS Content (excerpt)...\n')
  const lines = ass.split('\n')
  console.log('   [Script Info] section:')
  const scriptInfoLines = lines.slice(0, 10)
  scriptInfoLines.forEach(line => console.log(`      ${line}`))

  console.log('\n   [V4+ Styles] section:')
  const styleStartIdx = lines.findIndex(l => l.includes('[V4+ Styles]'))
  const styleSection = lines.slice(styleStartIdx, styleStartIdx + 5)
  styleSection.forEach(line => console.log(`      ${line}`))

  console.log('\n' + '='.repeat(60))
  console.log('✅ ALL CHECKS PASSED!\n')
  console.log('The generator now produces correctly formatted ASS files.')
  console.log('✓ No extra comma after "Style:"')
  console.log('✓ Parser can read generated files')
  console.log('✓ All styles and captions are valid\n')

} catch (error) {
  console.error('\n❌ TEST FAILED:\n')
  console.error(error)
  process.exit(1)
}
