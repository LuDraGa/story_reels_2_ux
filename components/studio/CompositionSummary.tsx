'use client'

import { CheckCircle, AlertCircle, Info, Film, Music, Video, MessageSquare } from 'lucide-react'

interface CompositionSummaryProps {
  hasAudio: boolean
  hasCaptions: boolean
  selectedVideosCount: number
  hasMusic: boolean
  audioDuration?: number
  canCompose: boolean
}

export function CompositionSummary({
  hasAudio,
  hasCaptions,
  selectedVideosCount,
  hasMusic,
  audioDuration,
  canCompose,
}: CompositionSummaryProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const checklist = [
    {
      label: 'Audio track',
      value: hasAudio
        ? audioDuration
          ? `Ready (${formatDuration(audioDuration)})`
          : 'Ready'
        : null,
      status: hasAudio,
      icon: Video,
      required: true,
    },
    {
      label: 'ASS captions',
      value: hasCaptions ? 'Generated' : null,
      status: hasCaptions,
      icon: MessageSquare,
      required: false,
    },
    {
      label: 'Background videos',
      value: selectedVideosCount > 0 ? `${selectedVideosCount} selected` : null,
      status: selectedVideosCount > 0,
      icon: Film,
      required: true,
    },
    {
      label: 'Background music',
      value: hasMusic ? 'Selected' : 'None (optional)',
      status: hasMusic,
      icon: Music,
      required: false,
    },
  ]

  const missingRequired = checklist.filter((item) => item.required && !item.status)
  const warnings: string[] = []

  // Add warnings
  if (audioDuration && audioDuration > 60) {
    warnings.push(`Audio is ${formatDuration(audioDuration)} long. Recommended max is 60s for reels.`)
  }
  if (!hasCaptions) {
    warnings.push('No captions generated. Consider adding captions for better engagement.')
  }

  return (
    <div className="space-y-4">
      {/* Ready State */}
      {canCompose ? (
        <div className="rounded-xl border border-accent-sage/30 bg-gradient-to-br from-accent-sage/5 to-accent-sage/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-accent-sage flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-display text-base font-semibold text-secondary-700 mb-2">
                Ready to Compose
              </h4>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <item.icon className="w-4 h-4 text-accent-sage" />
                    <span className="text-secondary-600">
                      {item.label}:{' '}
                      <span className="font-medium text-secondary-700">{item.value}</span>
                    </span>
                  </div>
                ))}
              </div>
              {audioDuration !== undefined && audioDuration !== null && (
                <p className="text-sm text-secondary-600 mt-3">
                  Final video duration: ~{formatDuration(audioDuration)}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-secondary-300 bg-primary-200 p-5">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-secondary-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-display text-base font-semibold text-secondary-700 mb-2">
                Setup Required
              </h4>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {item.status ? (
                      <CheckCircle className="w-4 h-4 text-accent-sage" />
                    ) : (
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          item.required
                            ? 'border-secondary-400'
                            : 'border-secondary-300'
                        }`}
                      />
                    )}
                    <span
                      className={
                        item.status
                          ? 'text-secondary-700 font-medium'
                          : item.required
                          ? 'text-secondary-600'
                          : 'text-secondary-500'
                      }
                    >
                      {item.label}
                      {item.required && !item.status && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {missingRequired.length > 0 && (
                <p className="text-sm text-secondary-600 mt-3">
                  Missing {missingRequired.length} required{' '}
                  {missingRequired.length === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              {warnings.map((warning, index) => (
                <p key={index} className="text-sm text-amber-800">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
