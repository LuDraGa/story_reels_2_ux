'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface IngestModuleProps {
  sourceText: string
  onSave: (text: string) => void
}

/**
 * Ingest Module - Step 1
 *
 * Allows user to paste or type raw text input
 * Automatically copies to script on first save
 */
export function IngestModule({ sourceText, onSave }: IngestModuleProps) {
  const [text, setText] = useState(sourceText)
  const { toast } = useToast()

  const handleSave = () => {
    if (text.trim() === '') {
      toast({
        title: 'Empty text',
        description: 'Please enter some text first',
        variant: 'destructive',
      })
      return
    }

    onSave(text)
    toast({
      title: 'Text saved',
      description: 'Your text has been saved and copied to the script editor',
    })
  }

  const charCount = text.length
  const hasChanges = text !== sourceText

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>1. Ingest</CardTitle>
            <CardDescription>Paste or type your source text</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {sourceText && (
              <span className="rounded-full bg-accent-sage/10 px-3 py-1 text-xs font-medium text-accent-sage">
                Ready
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your story, article, or any text here..."
            className="min-h-[200px] w-full rounded-xl border border-secondary-300 bg-primary-100 p-4 text-secondary-700 placeholder:text-secondary-400 focus:border-accent-sage focus:outline-none focus:ring-2 focus:ring-accent-sage/20"
          />
          <div className="flex items-center justify-between text-sm text-secondary-500">
            <span>{charCount.toLocaleString()} characters</span>
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
          {sourceText ? 'Update Text' : 'Save Text'}
        </Button>
      </CardContent>
    </Card>
  )
}
