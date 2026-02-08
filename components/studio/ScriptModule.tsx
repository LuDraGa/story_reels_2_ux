'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ScriptModuleProps {
  script: string
  onSave: (text: string) => void
}

/**
 * Script Module - Step 2
 *
 * Editable script with word count and estimated duration
 */
export function ScriptModule({ script, onSave }: ScriptModuleProps) {
  const [text, setText] = useState(script)
  const { toast } = useToast()

  const handleSave = () => {
    if (text.trim() === '') {
      toast({
        title: 'Empty script',
        description: 'Please enter some text first',
        variant: 'destructive',
      })
      return
    }

    onSave(text)
    toast({
      title: 'Script saved',
      description: 'Your script has been updated',
    })
  }

  // Calculate word count
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  // Estimate duration (assuming 150 words per minute average speaking rate)
  const estimatedMinutes = Math.ceil(wordCount / 150)
  const estimatedSeconds = Math.ceil((wordCount / 150) * 60)

  const hasChanges = text !== script
  const isEmpty = script.trim() === ''

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>2. Script</CardTitle>
            <CardDescription>Edit your script for voiceover</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isEmpty ? (
              <span className="rounded-full bg-secondary-300 px-3 py-1 text-xs font-medium text-secondary-500">
                Idle
              </span>
            ) : (
              <span className="rounded-full bg-accent-sage/10 px-3 py-1 text-xs font-medium text-accent-sage">
                Ready
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty && (
          <div className="rounded-xl border border-secondary-300 bg-primary-200 p-4 text-center text-sm text-secondary-600">
            Save text in the Ingest module to start editing your script
          </div>
        )}

        {!isEmpty && (
          <>
            <div className="space-y-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Edit your script here..."
                className="min-h-[200px] w-full rounded-xl border border-secondary-300 bg-primary-100 p-4 font-sans text-secondary-700 placeholder:text-secondary-400 focus:border-accent-sage focus:outline-none focus:ring-2 focus:ring-accent-sage/20"
              />
              <div className="flex items-center justify-between text-sm text-secondary-500">
                <div className="flex gap-4">
                  <span>{wordCount.toLocaleString()} words</span>
                  <span>~{estimatedSeconds}s estimated duration</span>
                </div>
                {hasChanges && (
                  <span className="text-accent-mist-blue">Unsaved changes</span>
                )}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!hasChanges || text.trim() === ''}
              className="w-full"
            >
              Save Script
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
