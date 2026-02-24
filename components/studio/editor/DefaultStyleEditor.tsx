'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ASSStyle } from '@/lib/captions/ass-presets'
import { bgrToRGB, rgbToBGR } from '@/lib/captions/ass-presets'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DefaultStyleEditorProps {
  style: ASSStyle
  onUpdateStyle: (updates: Partial<ASSStyle>) => void
  onApplyToAll: () => void
  captionCount: number
}

const COMMON_FONTS = [
  'Impact',
  'Arial',
  'Helvetica Neue',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Oswald',
  'Poppins',
  'Inter',
]

export function DefaultStyleEditor({
  style,
  onUpdateStyle,
  onApplyToAll,
  captionCount,
}: DefaultStyleEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const formatColor = (bgr: string) => {
    const { r, g, b } = bgrToRGB(bgr)
    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const updateColor = (key: keyof ASSStyle, hex: string) => {
    const { alpha } = bgrToRGB(style[key] as string)
    const clean = hex.replace('#', '')
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    if ([r, g, b].some((value) => Number.isNaN(value))) return
    onUpdateStyle({
      [key]: rgbToBGR(r, g, b, alpha),
    })
  }

  const handleApplyToAll = () => {
    const confirmed = window.confirm(
      `This will remove custom positioning and alignment from all ${captionCount} captions and apply the default style. Continue?`
    )
    if (confirmed) {
      onApplyToAll()
    }
  }

  return (
    <div className="border-b border-secondary-800 pb-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between py-2 text-sm font-semibold text-secondary-100 hover:text-secondary-50"
      >
        <span>Default Caption Style</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4">
          {/* Position (Alignment) */}
          <div className="space-y-2">
            <label className="text-[11px] text-secondary-400">
              Default Position (applies to all)
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onUpdateStyle({ Alignment: value })}
                  title={`Set alignment ${value}`}
                  className={`h-9 rounded-md border text-xs ${
                    style.Alignment === value
                      ? 'border-accent-sage bg-accent-sage/20 text-secondary-100'
                      : 'border-secondary-800 bg-secondary-900/60 text-secondary-400 hover:bg-secondary-800'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-secondary-500">
              7-9: Top • 4-6: Middle • 1-3: Bottom
            </p>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <label className="text-[11px] text-secondary-400">Font</label>
            <select
              value={style.Fontname}
              onChange={(e) => onUpdateStyle({ Fontname: e.target.value })}
              className="h-9 w-full rounded-lg border border-secondary-800 bg-secondary-900/60 px-3 text-sm text-secondary-100"
            >
              {COMMON_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <label className="text-[11px] text-secondary-400">Size (pt)</label>
            <Input
              type="number"
              value={style.Fontsize}
              onChange={(e) =>
                onUpdateStyle({ Fontsize: Number(e.target.value) || 0 })
              }
              min={10}
              max={200}
              className="h-9 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
            />
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <label className="text-[11px] text-secondary-400">Colors</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-secondary-500">Primary</label>
                <input
                  type="color"
                  value={formatColor(style.PrimaryColour)}
                  onChange={(e) => updateColor('PrimaryColour', e.target.value)}
                  className="h-9 w-full rounded-lg border border-secondary-800 bg-secondary-900/60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-secondary-500">Outline</label>
                <input
                  type="color"
                  value={formatColor(style.OutlineColour)}
                  onChange={(e) => updateColor('OutlineColour', e.target.value)}
                  className="h-9 w-full rounded-lg border border-secondary-800 bg-secondary-900/60"
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-[11px] text-secondary-400 hover:text-secondary-300"
            >
              <span>Advanced Settings</span>
              {showAdvanced ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-3 rounded-lg border border-secondary-800 bg-secondary-900/40 p-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-secondary-400">Outline</label>
                    <Input
                      type="number"
                      value={style.Outline}
                      onChange={(e) =>
                        onUpdateStyle({ Outline: Number(e.target.value) || 0 })
                      }
                      min={0}
                      max={20}
                      className="h-8 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-secondary-400">Shadow</label>
                    <Input
                      type="number"
                      value={style.Shadow}
                      onChange={(e) =>
                        onUpdateStyle({ Shadow: Number(e.target.value) || 0 })
                      }
                      min={0}
                      max={20}
                      className="h-8 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-secondary-400">Spacing</label>
                    <Input
                      type="number"
                      value={style.Spacing}
                      onChange={(e) =>
                        onUpdateStyle({ Spacing: Number(e.target.value) || 0 })
                      }
                      min={-10}
                      max={10}
                      step={0.5}
                      className="h-8 rounded-lg border-secondary-800 bg-secondary-900/60 text-secondary-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-secondary-400">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({ Bold: style.Bold ? 0 : -1 })
                    }
                    className={`rounded-md border px-2 py-1 ${
                      style.Bold ? 'border-accent-sage text-accent-sage' : 'border-secondary-800'
                    }`}
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({ Italic: style.Italic ? 0 : -1 })
                    }
                    className={`rounded-md border px-2 py-1 ${
                      style.Italic ? 'border-accent-sage text-accent-sage' : 'border-secondary-800'
                    }`}
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        Underline: style.Underline ? 0 : -1,
                      })
                    }
                    className={`rounded-md border px-2 py-1 ${
                      style.Underline ? 'border-accent-sage text-accent-sage' : 'border-secondary-800'
                    }`}
                  >
                    Underline
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Apply to All Button */}
          <Button
            type="button"
            onClick={handleApplyToAll}
            className="w-full rounded-lg bg-accent-sage/20 text-accent-sage hover:bg-accent-sage/30"
            variant="outline"
          >
            Apply to All {captionCount} Captions
          </Button>
          <p className="text-[10px] text-secondary-500">
            Removes custom positioning from all captions and applies default style.
          </p>
        </div>
      )}
    </div>
  )
}
