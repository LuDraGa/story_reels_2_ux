# Planning: Reel Story Studio - Full Build

**Date**: 2025-02-07
**Task**: Build complete modular story→audio→reel pipeline web application
**Status**: Planning Phase

---

## Context & Problem Statement

Build a production-lean "Reel Story Studio" web app with:
- **Two modes**: One-off Studio (no login, localStorage) + Authenticated Projects (Supabase-backed)
- **Modular pipeline**: Ingest → Script → TTS → Video → Export (run independently OR end-to-end)
- **External API**: Modal Coqui TTS (already exists - integrate only)
- **Design**: Calm, minimalist aesthetic (Lovable-style portfolio)

This is a complex, multi-phase project requiring careful sequencing.

---

## Key Questions for User

### 1. Development Approach
**Question**: Should we build this in phases (recommended) or attempt all at once?

**Recommendation**: **Phased approach** - Build and test incrementally. Each phase delivers working functionality.

**Proposed Phases**:
1. **Foundation** - Project setup, Supabase, basic structure
2. **Auth & UI Base** - Login, design system, routing
3. **API Integration** - Modal Coqui wrappers, storage
4. **One-Off Studio** - Public flow (localStorage-based)
5. **Authenticated Flow** - Dashboard, projects, versioning
6. **Pipeline Modules** - UI components for 5 modules
7. **Job Queue** - Async rendering, status tracking
8. **Assets & Export** - Background manager, downloads
9. **Polish** - Error handling, loading states, testing

### 2. Starting Phase
**Question**: Which phase should we start with?

**Options**:
- **A) Foundation First** (recommended) - Setup project structure, Supabase, migrations
- **B) Auth First** - Get login working immediately
- **C) API First** - Integrate Modal Coqui API wrappers
- **D) UI First** - Build design system and layout

**Recommendation**: **A) Foundation First** - Establish solid base before building features.

### 3. Supabase Setup
**Question**: Do you already have a Supabase project, or should we include setup instructions?

**If existing**: Need project URL and keys.
**If new**: We'll include Supabase project creation steps.

### 4. Auth Strategy
**Question**: Magic link OR email+password for authentication?

**Options**:
- **Magic link** - Passwordless, better UX, simpler
- **Email+password** - Traditional, more control

**Recommendation**: **Magic link** (simpler, better UX for MVP).

### 5. Script Generation
**Question**: How should script generation work in the "Script" module?

**Options**:
- **A) Manual editing only** - User types/edits script (simpler for MVP)
- **B) AI-powered generation** - Call OpenAI/Claude API to generate from source
- **C) Template-based** - Fill-in-the-blanks structure

**Recommendation**: **A) Manual editing for MVP** - Keep scope focused. Add AI later if needed.

### 6. Video Rendering
**Question**: For initial build, implement stub renderer or real FFmpeg integration?

**Recommendation**: **Stub renderer** (as specified) - Simulate progress, output placeholder. Add TODO comments for FFmpeg. Real rendering is complex and should be Phase 10+.

---

## Proposed Approach - Phase 1: Foundation

**Goal**: Establish project structure, Supabase integration, database schema.

**What We'll Build**:
1. Initialize Next.js 14 with TypeScript, Tailwind, shadcn/ui
2. Setup pnpm workspace
3. Create folder structure (app routes, lib, components, etc.)
4. Setup Supabase client (browser + server with @supabase/ssr)
5. Create database migration (8 tables + RLS policies)
6. Configure environment variables
7. Setup middleware for auth protection
8. Create basic layout with design system
9. Verify Supabase connection

**Deliverables**:
- ✅ Working Next.js app
- ✅ Supabase connected (DB + Storage)
- ✅ Database schema created
- ✅ Auth middleware in place
- ✅ Basic routing structure
- ✅ Design system foundation (colors, typography, card styles)

**Testing**:
- `pnpm dev` runs without errors
- Can navigate to routes
- Supabase connection healthy
- Can view empty database tables

**Dependencies**: None (starting fresh)

**Time Estimate**: 2-4 hours of focused work

---

## Design Alternatives Considered

### Alternative 1: Monolithic Approach
**Pros**: Build everything at once, see full picture
**Cons**: High risk, hard to debug, overwhelming scope
**Decision**: ❌ Rejected - Too risky for large project

### Alternative 2: UI-First Approach
**Pros**: Quick visual feedback, design validation
**Cons**: Mock data needed, rework when integrating real backend
**Decision**: ❌ Rejected - Leads to throwaway work

### Alternative 3: Phased Incremental Approach (CHOSEN)
**Pros**: Working features at each step, easier debugging, test as you go
**Cons**: Requires patience, less "immediate gratification"
**Decision**: ✅ **CHOSEN** - Best balance of speed and quality

---

## Open Questions & Discussion Points

1. **Supabase Project**: New or existing? Need credentials?
2. **Auth Method**: Magic link (recommended) or email+password?
3. **Script Generation**: Manual editing only for MVP?
4. **Modal API Access**: Do you have access to the Coqui API? Can we test it?
5. **Starting Phase**: Confirm Phase 1 (Foundation) is the right starting point?
6. **Design Preferences**: Any specific color values for sage/lavender/mist-blue accents?

---

## Dependencies & Assumptions

**Dependencies**:
- Node.js 20+ installed
- pnpm installed (`npm i -g pnpm`)
- Supabase account (free tier is fine)
- Access to Modal Coqui API (for TTS integration later)

**Assumptions**:
- User will run `pnpm dev` and `pnpm build` (not Claude)
- User will create Supabase project and provide credentials
- User will test manually at each phase
- Video rendering will be stubbed initially (real FFmpeg later)
- localStorage persistence is acceptable for one-off studio

---

## Success Criteria - Phase 1

**Phase 1 is successful when**:
- ✅ Next.js app runs with no errors
- ✅ All routes render (even if empty)
- ✅ Supabase connection works (can query empty tables)
- ✅ Middleware redirects `/app/*` to `/login` when not authenticated
- ✅ Design system styles applied (off-white bg, rounded cards, muted colors)
- ✅ TypeScript type checking passes
- ✅ ESLint passes

---

## Rationale for Chosen Approach

**Why Phase 1 first?**
- Establishes foundation that all other features depend on
- Validates Supabase setup early (catches config issues)
- Creates structure that guides remaining work
- Allows testing of auth flow before building features
- Design system in place for consistent UI development

**Why not start with API integration?**
- API needs somewhere to store results (Supabase Storage)
- API routes need auth context (middleware)
- Better to have solid foundation first

**Why not start with UI?**
- UI needs real data structure (database schema)
- Components need routing structure (app folder)
- Design system can be built alongside foundation

---

## Next Steps (After User Approval)

1. **User provides**:
   - Supabase project credentials (URL, anon key, service role key)
   - Confirmation of auth method (magic link vs email+password)
   - Confirmation to proceed with Phase 1
   - Any design color preferences

2. **We execute**:
   - Initialize Next.js project
   - Setup Supabase integration
   - Create database migration
   - Build basic routing and layout
   - Apply design system
   - Test and verify

3. **User tests**:
   - Run `pnpm dev`
   - Visit routes
   - Verify design aesthetic
   - Confirm ready for Phase 2

---

## Risk Assessment

**Low Risk**:
- ✅ Next.js setup (well-documented)
- ✅ Tailwind + shadcn/ui (standard tools)
- ✅ Supabase integration (good docs, stable)

**Medium Risk**:
- ⚠️ Database schema complexity (8 tables, RLS policies) - Mitigated by careful migration file
- ⚠️ Modal API integration - Mitigated by building in later phase, after foundation solid
- ⚠️ localStorage persistence - Mitigated by simple JSON serialization

**High Risk**:
- 🔴 Video rendering - Mitigated by stubbing initially, real implementation later
- 🔴 Scope creep - Mitigated by phased approach, clear boundaries

---

## User Decision Required

**Please confirm**:
1. ✅ Proceed with **phased approach**? (vs all-at-once)
2. ✅ Start with **Phase 1: Foundation**?
3. ✅ Use **magic link** for auth? (vs email+password)
4. ✅ **Manual script editing** for MVP? (vs AI generation)
5. ✅ **Stub video renderer** initially? (vs real FFmpeg)
6. ✅ **Use dummy Supabase credentials** for now (real ones added on Vercel deployment)
7. ✅ **Design system defined** (based on WereCode 60-30-10 rule) - see `docs/DESIGN_SYSTEM.md`
   - **60% Primary**: Off-white/cream backgrounds (primary-100 to primary-900)
   - **30% Secondary**: Soft grays for text (secondary-500 body, secondary-700 headings)
   - **10% Accent**: Sage (primary), Lavender (secondary), Mist Blue (tertiary)
   - **Typography**: Space Grotesk (display), Inter (sans), JetBrains Mono (mono)
   - **Implementation**: All tokens in `tailwind.config.ts` (edit once, change everywhere)

Once confirmed, we'll move to `execution.md` and start building Phase 1! 🚀
