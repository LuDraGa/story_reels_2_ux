# Execution: Auth Overhaul + Landing Pages + Schema Scoping

**Date**: 2026-04-03
**Status**: CODE COMPLETE — awaiting manual Supabase/Vercel steps

---

## Completed

### Phase 1: DB Schema Migration
- [x] `supabase/migrations/20260403000001_story_reels_schema.sql`
  - Creates `story_reels` schema
  - Grants USAGE to anon, authenticated, service_role
  - Recreates all 7 tables in `story_reels` schema with full RLS policies
  - Drops old `public` schema tables (test data)

### Phase 2: Supabase Client Updates
- [x] `lib/supabase/client.ts` — added `db: { schema: 'story_reels' }`
- [x] `lib/supabase/server.ts` — added `db: { schema: 'story_reels' }`
- [x] `lib/supabase/middleware.ts` — added `db: { schema: 'story_reels' }`
- [x] `app/auth/callback/route.ts` — added `db: { schema: 'story_reels' }`

### Phase 3: Middleware Auth Guard
- [x] `/app` itself is now open to all (unauthed users can use the studio)
- [x] Only `/app/projects/*`, `/app/assets`, `/app/queue` redirect to `/login` if unauthed

### Phase 4: Google OAuth Login
- [x] `app/login/page.tsx` — replaced magic link form with Google OAuth button
  - Uses `supabase.auth.signInWithOAuth({ provider: 'google' })`
  - Redirects to `/auth/callback` after OAuth
  - "← Back to Studio" link to `/app`

### Phase 5: Marketing Pages
- [x] `app/(public)/layout.tsx` — bare wrapper (OfficialPageShell handles bg)
- [x] `components/site/official-page-shell.tsx` — nav + hero + content shell
- [x] `components/site/official-footer.tsx` — footer with legal links
- [x] `app/(public)/page.tsx` — marketing landing (features grid + Launch App CTA)
- [x] `app/(public)/contact/page.tsx`
- [x] `app/(public)/terms-and-conditions/page.tsx`
- [x] `app/(public)/refund-and-cancellation-policy/page.tsx`
- [x] `app/globals.css` — added `official-*` CSS classes (story_reels design tokens)

### Phase 6: Studio at /app with Conditional Auth
- [x] `app/(app)/app/page.tsx` — studio always visible + conditional projects section
  - Unauthed: studio + "Sign in to save projects" CTA card
  - Authed: studio + full projects dashboard below
- [x] `app/(app)/layout.tsx` — nav conditionally shows Sign In or Sign Out based on session
  - Assets/Queue nav links only visible when logged in

---

## Route Map (Final)

| Route | Access | Content |
|-------|--------|---------|
| `/` | Everyone | Marketing landing page |
| `/contact` | Everyone | Contact info |
| `/terms-and-conditions` | Everyone | Terms of service |
| `/refund-and-cancellation-policy` | Everyone | Refund policy |
| `/login` | Unauthed | Google OAuth button |
| `/auth/callback` | System | OAuth code exchange |
| `/app` | Everyone | Studio + conditional projects |
| `/app/projects/[id]` | Authed only | Project workspace |
| `/app/assets` | Authed only | Background video manager |
| `/app/queue` | Authed only | Render queue |

---

## MANUAL STEPS REQUIRED (see user notification)

1. Supabase: expose `story_reels` schema in API settings
2. Supabase: enable Google OAuth provider
3. Google Cloud Console: set up OAuth client
4. Run `supabase db push`
5. Vercel: deploy + set env vars + update auth redirect URLs
