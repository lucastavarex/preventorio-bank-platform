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
  categoricalClasses,
  DEFAULT_PALETTE_ID,
  equalIntervalClasses,
  fieldExtent,
  getPalette,
  normalizeHex,
  numericFieldNames,
  propertyFieldNames,
  recolorClasses,
  uniquePropertyValues,
} from '@/lib/classify'
import type {
  CategoricalClass,
  ClassifyClass,
  LayerStyle,
} from '@/lib/supabase/types'

const NONE_PROPERTY = '__none__'
const CLASS_ROW_GRID =
  'grid grid-cols-[2rem_2.5rem_5.75rem_1fr_1fr_1fr_2rem] items-center gap-1.5'
const CATEGORICAL_ROW_GRID =
  'grid grid-cols-[2rem_2.5rem_5.75rem_1fr_1fr_2rem] items-center gap-1.5'

type ClassifyMode = 'none' | 'graduated' | 'categorical'

type ClassifyEditorProps = {
  data: GeoJSON.FeatureCollection | null
  value: LayerStyle
  onChange: (style: LayerStyle) => void
}

export function ClassifyEditor({ data, value, onChange }: ClassifyEditorProps) {
  const numericFields = useMemo(() => numericFieldNames(data), [data])
  const allFields = useMemo(() => propertyFieldNames(data), [data])
  const [classCount, setClassCount] = useState(
    value.classify?.classes.length || 5
  )

  const classify = value.classify
  const mode: ClassifyMode =
    classify?.mode === 'categorical'
      ? 'categorical'
      : classify?.property
        ? 'graduated'
        : 'none'
  const property = classify?.property ?? ''
  const paletteId = classify?.palette ?? DEFAULT_PALETTE_ID

  const setMode = (next: ClassifyMode) => {
    if (next === 'none') {
      onChange({ ...value, classify: undefined })
      return
    }
    onChange({
      ...value,
      classify:
        next === 'categorical'
          ? {
              mode: 'categorical',
              property: '',
              classes: [],
              palette: paletteId,
            }
          : {
              mode: 'graduated',
              property: '',
              classes: [],
              palette: paletteId,
            },
    })
  }

  const handleGraduatedProperty = (nextProperty: string) => {
    if (!nextProperty) {
      onChange({ ...value, classify: undefined })
      return
    }
    if (!data) {
      onChange({
        ...value,
        classify: {
          mode: 'graduated',
          property: nextProperty,
          classes: [],
          palette: paletteId,
        },
      })
      return
    }
    const extent = fieldExtent(data, nextProperty)
    onChange({
      ...value,
      classify: {
        mode: 'graduated',
        property: nextProperty,
        palette: paletteId,
        classes: extent
          ? equalIntervalClasses(extent.min, extent.max, classCount, paletteId)
          : [],
      },
    })
  }

  const handleCategoricalProperty = (nextProperty: string) => {
    if (!nextProperty) {
      onChange({ ...value, classify: undefined })
      return
    }
    const classes = data
      ? categoricalClasses(uniquePropertyValues(data, nextProperty), paletteId)
      : []
    onChange({
      ...value,
      classify: {
        mode: 'categorical',
        property: nextProperty,
        palette: paletteId,
        classes,
      },
    })
  }

  const handleGenerate = () => {
    if (!data || !property || !classify) return
    if (classify.mode === 'categorical') {
      onChange({
        ...value,
        classify: {
          ...classify,
          classes: categoricalClasses(
            uniquePropertyValues(data, property),
            paletteId
          ),
        },
      })
      return
    }
    const extent = fieldExtent(data, property)
    if (!extent) return
    onChange({
      ...value,
      classify: {
        ...classify,
        mode: 'graduated',
        classes: equalIntervalClasses(
          extent.min,
          extent.max,
          classCount,
          paletteId
        ),
      },
    })
  }

  const handlePaletteChange = (nextPalette: string) => {
    if (!classify) return
    if (classify.mode === 'categorical') {
      onChange({
        ...value,
        classify: {
          ...classify,
          palette: nextPalette,
          classes: recolorClasses(classify.classes, nextPalette),
        },
      })
      return
    }
    onChange({
      ...value,
      classify: {
        ...classify,
        palette: nextPalette,
        classes: recolorClasses(classify.classes, nextPalette),
      },
    })
  }

  const updateGraduatedClass = (
    index: number,
    patch: Partial<ClassifyClass>
  ) => {
    if (!classify || classify.mode === 'categorical') return
    onChange({
      ...value,
      classify: {
        ...classify,
        classes: classify.classes.map((cls, i) =>
          i === index ? { ...cls, ...patch } : cls
        ),
      },
    })
  }

  const updateCategoricalClass = (
    index: number,
    patch: Partial<CategoricalClass>
  ) => {
    if (classify?.mode !== 'categorical') return
    onChange({
      ...value,
      classify: {
        ...classify,
        classes: classify.classes.map((cls, i) =>
          i === index ? { ...cls, ...patch } : cls
        ),
      },
    })
  }

  const addGraduatedClass = () => {
    if (!classify || classify.mode === 'categorical') return
    const last = classify.classes[classify.classes.length - 1]
    const stops = getPalette(paletteId).stops
    const min = last?.max ?? 0
    onChange({
      ...value,
      classify: {
        ...classify,
        classes: [
          ...classify.classes,
          {
            min,
            max: min + 1,
            color: last?.color ?? stops[stops.length - 1],
            label: '',
            visible: true,
          },
        ],
      },
    })
  }

  const removeClass = (index: number) => {
    if (!classify) return
    if (classify.mode === 'categorical') {
      onChange({
        ...value,
        classify: {
          ...classify,
          classes: classify.classes.filter((_, i) => i !== index),
        },
      })
      return
    }
    onChange({
      ...value,
      classify: {
        ...classify,
        classes: classify.classes.filter((_, i) => i !== index),
      },
    })
  }

  return (
    <FieldSet className="rounded-lg border p-4">
      <FieldLegend variant="label">Classificação</FieldLegend>
      <FieldGroup>
        {!data && (
          <FieldDescription>
            Envie um GeoJSON para classificar pelos atributos.
          </FieldDescription>
        )}

        <Field>
          <FieldLabel htmlFor="classify-mode">Tipo</FieldLabel>
          <Select
            value={mode}
            onValueChange={next => setMode(next as ClassifyMode)}
          >
            <SelectTrigger id="classify-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">Cor única</SelectItem>
                <SelectItem value="graduated">Graduada (intervalos)</SelectItem>
                <SelectItem value="categorical">
                  Categórica (valores únicos)
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {mode === 'graduated' && data && numericFields.length === 0 && (
          <FieldDescription>
            Nenhum campo numérico encontrado no GeoJSON.
          </FieldDescription>
        )}

        {mode === 'graduated' && data && numericFields.length > 0 && (
          <>
            <Field>
              <FieldLabel htmlFor="classify-property">
                Campo numérico
              </FieldLabel>
              <Select
                value={property || NONE_PROPERTY}
                onValueChange={next =>
                  handleGraduatedProperty(next === NONE_PROPERTY ? '' : next)
                }
              >
                <SelectTrigger id="classify-property" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={NONE_PROPERTY}>Selecione</SelectItem>
                    {numericFields.map(field => (
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

                {classify &&
                  classify.mode !== 'categorical' &&
                  classify.classes.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div
                        className={`${CLASS_ROW_GRID} text-muted-foreground text-xs`}
                      >
                        <span />
                        <span>Cor</span>
                        <span>Hex</span>
                        <span>Min</span>
                        <span>Max</span>
                        <span>Rótulo</span>
                        <span />
                      </div>
                      {classify.classes.map((cls, i) => (
                        <div key={i} className={CLASS_ROW_GRID}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={
                              cls.visible === false ? 'Mostrar' : 'Ocultar'
                            }
                            onClick={() =>
                              updateGraduatedClass(i, {
                                visible: cls.visible === false,
                              })
                            }
                          >
                            {cls.visible === false ? (
                              <EyeOffIcon />
                            ) : (
                              <EyeIcon />
                            )}
                          </Button>
                          <ClassColorInput
                            color={cls.color}
                            onChange={color =>
                              updateGraduatedClass(i, { color })
                            }
                          />
                          <ClassNumberInput
                            value={cls.min}
                            onChange={min => updateGraduatedClass(i, { min })}
                            aria-label="Mínimo"
                          />
                          <ClassNumberInput
                            value={cls.max}
                            onChange={max => updateGraduatedClass(i, { max })}
                            aria-label="Máximo"
                          />
                          <Input
                            value={cls.label}
                            onChange={event =>
                              updateGraduatedClass(i, {
                                label: event.target.value,
                              })
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
                  onClick={addGraduatedClass}
                >
                  <PlusIcon data-icon="inline-start" />
                  Adicionar classe
                </Button>
              </>
            )}
          </>
        )}

        {mode === 'categorical' && data && allFields.length === 0 && (
          <FieldDescription>
            Nenhuma propriedade encontrada no GeoJSON.
          </FieldDescription>
        )}

        {mode === 'categorical' && data && allFields.length > 0 && (
          <>
            <Field>
              <FieldLabel htmlFor="classify-cat-property">Campo</FieldLabel>
              <Select
                value={property || NONE_PROPERTY}
                onValueChange={next =>
                  handleCategoricalProperty(next === NONE_PROPERTY ? '' : next)
                }
              >
                <SelectTrigger id="classify-cat-property" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={NONE_PROPERTY}>Selecione</SelectItem>
                    {allFields.map(field => (
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                >
                  Gerar classes
                </Button>
                <Field>
                  <FieldLabel>Paleta</FieldLabel>
                  <PalettePicker
                    value={paletteId}
                    options={CLASSIFY_PALETTES}
                    onChange={handlePaletteChange}
                  />
                </Field>
                {classify?.mode === 'categorical' &&
                  classify.classes.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div
                        className={`${CATEGORICAL_ROW_GRID} text-muted-foreground text-xs`}
                      >
                        <span />
                        <span>Cor</span>
                        <span>Hex</span>
                        <span>Valor</span>
                        <span>Rótulo</span>
                        <span />
                      </div>
                      {classify.classes.map((cls, i) => (
                        <div
                          key={`${cls.value}-${i}`}
                          className={CATEGORICAL_ROW_GRID}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={
                              cls.visible === false ? 'Mostrar' : 'Ocultar'
                            }
                            onClick={() =>
                              updateCategoricalClass(i, {
                                visible: cls.visible === false,
                              })
                            }
                          >
                            {cls.visible === false ? (
                              <EyeOffIcon />
                            ) : (
                              <EyeIcon />
                            )}
                          </Button>
                          <ClassColorInput
                            color={cls.color}
                            onChange={color =>
                              updateCategoricalClass(i, { color })
                            }
                          />
                          <Input value={cls.value} readOnly />
                          <Input
                            value={cls.label}
                            onChange={event =>
                              updateCategoricalClass(i, {
                                label: event.target.value,
                              })
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
              </>
            )}
          </>
        )}
      </FieldGroup>
    </FieldSet>
  )
}

function formatClassNumber(value: number) {
  if (!Number.isFinite(value)) return ''
  return String(value).replace('.', ',')
}

function parseClassNumber(raw: string) {
  const normalized = raw.trim().replace(',', '.')
  if (
    !normalized ||
    normalized === '-' ||
    normalized === '.' ||
    normalized === '-.'
  ) {
    return null
  }
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function ClassNumberInput({
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  value: number
  onChange: (value: number) => void
  'aria-label': string
}) {
  const formatted = formatClassNumber(value)
  const [text, setText] = useState(formatted)

  useEffect(() => {
    setText(formatted)
  }, [formatted])

  const commit = () => {
    const next = parseClassNumber(text)
    if (next === null) {
      setText(formatted)
      return
    }
    onChange(next)
    setText(formatClassNumber(next))
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={event => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        commit()
      }}
      aria-label={ariaLabel}
    />
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
