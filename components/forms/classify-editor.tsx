'use client'

import { EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CLASSIFY_PALETTES,
  DEFAULT_PALETTE_ID,
  equalIntervalClasses,
  fieldExtent,
  getPalette,
  normalizeHex,
  numericFieldNames,
  recolorClasses,
} from '@/lib/classify'
import type { ClassifyClass, LayerStyle } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

type ClassifyEditorProps = {
  data: GeoJSON.FeatureCollection | null
  value: LayerStyle
  onChange: (style: LayerStyle) => void
}

export function ClassifyEditor({ data, value, onChange }: ClassifyEditorProps) {
  const fields = useMemo(() => numericFieldNames(data), [data])
  const [classCount, setClassCount] = useState(
    value.classify?.classes.length || 5
  )

  const classify = value.classify
  const property = classify?.property ?? ''
  const paletteId = classify?.palette ?? DEFAULT_PALETTE_ID

  const updateClassify = (
    propertyName: string,
    classes: ClassifyClass[],
    palette = paletteId
  ) => {
    onChange({
      ...value,
      classify: propertyName
        ? { property: propertyName, classes, palette }
        : undefined,
    })
  }

  const handlePropertyChange = (nextProperty: string) => {
    if (!nextProperty) {
      onChange({ ...value, classify: undefined })
      return
    }
    if (!data) {
      updateClassify(nextProperty, classify?.classes ?? [])
      return
    }
    const extent = fieldExtent(data, nextProperty)
    if (!extent) {
      updateClassify(nextProperty, [])
      return
    }
    updateClassify(
      nextProperty,
      equalIntervalClasses(extent.min, extent.max, classCount, paletteId)
    )
  }

  const handleGenerate = () => {
    if (!data || !property) return
    const extent = fieldExtent(data, property)
    if (!extent) return
    updateClassify(
      property,
      equalIntervalClasses(extent.min, extent.max, classCount, paletteId)
    )
  }

  const handlePaletteChange = (nextPalette: string) => {
    if (!classify) {
      onChange({
        ...value,
        classify: value.classify
          ? { ...value.classify, palette: nextPalette }
          : undefined,
      })
      return
    }
    updateClassify(
      classify.property,
      recolorClasses(classify.classes, nextPalette),
      nextPalette
    )
  }

  const updateClass = (index: number, patch: Partial<ClassifyClass>) => {
    if (!classify) return
    const classes = classify.classes.map((cls, i) =>
      i === index ? { ...cls, ...patch } : cls
    )
    updateClassify(classify.property, classes)
  }

  const addClass = () => {
    if (!classify) return
    const last = classify.classes[classify.classes.length - 1]
    const stops = getPalette(paletteId).stops
    const min = last?.max ?? 0
    updateClassify(classify.property, [
      ...classify.classes,
      {
        min,
        max: min + 1,
        color: last?.color ?? stops[stops.length - 1],
        label: '',
        visible: true,
      },
    ])
  }

  const removeClass = (index: number) => {
    if (!classify) return
    updateClassify(
      classify.property,
      classify.classes.filter((_, i) => i !== index)
    )
  }

  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-2 font-medium text-sm">Classificação graduada</legend>

      {!data && (
        <p className="text-muted-foreground text-sm">
          Envie um GeoJSON para classificar pelos atributos.
        </p>
      )}

      {data && fields.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhum campo numérico encontrado no GeoJSON.
        </p>
      )}

      {data && fields.length > 0 && (
        <>
          <div className="space-y-2">
            <Label htmlFor="classify-property">Campo numérico</Label>
            <select
              id="classify-property"
              value={property}
              onChange={e => handlePropertyChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Cor única (sem classificação)</option>
              {fields.map(field => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>

          {property && (
            <>
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-24 space-y-1">
                  <Label htmlFor="class-count">Classes</Label>
                  <Input
                    id="class-count"
                    type="number"
                    min={1}
                    max={12}
                    value={classCount}
                    onChange={e =>
                      setClassCount(
                        Number.parseInt(e.target.value, 10) || 1
                      )
                    }
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerate}>
                  Gerar classes
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Paleta</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {CLASSIFY_PALETTES.map(palette => (
                    <button
                      key={palette.id}
                      type="button"
                      title={palette.label}
                      onClick={() => handlePaletteChange(palette.id)}
                      className={cn(
                        'flex flex-col gap-1 rounded-md border p-1.5 text-left text-xs',
                        palette.id === paletteId
                          ? 'border-ring ring-2 ring-ring/50'
                          : 'border-input hover:bg-muted'
                      )}
                    >
                      <span
                        className="h-4 w-full rounded-sm"
                        style={{
                          background: `linear-gradient(to right, ${palette.stops.join(',')})`,
                        }}
                      />
                      <span className="truncate">{palette.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {classify && classify.classes.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[auto_2.5rem_5.75rem_1fr_1fr_1fr_auto] items-center gap-1.5 text-muted-foreground text-xs">
                    <span />
                    <span>Cor</span>
                    <span>Hex</span>
                    <span>Min</span>
                    <span>Max</span>
                    <span>Rótulo</span>
                    <span />
                  </div>
                  {classify.classes.map((cls, i) => (
                    <div
                      key={`${cls.min}-${cls.max}-${i}`}
                      className="grid grid-cols-[auto_2.5rem_5.75rem_1fr_1fr_1fr_auto] items-center gap-1.5"
                    >
                      <button
                        type="button"
                        title={cls.visible === false ? 'Mostrar' : 'Ocultar'}
                        onClick={() =>
                          updateClass(i, { visible: cls.visible === false })
                        }
                      >
                        {cls.visible === false ? (
                          <EyeOffIcon className="size-4 text-muted-foreground" />
                        ) : (
                          <EyeIcon className="size-4 text-primary" />
                        )}
                      </button>
                      <ClassColorInput
                        color={cls.color}
                        onChange={color => updateClass(i, { color })}
                      />
                      <Input
                        type="number"
                        step="any"
                        value={cls.min}
                        onChange={e =>
                          updateClass(i, {
                            min: Number.parseFloat(e.target.value),
                          })
                        }
                      />
                      <Input
                        type="number"
                        step="any"
                        value={cls.max}
                        onChange={e =>
                          updateClass(i, {
                            max: Number.parseFloat(e.target.value),
                          })
                        }
                      />
                      <Input
                        value={cls.label}
                        onChange={e => updateClass(i, { label: e.target.value })}
                        placeholder="Rótulo"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeClass(i)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button type="button" variant="outline" size="sm" onClick={addClass}>
                <PlusIcon className="mr-1 size-4" />
                Adicionar classe
              </Button>
            </>
          )}
        </>
      )}
    </fieldset>
  )
}

function ClassColorInput({
  color,
  onChange,
}: {
  color: string
  onChange: (color: string) => void
}) {
  const normalized = normalizeHex(color) ?? '#000000'
  const [hexText, setHexText] = useState(normalized)

  useEffect(() => {
    setHexText(normalized)
  }, [normalized])

  const commitHex = () => {
    const next = normalizeHex(hexText)
    if (next) {
      onChange(next)
      setHexText(next)
      return
    }
    setHexText(normalized)
  }

  return (
    <>
      <Input
        type="color"
        value={normalized}
        onChange={e => onChange(e.target.value)}
        className="h-8 p-0.5"
        aria-label="Cor"
      />
      <Input
        value={hexText}
        onChange={e => setHexText(e.target.value)}
        onBlur={commitHex}
        onKeyDown={e => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          commitHex()
        }}
        className="font-mono text-xs"
        aria-label="Hex"
        spellCheck={false}
      />
    </>
  )
}
