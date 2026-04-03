import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function getSupabaseClient() {
  return createBrowserClient<Database, 'story_reels'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'story_reels' } }
  )
}
