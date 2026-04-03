'use client'

import { useState, useEffect } from 'react'
import { useSignInModal } from '@/lib/auth/modal-context'
import { getSupabaseClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

export function SignInModal() {
  const { isOpen, closeSignIn } = useSignInModal()
  const [isLoading, setIsLoading] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSignIn() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeSignIn])

  if (!isOpen) return null

  const handleGoogle = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeSignIn() }}
    >
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">
        {/* Close */}
        <button
          onClick={closeSignIn}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-primary-300 text-secondary-500 hover:bg-primary-400 transition-colors text-sm"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-sage to-sage-600 flex items-center justify-center mx-auto shadow-md">
            <span className="text-white text-xl">✦</span>
          </div>
          <h2 className="font-display text-xl font-bold text-secondary-700 mt-3">
            Sign in to Reel Story Studio
          </h2>
          <p className="text-secondary-500 text-sm">
            Save projects, manage your pipeline, and more.
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-primary-500 bg-primary-100 hover:bg-primary-200 text-secondary-700 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {isLoading
            ? <span className="w-4 h-4 rounded-full border-2 border-secondary-400 border-t-transparent animate-spin" />
            : <GoogleIcon />
          }
          {isLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  )
}
