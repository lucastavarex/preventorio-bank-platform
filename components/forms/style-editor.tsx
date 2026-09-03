'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { LayerStyle } from '@/lib/supabase/types'

type StyleEditorProps = {
  value: LayerStyle
  onChange: (style: LayerStyle) => void
}

export function StyleEditor({ value, onChange }: StyleEditorProps) {
  const update = (patch: Partial<LayerStyle>) =>
    onChange({ ...value, ...patch })

  const layerType = value.type ?? 'fill'
  const classified = Boolean(value.classify?.property)

  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-2 font-medium text-sm">Estilo</legend>

      <div className="space-y-2">
        <Label htmlFor="style-type">Tipo de geometria</Label>
        <select
          id="style-type"
          value={layerType}
          onChange={e =>
            update({ type: e.target.value as LayerStyle['type'] })
          }
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="fill">Polígono (fill)</option>
          <option value="line">Linha (line)</option>
          <option value="circle">Ponto (circle)</option>
        </select>
      </div>

      {layerType === 'fill' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {!classified && (
              <div className="space-y-1">
                <Label htmlFor="fill-color">Cor de preenchimento</Label>
                <Input
                  id="fill-color"
                  type="color"
                  value={value.fillColor ?? '#3b82f6'}
                  onChange={e => update({ fillColor: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="fill-opacity">Opacidade</Label>
              <Input
                id="fill-opacity"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={value.fillOpacity ?? 1}
                onChange={e =>
                  update({ fillOpacity: Number.parseFloat(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="stroke-color">Cor da borda</Label>
              <Input
                id="stroke-color"
                type="color"
                value={value.strokeColor ?? '#000000'}
                onChange={e => update({ strokeColor: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stroke-width">Largura da borda</Label>
              <Input
                id="stroke-width"
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={value.strokeWidth ?? 1}
                onChange={e =>
                  update({ strokeWidth: Number.parseFloat(e.target.value) })
                }
              />
            </div>
          </div>
        </>
      )}

      {layerType === 'line' && (
        <div className="grid grid-cols-3 gap-3">
          {!classified && (
            <div className="space-y-1">
              <Label>Cor</Label>
              <Input
                type="color"
                value={value.strokeColor ?? '#000000'}
                onChange={e => update({ strokeColor: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label>Largura</Label>
            <Input
              type="number"
              min="0.5"
              max="20"
              step="0.5"
              value={value.strokeWidth ?? 2}
              onChange={e =>
                update({ strokeWidth: Number.parseFloat(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Opacidade</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={value.strokeOpacity ?? 1}
              onChange={e =>
                update({ strokeOpacity: Number.parseFloat(e.target.value) })
              }
            />
          </div>
        </div>
      )}

      {layerType === 'circle' && (
        <div className="grid grid-cols-3 gap-3">
          {!classified && (
            <div className="space-y-1">
              <Label>Cor</Label>
              <Input
                type="color"
                value={value.circleColor ?? '#3b82f6'}
                onChange={e => update({ circleColor: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label>Raio</Label>
            <Input
              type="number"
              min="1"
              max="30"
              step="1"
              value={value.circleRadius ?? 6}
              onChange={e =>
                update({ circleRadius: Number.parseFloat(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Opacidade</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={value.circleOpacity ?? 1}
              onChange={e =>
                update({ circleOpacity: Number.parseFloat(e.target.value) })
              }
            />
          </div>
        </div>
      )}
    </fieldset>
  )
}
