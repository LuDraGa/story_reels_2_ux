'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

export interface CompositionSettings {
  musicVolume: number // 0-1
  // Future settings (not yet implemented in Modal FFmpeg API):
  // aspectRatio: '9:16' | '16:9' | '1:1'
  // transition: 'none' | 'fade' | 'dissolve'
  // captionPosition: 'top' | 'center' | 'bottom'
  // quality: '720p' | '1080p'
  // loopVideos: boolean
}

interface AdvancedSettingsProps {
  settings: CompositionSettings
  onChange: (settings: CompositionSettings) => void
  hasMusicSelected: boolean
}

export function AdvancedSettings({
  settings,
  onChange,
  hasMusicSelected,
}: AdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateSetting = <K extends keyof CompositionSettings>(
    key: K,
    value: CompositionSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent-mist-blue" />
          <h3 className="font-display text-lg font-semibold text-secondary-700">
            Advanced Settings
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-secondary-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-secondary-500" />
        )}
      </Button>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="rounded-xl border border-primary-500/20 bg-gradient-to-br from-accent-mist-blue/5 to-accent-lavender/5 p-6 space-y-6">
          {/* Music Volume */}
          {hasMusicSelected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary-700">
                  Music Volume
                </label>
                <span className="text-sm text-secondary-500">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.musicVolume * 100]}
                onValueChange={(value: number[]) => updateSetting('musicVolume', value[0] / 100)}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-secondary-500">
                Background music volume relative to voiceover
              </p>
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-secondary-500">
              <p>Select background music to adjust volume</p>
            </div>
          )}

          {/* Coming Soon Features */}
          <div className="rounded-xl bg-white border border-primary-500/10 p-4">
            <p className="text-sm font-medium text-secondary-700 mb-2">
              Coming Soon
            </p>
            <p className="text-xs text-secondary-500">
              Additional settings like aspect ratio, transitions, caption position, and quality controls
              will be available once the backend FFmpeg API supports them.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
