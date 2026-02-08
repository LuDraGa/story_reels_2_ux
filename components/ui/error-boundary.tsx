'use client'

import { Component, ReactNode } from 'react'
import { Card } from './card'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="p-12 text-center bg-primary-300 border-primary-500/20">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-4xl text-red-500">⚠️</div>
            <h2 className="font-display text-2xl font-bold text-secondary-700">
              Something went wrong
            </h2>
            <p className="text-secondary-500">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              onClick={() => this.setState({ hasError: false })}
              className="rounded-xl"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}
