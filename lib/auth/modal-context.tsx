'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SignInModalContextValue {
  isOpen: boolean
  openSignIn: () => void
  closeSignIn: () => void
}

const SignInModalContext = createContext<SignInModalContextValue | null>(null)

export function SignInModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <SignInModalContext.Provider
      value={{ isOpen, openSignIn: () => setIsOpen(true), closeSignIn: () => setIsOpen(false) }}
    >
      {children}
    </SignInModalContext.Provider>
  )
}

export function useSignInModal() {
  const ctx = useContext(SignInModalContext)
  if (!ctx) throw new Error('useSignInModal must be used within SignInModalProvider')
  return ctx
}
