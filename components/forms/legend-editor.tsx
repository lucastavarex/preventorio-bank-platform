'use client'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { ColorInput } from '@/components/custom/color-input'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
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
import type { LegendConfig, LegendItem } from '@/lib/supabase/types'

type LegendEditorProps = {
  value: LegendConfig
  onChange: (legend: LegendConfig) => void
}

export function LegendEditor({ value, onChange }: LegendEditorProps) {
  const items = value.items ?? []

  const updateItem = (index: number, patch: Partial<LegendItem>) => {
    const next = [...items]
    next[index] = { ...next[index], ...patch }
    onChange({ items: next })
  }

  const addItem = () => {
    onChange({
      items: [...items, { label: '', color: '#3b82f6', type: 'fill' }],
    })
  }

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) })
  }

  return (
    <FieldSet className="rounded-lg border p-4">
      <FieldLegend variant="label">Legenda</FieldLegend>
      <FieldGroup>
        {items.length === 0 && (
          <FieldDescription>Nenhum item de legenda.</FieldDescription>
        )}

        {items.map((item, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field className="flex-1">
              <FieldLabel>Rótulo</FieldLabel>
              <Input
                value={item.label}
                onChange={event => updateItem(i, { label: event.target.value })}
                placeholder="Ex: Área de risco alto"
              />
            </Field>
            <ColorInput
              label="Cor"
              value={item.color}
              onChange={color => updateItem(i, { color })}
              className="w-16"
            />
            <Field className="w-28">
              <FieldLabel>Tipo</FieldLabel>
              <Select
                value={item.type ?? 'fill'}
                onValueChange={next =>
                  updateItem(i, { type: next as LegendItem['type'] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(i)}
              className="text-destructive"
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <PlusIcon data-icon="inline-start" />
          Adicionar item
        </Button>
      </FieldGroup>
    </FieldSet>
  )
}
