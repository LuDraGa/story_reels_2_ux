# Planning: Auth Overhaul + Landing Pages + Schema Scoping

**Date**: 2026-04-03
**Status**: AWAITING APPROVAL

---

## Objective

1. Replace magic link auth with Google OAuth (same pattern as storyWeaver)
2. Scope DB to `story_reels` Postgres schema (isolate from other projects in same Supabase account)
3. Add marketing landing pages: Home, Contact, Terms, Refund (same structure as storyWeaver, story_reels design)
4. Clear separation: `/` = marketing landing, `/app/*` = auth-gated tool

---

## Architecture Decisions

### Route Structure (After)
```
/                           → Marketing landing page (NEW)
/contact                    → Contact page (NEW)
/terms-and-conditions       → Terms page (NEW)
/refund-and-cancellation-policy → Refund page (NEW)
/login                      → Google OAuth button (MODIFIED - remove magic link)
/auth/callback              → Unchanged (already handles OAuth code exchange)
/app/*                      → Auth-gated tool (UNCHANGED)
```

**Note**: One-off studio (current `/`) is retired. Clear separation between landing and app. Login prompt lives on app pages (middleware redirect to `/login`).

### DB Schema Scoping
- All app tables move to `story_reels` Postgres schema (was `public`)
- Old `public` tables dropped in migration (test data only, no migration needed)
- Supabase clients get `db: { schema: 'story_reels' }` option
- Mirrors storyWeaver pattern exactly (`db: { schema: 'storyweaver' }`)

### Design
- Marketing pages use story_reels design system (Space Grotesk, sage/lavender/mist palette, rounded cards)
- NOT copying storyWeaver's retro cream/Press Start 2P aesthetic
- Same CSS class naming pattern (`official-*`) for structural consistency

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `supabase/migrations/20260403000001_story_reels_schema.sql` | New schema + tables + RLS + permissions |
| `components/site/official-page-shell.tsx` | Shared layout shell for marketing pages |
| `components/site/official-footer.tsx` | Footer component |
| `app/(public)/contact/page.tsx` | Contact page |
| `app/(public)/terms-and-conditions/page.tsx` | Terms page |
| `app/(public)/refund-and-cancellation-policy/page.tsx` | Refund policy page |

### Modified Files
| File | Change |
|------|--------|
| `supabase/migrations/20260208211959_initial_schema.sql` | Add DROP statements to remove old public tables (OR leave as-is if new migration handles it) |
| `app/(public)/page.tsx` | Replace studio with marketing landing page |
| `app/(public)/layout.tsx` | Remove bg wrapper div (OfficialPageShell handles bg) |
| `app/login/page.tsx` | Replace magic link form with Google OAuth button |
| `app/globals.css` | Add official-* CSS classes (story_reels palette) |
| `lib/supabase/client.ts` | Add `db: { schema: 'story_reels' }` |
| `lib/supabase/server.ts` | Add `db: { schema: 'story_reels' }` |
| `lib/supabase/middleware.ts` | Add `db: { schema: 'story_reels' }` |
| `app/auth/callback/route.ts` | Add `db: { schema: 'story_reels' }` |

---

## Manual Steps (User Must Do)

### Supabase Dashboard
1. **Authentication → Providers → Google**: Enable Google, paste Client ID + Secret from Google Cloud Console
2. **Project Settings → API → Exposed Schemas**: Add `story_reels` to exposed schemas list
3. Run `supabase db push` to apply new migration

### Google Cloud Console
1. Create OAuth 2.0 Client ID (if not exists)
2. Add authorized redirect URI: `https://[your-supabase-ref].supabase.co/auth/v1/callback`
3. For Vercel prod: also add `https://[vercel-domain].vercel.app/auth/callback` as Site URL in Supabase Auth settings

### Vercel Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COQUI_API_BASE_URL=https://abhirooprasad--coqui-apis-fastapi-app.modal.run
```

---

## Migration SQL Plan

```sql
-- 1. Create story_reels schema
CREATE SCHEMA IF NOT EXISTS story_reels;

-- 2. Grant permissions
GRANT USAGE ON SCHEMA story_reels TO anon, authenticated, service_role;

-- 3. Create tables in story_reels schema (same as current public schema tables)
-- projects, source_items, script_versions, audio_assets, background_assets, video_assets, jobs

-- 4. Enable RLS + all policies (same policies, schema-qualified)

-- 5. Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA story_reels TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA story_reels TO anon, authenticated, service_role;

-- 6. Drop old public schema tables (test data)
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.video_assets CASCADE;
DROP TABLE IF EXISTS public.audio_assets CASCADE;
DROP TABLE IF EXISTS public.background_assets CASCADE;
DROP TABLE IF EXISTS public.script_versions CASCADE;
DROP TABLE IF EXISTS public.source_items CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
```

---

## Tasks
- [ ] Phase 1: DB Migration + Client Updates
- [ ] Phase 2: Google OAuth Login Page
- [ ] Phase 3: Marketing Landing Pages + CSS
- [ ] Phase 4: Verify types + lint
