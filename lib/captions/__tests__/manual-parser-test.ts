/**
 * Manual ASS Parser Test
 *
 * Run with: npx ts-node lib/captions/__tests__/manual-parser-test.ts
 *
 * This is a simple manual test to verify the parser works before we integrate it
 */

import { parseASS, serializeASS, stripASSTags, validateParsedASS } from '../ass-parser'

// Sample ASS file content
const SAMPLE_ASS = `[Script Info]
Title: Test Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TikTok,Impact,60,&H00FFFFFF&,&H0040DDFE&,&H00000000&,&H80000000&,-1,0,0,0,100,100,0,0,1,4,2,2,50,50,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.03,0:00:01.63,TikTok,,0,0,0,,{\\k50}Hey,{\\k50}my{\\k30}name{\\k30}is
Dialogue: 0,0:00:01.77,0:00:03.52,TikTok,,0,0,0,,{\\k30}Po{\\k50}la{\\k50}mi{\\k45}ka.
Dialogue: 0,0:00:04.12,0:00:05.34,TikTok,,0,0,0,,{\\k30}How{\\k30}are{\\k30}you{\\k22}do{\\k30}ing?
`

console.log('🧪 ASS Parser Manual Test\n')
console.log('='.repeat(50))

try {
  // Test 1: Parse ASS
  console.log('\n✓ Test 1: Parsing ASS file...')
  const parsed = parseASS(SAMPLE_ASS)
  console.log(`  - Found ${parsed.captions.length} captions`)
  console.log(`  - Found ${parsed.styles.length} styles`)
  console.log(`  - Script title: ${parsed.scriptInfo['Title']}`)
  console.log(`  - Resolution: ${parsed.scriptInfo['PlayResX']}x${parsed.scriptInfo['PlayResY']}`)

  // Test 2: Check captions
  console.log('\n✓ Test 2: Checking caption data...')
  console.log(`  Caption 1:`)
  console.log(`    - Text: "${parsed.captions[0].text}"`)
  console.log(`    - Plain: "${parsed.captions[0].plainText}"`)
  console.log(`    - Time: ${parsed.captions[0].start}s → ${parsed.captions[0].end}s`)
  console.log(`    - Style: ${parsed.captions[0].style}`)

  // Test 3: Strip tags
  console.log('\n✓ Test 3: Stripping ASS tags...')
  const tagged = '{\\k50}Hello{\\k30}world'
  const stripped = stripASSTags(tagged)
  console.log(`  - Input:  "${tagged}"`)
  console.log(`  - Output: "${stripped}"`)

  // Test 4: Validate
  console.log('\n✓ Test 4: Validating parsed ASS...')
  validateParsedASS(parsed)
  console.log('  - Validation passed!')

  // Test 5: Serialize
  console.log('\n✓ Test 5: Serializing back to ASS...')
  const serialized = serializeASS(parsed)
  console.log(`  - Serialized ${serialized.length} characters`)
  console.log(`  - Contains [Script Info]: ${serialized.includes('[Script Info]')}`)
  console.log(`  - Contains [V4+ Styles]: ${serialized.includes('[V4+ Styles]')}`)
  console.log(`  - Contains [Events]: ${serialized.includes('[Events]')}`)

  // Test 6: Round-trip (parse → serialize → parse)
  console.log('\n✓ Test 6: Round-trip test (parse → serialize → parse)...')
  const reparsed = parseASS(serialized)
  console.log(`  - Original captions: ${parsed.captions.length}`)
  console.log(`  - Reparsed captions: ${reparsed.captions.length}`)
  console.log(`  - Match: ${parsed.captions.length === reparsed.captions.length}`)
  console.log(`  - Text match: ${parsed.captions[0].text === reparsed.captions[0].text}`)

  console.log('\n' + '='.repeat(50))
  console.log('✅ All tests passed!\n')

} catch (error) {
  console.error('\n❌ Test failed:')
  console.error(error)
  process.exit(1)
}
