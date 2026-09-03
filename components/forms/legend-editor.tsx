'use client'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-2 font-medium text-sm">Legenda</legend>

      {items.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhum item de legenda.
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label>Rótulo</Label>
            <Input
              value={item.label}
              onChange={e => updateItem(i, { label: e.target.value })}
              placeholder="Ex: Área de risco alto"
            />
          </div>
          <div className="w-16 space-y-1">
            <Label>Cor</Label>
            <Input
              type="color"
              value={item.color}
              onChange={e => updateItem(i, { color: e.target.value })}
            />
          </div>
          <div className="w-24 space-y-1">
            <Label>Tipo</Label>
            <select
              value={item.type ?? 'fill'}
              onChange={e =>
                updateItem(i, {
                  type: e.target.value as LegendItem['type'],
                })
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
            >
              <option value="fill">Fill</option>
              <option value="line">Line</option>
              <option value="circle">Circle</option>
            </select>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(i)}
            className="text-destructive"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <PlusIcon className="mr-1 size-4" />
        Adicionar item
      </Button>
    </fieldset>
  )
}
