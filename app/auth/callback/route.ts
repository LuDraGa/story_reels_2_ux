import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Auth Callback Handler
 *
 * Handles the OAuth callback from Supabase magic link authentication.
 * Exchanges the code in the URL for a session and redirects to the dashboard.
 *
 * Flow:
 * 1. User clicks magic link in email
 * 2. Supabase redirects to this endpoint with code
 * 3. We exchange code for session
 * 4. Redirect to /app (dashboard)
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Handle error in middleware
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      // Redirect to login with error
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      )
    }
  }

  // Successful auth - redirect to dashboard
  return NextResponse.redirect(new URL('/app', requestUrl.origin))
}
