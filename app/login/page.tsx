'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSupabaseClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-100 bg-gradient-mesh flex items-center justify-center px-6">
      <Card className="bg-primary-300 border-primary-500 rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl font-bold text-secondary-700">
              Welcome to Reel Story Studio
            </h1>
            <p className="text-secondary-500 text-sm">
              Sign in to save projects and manage your pipeline
            </p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full flex items-center justify-center gap-3 rounded-xl py-5 border-primary-600 text-secondary-700 hover:bg-primary-200"
          >
            {isLoading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-secondary-400 border-t-transparent" />
            ) : (
              <GoogleIcon />
            )}
            {isLoading ? 'Redirecting…' : 'Continue with Google'}
          </Button>

          <div className="text-center">
            <Link
              href="/app"
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
