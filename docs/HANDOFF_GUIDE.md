# How to Create an Ideal Handoff Document

**Based on**: `HANDOFF_PHASE_2.md` (see root directory for example)

## Essential Sections

### 1. Context Header
```markdown
**Working Directory**: /full/path/to/project
**Node Version**: 20
**Package Manager**: pnpm
**Status**: Phase X COMPLETE | Ready for Phase Y
```

### 2. Original Project Vision
- Full detailed spec (prevents losing nuance)
- Core requirements
- Key constraints

### 3. What Was Built (Completed Phase)
- File-by-file list
- What works vs what doesn't
- Current state verification

### 4. What to Build Next (Next Phase)
- **Step-by-step sequence** (not just goals)
- **Code examples** for critical parts
- **Acceptance criteria** (specific, testable)

### 5. Pre-Phase Checklist
```bash
cd /path/to/project
nvm use 20
pnpm type-check  # Must pass
pnpm lint        # Must pass
pnpm dev         # Must start
```

### 6. Common Pitfalls
- List what NOT to do
- Specific gotchas from current phase

### 7. File Structure Map
- Complete tree of created files
- Easy navigation

### 8. Key Decisions Log
- Why choices were made
- Prevents second-guessing

### 9. Critical Code Examples
- Binary data handling
- Auth patterns
- Storage uploads
- API request/response formats

### 10. Testing Strategy
- How to verify each step
- Curl examples
- Expected outputs

## What to AVOID

❌ **Too abstract** - "Implement API integration" (unclear)
✅ **Specific** - "Fetch binary audio, convert to ArrayBuffer, upload to Supabase"

❌ **Missing dependencies** - "Build endpoints" (which order?)
✅ **Sequenced** - "1. Health check (tests connection), 2. Speakers (need for TTS), 3. TTS"

❌ **No examples** - "Handle errors gracefully"
✅ **With code** - "Try/catch with exponential backoff (code example)"

❌ **Generic acceptance** - "Endpoint works"
✅ **Testable** - "Returns 200, stores file, URL plays audio"

## Template

```markdown
# Phase X → Phase Y Handoff

**Working Dir**: /path
**Node**: 20
**Status**: Phase X COMPLETE

## Original Vision
[Full spec]

## Phase X Complete
- File 1: What it does
- File 2: What it does

**Works**: [list]
**Doesn't work**: [list]

## Phase Y: Step-by-Step
### Step 1: Thing (time estimate)
[Code example]
[Test command]

### Step 2: Thing (time estimate)
...

## Pre-Phase Checklist
- [ ] Command 1
- [ ] Command 2

## Common Pitfalls
1. Don't do X
2. Remember Y

## File Structure
[Tree]

## Critical Examples
[Code snippets]
```

## When to Create Handoff

1. **Context running low** (<10% remaining)
2. **Natural phase boundary** (foundation → integration → features)
3. **Complex next phase** (needs fresh focus)
4. **Before deploying** (document current state)

See `HANDOFF_PHASE_2.md` for real example.
