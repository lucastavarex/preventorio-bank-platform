'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { parseBasemapId } from '@/components/map/basemap-styles'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
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
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCreateMap, useUpdateMap } from '@/hooks/use-maps'
import { isNextRedirect } from '@/lib/next-redirect'
import { type MapFormValues, mapFormSchema } from '@/lib/schemas/map-form'
import type {
  LayerWithGroups,
  SavedMap,
  SavedMapCamera,
  SavedMapLayer,
} from '@/lib/supabase/types'

type MapDraft = {
  layerIds?: string[]
  opacities?: number[]
  basemapId?: string
  camera?: SavedMapCamera
}

type MapFormProps = {
  layers: LayerWithGroups[]
  defaultValues?: Partial<SavedMap>
  draft?: MapDraft
}

function initialLayers(
  defaultValues?: Partial<SavedMap>,
  draft?: MapDraft
): SavedMapLayer[] {
  if (defaultValues?.layers?.length) return defaultValues.layers
  if (draft?.layerIds?.length) {
    return draft.layerIds.map((id, index) => ({
      id,
      opacity: (draft.opacities?.[index] ?? 100) / 100,
    }))
  }
  return []
}

export function MapForm({ layers, defaultValues, draft }: MapFormProps) {
  const createMap = useCreateMap()
  const updateMap = useUpdateMap(defaultValues?.id ?? '')
  const mutation = defaultValues?.id ? updateMap : createMap
  const layersById = useMemo(() => {
    const map = new Map(layers.map(layer => [layer.id, layer]))
    return map
  }, [layers])

  const form = useForm<MapFormValues>({
    resolver: zodResolver(mapFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      notes: defaultValues?.notes ?? '',
      basemapId: parseBasemapId(defaultValues?.basemap_id ?? draft?.basemapId),
      isPrivate: defaultValues?.is_private ?? false,
      layers: initialLayers(defaultValues, draft),
    },
  })

  const selected = form.watch('layers')

  const toggleLayer = (id: string, checked: boolean) => {
    const prev = form.getValues('layers')
    const next = checked
      ? prev.some(layer => layer.id === id)
        ? prev
        : [...prev, { id, opacity: 1 }]
      : prev.filter(layer => layer.id !== id)
    form.setValue('layers', next, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    })
  }

  const moveLayer = (index: number, direction: -1 | 1) => {
    const prev = form.getValues('layers')
    const next = [...prev]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    form.setValue('layers', next, { shouldDirty: true })
  }

  const setOpacity = (id: string, opacity: number) => {
    form.setValue(
      'layers',
      form
        .getValues('layers')
        .map(layer => (layer.id === id ? { ...layer, opacity } : layer)),
      { shouldDirty: true }
    )
  }

  const onSubmit = useCallback(
    async (values: MapFormValues) => {
      if (mutation.isPending) return

      const formData = new FormData()
      formData.set('title', values.title)
      formData.set('description', values.description)
      formData.set('notes', values.notes)
      formData.set('is_private', values.isPrivate ? 'on' : '')
      formData.set('basemap_id', values.basemapId)
      formData.set('layers', JSON.stringify(values.layers))
      formData.set(
        'camera',
        JSON.stringify(defaultValues?.camera ?? draft?.camera ?? {})
      )

      try {
        await mutation.mutateAsync(formData)
      } catch (error) {
        if (isNextRedirect(error)) throw error
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o mapa.'
        )
      }
    },
    [defaultValues?.camera, draft?.camera, mutation]
  )

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="title" required>
                Título
              </FieldLabel>
              <Input
                {...field}
                id="title"
                aria-invalid={fieldState.invalid || undefined}
                aria-required
                placeholder="Ex: Percepção vs vulnerabilidade — deslizamento"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="description">Descrição</FieldLabel>
              <Textarea
                {...field}
                id="description"
                placeholder="O que esta composição mostra"
              />
            </Field>
          )}
        />

        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="notes">Anotações</FieldLabel>
              <Textarea
                {...field}
                id="notes"
                placeholder="Anotações internas"
              />
            </Field>
          )}
        />

        <Controller
          name="basemapId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="basemap_id">Mapa-base</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="basemap_id"
                  className="w-full"
                  aria-invalid={fieldState.invalid || undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="streets">OpenStreetMap</SelectItem>
                    <SelectItem value="satellite">Satélite</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          name="isPrivate"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="is_private"
                checked={field.value}
                onCheckedChange={checked => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="is_private">
                Privado (visível apenas para membros e admins)
              </FieldLabel>
            </Field>
          )}
        />
      </FieldGroup>

      <Controller
        name="layers"
        control={form.control}
        render={({ fieldState }) => (
          <Field
            data-disabled={layers.length === 0 || undefined}
            data-invalid={
              layers.length === 0 || fieldState.invalid || undefined
            }
          >
            <FieldLabel required>Camadas</FieldLabel>
            <FieldDescription>
              A ordem é de baixo para cima. A última da lista fica por cima no
              mapa.
            </FieldDescription>
            {layers.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                {layers.map(layer => {
                  const checked = selected.some(item => item.id === layer.id)
                  const inputId = `map-layer-${layer.id}`
                  return (
                    <Field key={layer.id} orientation="horizontal">
                      <Checkbox
                        id={inputId}
                        checked={checked}
                        onCheckedChange={next =>
                          toggleLayer(layer.id, next === true)
                        }
                      />
                      <FieldLabel
                        htmlFor={inputId}
                        className="min-w-0 w-auto flex-1"
                      >
                        <span className="truncate">{layer.title}</span>
                        {layer.groups.length > 0 ? (
                          <span className="text-muted-foreground">
                            {' '}
                            ·{' '}
                            {layer.groups.map(group => group.title).join(' · ')}
                          </span>
                        ) : null}
                      </FieldLabel>
                    </Field>
                  )
                })}
              </div>
            )}

            {selected.length > 0 && (
              <div className="flex flex-col gap-2">
                {selected.map((item, index) => {
                  const layer = layersById.get(item.id)
                  if (!layer) return null
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      <div className="flex flex-col">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={index === 0}
                          onClick={() => moveLayer(index, -1)}
                          aria-label="Subir"
                        >
                          <ArrowUpIcon />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={index === selected.length - 1}
                          onClick={() => moveLayer(index, 1)}
                          aria-label="Descer"
                        >
                          <ArrowDownIcon />
                        </Button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{layer.title}</p>
                        <div className="flex items-center gap-2">
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[item.opacity ?? 1]}
                            onValueChange={values =>
                              setOpacity(item.id, values[0] ?? 1)
                            }
                          />
                          <span className="w-8 text-right text-muted-foreground text-xs tabular-nums">
                            {Math.round((item.opacity ?? 1) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {layers.length === 0 ? (
              <FieldError>Cadastre camadas antes de criar um mapa.</FieldError>
            ) : (
              fieldState.invalid && <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          size="lg"
          className="h-12 min-w-56 px-10 text-base"
          disabled={mutation.isPending || layers.length === 0}
        >
          {mutation.isPending ? <Spinner data-icon="inline-start" /> : null}
          {mutation.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
