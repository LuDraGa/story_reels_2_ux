'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      toast({
        title: 'Check your email',
        description: 'We sent you a magic link to sign in',
      })
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Failed to send magic link',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-100 bg-gradient-mesh flex items-center justify-center px-6">
      <Card className="bg-primary-300 border-primary-500 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl font-bold text-secondary-700">
              {emailSent ? 'Check Your Email' : 'Welcome Back'}
            </h1>
            <p className="text-secondary-500 text-sm">
              {emailSent
                ? 'We sent you a magic link. Click it to sign in.'
                : 'Sign in to access your projects dashboard'}
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-secondary-700 text-sm font-medium">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-primary-200 border-primary-500 rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl py-3"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-100 border-t-transparent"></span>
                    Sending...
                  </>
                ) : (
                  'Send Magic Link'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-accent-sage/10 border border-accent-sage/30 p-4 text-center text-sm text-secondary-600">
                <p className="font-medium text-accent-sage mb-1">Magic link sent!</p>
                <p>Check your inbox and click the link to sign in.</p>
              </div>
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full rounded-xl"
              >
                Try Another Email
              </Button>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/"
              className="text-secondary-500 hover:text-secondary-700 text-sm"
            >
              ← Back to Studio
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
