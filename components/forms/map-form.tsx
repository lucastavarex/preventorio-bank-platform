'use client'

import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
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
import type {
  LayerWithGroup,
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
  layers: LayerWithGroup[]
  defaultValues?: Partial<SavedMap>
  draft?: MapDraft
}

export function MapForm({ layers, defaultValues, draft }: MapFormProps) {
  const [isPrivate, setIsPrivate] = useState(defaultValues?.is_private ?? false)
  const [basemapId, setBasemapId] = useState(
    defaultValues?.basemap_id ?? draft?.basemapId ?? 'streets'
  )
  const [selected, setSelected] = useState<SavedMapLayer[]>(() => {
    if (defaultValues?.layers?.length) return defaultValues.layers
    if (draft?.layerIds?.length) {
      return draft.layerIds.map((id, index) => ({
        id,
        opacity: (draft.opacities?.[index] ?? 100) / 100,
      }))
    }
    return []
  })

  const createMap = useCreateMap()
  const updateMap = useUpdateMap(defaultValues?.id ?? '')
  const mutation = defaultValues?.id ? updateMap : createMap
  const layersById = useMemo(() => {
    const map = new Map(layers.map(layer => [layer.id, layer]))
    return map
  }, [layers])

  const toggleLayer = (id: string, checked: boolean) => {
    setSelected(prev => {
      if (checked) {
        if (prev.some(layer => layer.id === id)) return prev
        return [...prev, { id, opacity: 1 }]
      }
      return prev.filter(layer => layer.id !== id)
    })
  }

  const moveLayer = (index: number, direction: -1 | 1) => {
    setSelected(prev => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const setOpacity = (id: string, opacity: number) => {
    setSelected(prev =>
      prev.map(layer => (layer.id === id ? { ...layer, opacity } : layer))
    )
  }

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (mutation.isPending) return
      if (selected.length === 0) {
        toast.error('Selecione pelo menos uma camada.')
        return
      }

      const formData = new FormData(event.currentTarget)
      formData.set('is_private', isPrivate ? 'on' : '')
      formData.set('basemap_id', basemapId)
      formData.set('layers', JSON.stringify(selected))
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
    [
      basemapId,
      defaultValues?.camera,
      draft?.camera,
      isPrivate,
      mutation,
      selected,
    ]
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Título</FieldLabel>
          <Input
            id="title"
            name="title"
            required
            defaultValue={defaultValues?.title}
            placeholder="Ex: Percepção vs vulnerabilidade — deslizamento"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Descrição</FieldLabel>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description ?? ''}
            placeholder="O que esta composição mostra"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Anotações</FieldLabel>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="Anotações internas"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="basemap_id">Mapa-base</FieldLabel>
          <Select value={basemapId} onValueChange={setBasemapId}>
            <SelectTrigger id="basemap_id" className="w-full">
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

        <Field orientation="horizontal">
          <Checkbox
            id="is_private"
            checked={isPrivate}
            onCheckedChange={checked => setIsPrivate(checked === true)}
          />
          <FieldLabel htmlFor="is_private">
            Privado (visível apenas para membros e admins)
          </FieldLabel>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <FieldLabel>Camadas</FieldLabel>
        <FieldDescription>
          A ordem é de baixo para cima. A última da lista fica por cima no mapa.
        </FieldDescription>
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          {layers.map(layer => {
            const checked = selected.some(item => item.id === layer.id)
            const inputId = `map-layer-${layer.id}`
            return (
              <Field key={layer.id} orientation="horizontal">
                <Checkbox
                  id={inputId}
                  checked={checked}
                  onCheckedChange={next => toggleLayer(layer.id, next === true)}
                />
                <FieldLabel htmlFor={inputId} className="min-w-0 w-auto flex-1">
                  <span className="truncate">{layer.title}</span>
                  {layer.groups?.title ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · {layer.groups.title}
                    </span>
                  ) : null}
                </FieldLabel>
              </Field>
            )
          })}
          {layers.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Cadastre camadas antes de criar um mapa.
            </p>
          )}
        </div>

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
      </div>

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
