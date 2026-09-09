'use client'

import { Checkbox } from '@/components/ui/checkbox'
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
import { propertyFieldNames } from '@/lib/classify'
import type { LayerPopupConfig } from '@/lib/supabase/types'

const NONE = '__none__'

type PopupEditorProps = {
  data: GeoJSON.FeatureCollection | null
  value: LayerPopupConfig
  onChange: (next: LayerPopupConfig) => void
}

export function PopupEditor({ data, value, onChange }: PopupEditorProps) {
  const keys = propertyFieldNames(data)
  const selected = new Map(
    (value.fields ?? []).map(field => [field.key, field.label ?? ''])
  )
  const allSelected = !value.fields || value.fields.length === 0

  const toggleKey = (key: string, checked: boolean) => {
    if (allSelected && checked) return
    if (allSelected && !checked) {
      onChange({
        ...value,
        fields: keys.filter(item => item !== key).map(item => ({ key: item })),
      })
      return
    }

    const fields = value.fields ?? []
    onChange({
      ...value,
      fields: checked
        ? [...fields, { key }]
        : fields.filter(field => field.key !== key),
    })
  }

  const setLabel = (key: string, label: string) => {
    const fields = (value.fields ?? keys.map(item => ({ key: item }))).map(
      field =>
        field.key === key ? { ...field, label: label || undefined } : field
    )
    onChange({ ...value, fields })
  }

  return (
    <FieldSet className="rounded-lg border p-4">
      <FieldLegend variant="label">Popup no mapa</FieldLegend>
      <FieldGroup>
        <FieldDescription>
          Sem campos marcados, o identify mostra todos os atributos. Marque para
          restringir e rotular o que aparece.
        </FieldDescription>

        {!data && (
          <FieldDescription>
            Envie um GeoJSON para configurar os campos do popup.
          </FieldDescription>
        )}

        {data && keys.length === 0 && (
          <FieldDescription>
            Nenhuma propriedade encontrada nas feições.
          </FieldDescription>
        )}

        {keys.length > 0 && (
          <div className="flex flex-col gap-2">
            {keys.map(key => {
              const checked = allSelected || selected.has(key)
              return (
                <Field key={key} orientation="horizontal">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={next => toggleKey(key, next === true)}
                    aria-label={key}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-mono text-xs">{key}</span>
                    {checked && (
                      <Input
                        value={selected.get(key) ?? ''}
                        onChange={event => setLabel(key, event.target.value)}
                        placeholder="Rótulo no popup"
                      />
                    )}
                  </div>
                </Field>
              )
            })}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="popup-image-field">Campo de imagem</FieldLabel>
          <Select
            value={value.imageField ?? NONE}
            onValueChange={next =>
              onChange({
                ...value,
                imageField: next === NONE ? undefined : next,
              })
            }
            disabled={keys.length === 0}
          >
            <SelectTrigger id="popup-image-field" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={NONE}>Nenhum</SelectItem>
                {keys.map(key => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
