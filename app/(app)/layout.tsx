'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast({ title: 'Signed out', description: 'You have been signed out successfully' })
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      toast({ title: 'Sign out failed', description: 'Please try again', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-primary-100 bg-gradient-mesh">
      <nav className="border-b border-primary-500 bg-primary-200/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/app" className="font-display text-xl font-bold text-secondary-700">
                Reel Story Studio
              </Link>
              {user && (
                <div className="flex gap-6">
                  <Link href="/app/assets" className="text-secondary-600 hover:text-secondary-800 text-sm font-medium">
                    Assets
                  </Link>
                  <Link href="/app/queue" className="text-secondary-600 hover:text-secondary-800 text-sm font-medium">
                    Queue
                  </Link>
                </div>
              )}
            </div>
            {user ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-primary-600 text-secondary-700 rounded-xl text-sm"
              >
                Sign Out
              </Button>
            ) : (
              <Link href="/login">
                <Button className="rounded-xl text-sm px-5">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
