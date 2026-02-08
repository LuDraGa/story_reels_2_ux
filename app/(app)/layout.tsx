'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createBrowserClient } from '@supabase/ssr'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully',
      })

      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      toast({
        title: 'Sign out failed',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-primary-100 bg-gradient-mesh">
      {/* Navigation */}
      <nav className="border-b border-primary-500 bg-primary-200/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/app" className="font-display text-xl font-bold text-secondary-700">
                Reel Story Studio
              </Link>
              <div className="flex gap-6">
                <Link
                  href="/app"
                  className="text-secondary-600 hover:text-secondary-800 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/app/assets"
                  className="text-secondary-600 hover:text-secondary-800 text-sm font-medium"
                >
                  Assets
                </Link>
                <Link
                  href="/app/queue"
                  className="text-secondary-600 hover:text-secondary-800 text-sm font-medium"
                >
                  Queue
                </Link>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-primary-600 text-secondary-700 rounded-xl text-sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
