'use client'

import { ColorInput } from '@/components/custom/color-input'
import { OpacitySlider } from '@/components/custom/opacity-slider'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
    <FieldSet className="rounded-lg border p-4">
      <FieldLegend variant="label">Estilo</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="style-type">Tipo de geometria</FieldLabel>
          <Select
            value={layerType}
            onValueChange={next => update({ type: next as LayerStyle['type'] })}
          >
            <SelectTrigger id="style-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="fill">Polígono (fill)</SelectItem>
                <SelectItem value="line">Linha (line)</SelectItem>
                <SelectItem value="circle">Ponto (circle)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {layerType === 'fill' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {!classified && (
                <ColorInput
                  id="fill-color"
                  label="Cor de preenchimento"
                  value={value.fillColor ?? '#3b82f6'}
                  onChange={fillColor => update({ fillColor })}
                />
              )}
              <OpacitySlider
                id="fill-opacity"
                label="Opacidade"
                value={value.fillOpacity ?? 1}
                onChange={fillOpacity => update({ fillOpacity })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                id="stroke-color"
                label="Cor da borda"
                value={value.strokeColor ?? '#000000'}
                onChange={strokeColor => update({ strokeColor })}
              />
              <Field>
                <FieldLabel htmlFor="stroke-width">Largura da borda</FieldLabel>
                <Input
                  id="stroke-width"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={value.strokeWidth ?? 1}
                  onChange={event =>
                    update({
                      strokeWidth: Number.parseFloat(event.target.value),
                    })
                  }
                />
              </Field>
            </div>
          </>
        )}

        {layerType === 'line' && (
          <div className="grid grid-cols-3 gap-3">
            {!classified && (
              <ColorInput
                label="Cor"
                value={value.strokeColor ?? '#000000'}
                onChange={strokeColor => update({ strokeColor })}
              />
            )}
            <Field>
              <FieldLabel>Largura</FieldLabel>
              <Input
                type="number"
                min="0.5"
                max="20"
                step="0.5"
                value={value.strokeWidth ?? 2}
                onChange={event =>
                  update({
                    strokeWidth: Number.parseFloat(event.target.value),
                  })
                }
              />
            </Field>
            <OpacitySlider
              label="Opacidade"
              value={value.strokeOpacity ?? 1}
              onChange={strokeOpacity => update({ strokeOpacity })}
            />
          </div>
        )}

        {layerType === 'circle' && (
          <div className="grid grid-cols-3 gap-3">
            {!classified && (
              <ColorInput
                label="Cor"
                value={value.circleColor ?? '#3b82f6'}
                onChange={circleColor => update({ circleColor })}
              />
            )}
            <Field>
              <FieldLabel>Raio</FieldLabel>
              <Input
                type="number"
                min="1"
                max="30"
                step="1"
                value={value.circleRadius ?? 6}
                onChange={event =>
                  update({
                    circleRadius: Number.parseFloat(event.target.value),
                  })
                }
              />
            </Field>
            <OpacitySlider
              label="Opacidade"
              value={value.circleOpacity ?? 1}
              onChange={circleOpacity => update({ circleOpacity })}
            />
          </div>
        )}
      </FieldGroup>
    </FieldSet>
  )
}
