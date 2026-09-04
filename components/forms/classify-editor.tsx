'use client'

import { EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ColorInput } from '@/components/custom/color-input'
import { PalettePicker } from '@/components/custom/palette-picker'
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

const NONE_PROPERTY = '__none__'

/** Shared by header + rows so `auto` icon columns don't collapse differently. */
const CLASS_ROW_GRID =
  'grid grid-cols-[2rem_2.5rem_5.75rem_1fr_1fr_1fr_2rem] items-center gap-1.5'

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
    <FieldSet className="rounded-lg border p-4">
      <FieldLegend variant="label">Classificação graduada</FieldLegend>
      <FieldGroup>
        {!data && (
          <FieldDescription>
            Envie um GeoJSON para classificar pelos atributos.
          </FieldDescription>
        )}

        {data && fields.length === 0 && (
          <FieldDescription>
            Nenhum campo numérico encontrado no GeoJSON.
          </FieldDescription>
        )}

        {data && fields.length > 0 && (
          <>
            <Field>
              <FieldLabel htmlFor="classify-property">
                Campo numérico
              </FieldLabel>
              <Select
                value={property || NONE_PROPERTY}
                onValueChange={next =>
                  handlePropertyChange(next === NONE_PROPERTY ? '' : next)
                }
              >
                <SelectTrigger id="classify-property" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={NONE_PROPERTY}>
                      Cor única (sem classificação)
                    </SelectItem>
                    {fields.map(field => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {property && (
              <>
                <div className="flex flex-wrap items-end gap-2">
                  <Field className="w-24">
                    <FieldLabel htmlFor="class-count">Classes</FieldLabel>
                    <Input
                      id="class-count"
                      type="number"
                      min={1}
                      max={12}
                      value={classCount}
                      onChange={event =>
                        setClassCount(
                          Number.parseInt(event.target.value, 10) || 1
                        )
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                  >
                    Gerar classes
                  </Button>
                </div>

                <Field>
                  <FieldLabel>Paleta</FieldLabel>
                  <PalettePicker
                    value={paletteId}
                    options={CLASSIFY_PALETTES}
                    onChange={handlePaletteChange}
                  />
                </Field>

                {classify && classify.classes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className={`${CLASS_ROW_GRID} text-muted-foreground text-xs`}>
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
                        className={CLASS_ROW_GRID}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={cls.visible === false ? 'Mostrar' : 'Ocultar'}
                          onClick={() =>
                            updateClass(i, { visible: cls.visible === false })
                          }
                        >
                          {cls.visible === false ? <EyeOffIcon /> : <EyeIcon />}
                        </Button>
                        <ClassColorInput
                          color={cls.color}
                          onChange={color => updateClass(i, { color })}
                        />
                        <Input
                          type="number"
                          step="any"
                          value={cls.min}
                          onChange={event =>
                            updateClass(i, {
                              min: Number.parseFloat(event.target.value),
                            })
                          }
                        />
                        <Input
                          type="number"
                          step="any"
                          value={cls.max}
                          onChange={event =>
                            updateClass(i, {
                              max: Number.parseFloat(event.target.value),
                            })
                          }
                        />
                        <Input
                          value={cls.label}
                          onChange={event =>
                            updateClass(i, { label: event.target.value })
                          }
                          placeholder="Rótulo"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeClass(i)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addClass}
                >
                  <PlusIcon data-icon="inline-start" />
                  Adicionar classe
                </Button>
              </>
            )}
          </>
        )}
      </FieldGroup>
    </FieldSet>
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
      <ColorInput
        value={normalized}
        onChange={onChange}
        className="h-8"
        aria-label="Cor"
      />
      <Input
        value={hexText}
        onChange={event => setHexText(event.target.value)}
        onBlur={commitHex}
        onKeyDown={event => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          commitHex()
        }}
        className="font-mono text-xs"
        aria-label="Hex"
        spellCheck={false}
      />
    </>
  )
}
