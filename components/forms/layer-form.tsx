'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { GeojsonDropzone } from '@/components/custom/geojson-dropzone'
import { ClassifyEditor } from '@/components/forms/classify-editor'
import { LayerPreview } from '@/components/forms/layer-preview'
import { LegendEditor } from '@/components/forms/legend-editor'
import { PopupEditor } from '@/components/forms/popup-editor'
import { ProvenanceEditor } from '@/components/forms/provenance-editor'
import { StyleEditor } from '@/components/forms/style-editor'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useGeojson } from '@/hooks/use-geojson'
import { useCreateLayer, useUpdateLayer } from '@/hooks/use-layers'
import { hasClassify, legendFromClassify } from '@/lib/classify'
import { computeBBox, parseFeatureCollection } from '@/lib/geojson'
import { isNextRedirect } from '@/lib/next-redirect'
import {
  createLayerFormSchema,
  type LayerFormValues,
} from '@/lib/schemas/layer-form'
import type {
  Group,
  Layer,
  LayerPopupConfig,
  LayerProvenance,
  LayerStyle,
  LegendConfig,
} from '@/lib/supabase/types'

type LayerFormProps = {
  groups: Group[]
  defaultValues?: Partial<Layer>
  defaultGroupIds?: string[]
  geojsonRequired?: boolean
}

export function LayerForm({
  groups,
  defaultValues,
  defaultGroupIds,
  geojsonRequired = false,
}: LayerFormProps) {
  const [preview, setPreview] = useState<GeoJSON.FeatureCollection | null>(null)
  const [savedPreview, setSavedPreview] =
    useState<GeoJSON.FeatureCollection | null>(null)
  const [style, setStyle] = useState<LayerStyle>(defaultValues?.style ?? {})
  const [legend, setLegend] = useState<LegendConfig>(
    defaultValues?.legend ?? {}
  )
  const [provenance, setProvenance] = useState<LayerProvenance>(
    defaultValues?.provenance ?? {}
  )
  const [popup, setPopup] = useState<LayerPopupConfig>(
    defaultValues?.popup ?? {}
  )
  const [fileError, setFileError] = useState<string | null>(null)
  const [confirmPublicOpen, setConfirmPublicOpen] = useState(false)
  const pendingFormDataRef = useRef<FormData | null>(null)
  const createLayer = useCreateLayer()
  const updateLayer = useUpdateLayer(defaultValues?.id ?? '')
  const mutation = defaultValues?.id ? updateLayer : createLayer
  const geojsonQuery = useGeojson(defaultValues?.id)

  const hasExistingFile = Boolean(defaultValues?.geojson_storage_path)
  const requireGeojson = geojsonRequired && !hasExistingFile
  const schema = useMemo(
    () => createLayerFormSchema({ geojsonRequired: requireGeojson }),
    [requireGeojson]
  )

  const form = useForm<LayerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      notes: defaultValues?.notes ?? '',
      groupIds: defaultGroupIds ?? [],
      geojson: null,
      isPrivate: defaultValues?.is_private ?? false,
    },
  })

  const selectedFile = form.watch('geojson')

  useEffect(() => {
    if (!geojsonQuery.data || selectedFile) return
    setSavedPreview(geojsonQuery.data)
    setPreview(geojsonQuery.data)
    setFileError(null)
  }, [geojsonQuery.data, selectedFile])

  useEffect(() => {
    if (!geojsonQuery.isError) return
    setFileError('Não foi possível carregar o GeoJSON salvo.')
  }, [geojsonQuery.isError])

  const applyFile = useCallback(
    (file: File) => {
      const name = file.name.toLowerCase()
      if (!name.endsWith('.geojson') && !name.endsWith('.json')) {
        form.setValue('geojson', null, {
          shouldDirty: true,
          shouldValidate: true,
        })
        setFileError('Envie um arquivo .geojson ou .json.')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        try {
          const geojson = parseFeatureCollection(reader.result as string)
          setPreview(geojson)
          form.setValue('geojson', file, {
            shouldDirty: true,
            shouldValidate: true,
          })
          setFileError(null)
        } catch (error) {
          form.setValue('geojson', null, {
            shouldDirty: true,
            shouldValidate: true,
          })
          setPreview(savedPreview)
          setFileError(
            error instanceof Error ? error.message : 'Arquivo GeoJSON inválido.'
          )
        }
      }
      reader.readAsText(file)
    },
    [form, savedPreview]
  )

  const clearFile = useCallback(() => {
    form.setValue('geojson', null, { shouldDirty: true, shouldValidate: true })
    setFileError(null)
    setPreview(savedPreview)
  }, [form, savedPreview])

  const handleStyleChange = useCallback((next: LayerStyle) => {
    setStyle(next)
    if (hasClassify(next)) {
      setLegend(legendFromClassify(next.classify, next.type))
    }
  }, [])

  const buildFormData = useCallback(
    (values: LayerFormValues) => {
      const formData = new FormData()
      formData.set('title', values.title)
      formData.set('description', values.description)
      formData.set('notes', values.notes)
      const legendToSave = hasClassify(style)
        ? legendFromClassify(style.classify, style.type)
        : legend
      formData.set('style', JSON.stringify(style))
      formData.set('legend', JSON.stringify(legendToSave))
      formData.set('provenance', JSON.stringify(provenance))
      formData.set('popup', JSON.stringify(popup))
      formData.set('is_private', values.isPrivate ? 'on' : '')
      for (const id of values.groupIds) {
        formData.append('group_ids', id)
      }
      if (values.geojson) {
        formData.set('geojson', values.geojson)
      }
      return formData
    },
    [style, legend, provenance, popup]
  )

  const save = useCallback(
    async (formData: FormData) => {
      try {
        await mutation.mutateAsync(formData)
      } catch (error) {
        if (isNextRedirect(error)) throw error
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o layer.'
        )
      }
    },
    [mutation]
  )

  const onSubmit = useCallback(
    (values: LayerFormValues) => {
      if (mutation.isPending) return

      const formData = buildFormData(values)

      if (!values.isPrivate) {
        pendingFormDataRef.current = formData
        setConfirmPublicOpen(true)
        return
      }

      void save(formData)
    },
    [mutation.isPending, buildFormData, save]
  )

  const handleConfirmPublic = useCallback(() => {
    const formData = pendingFormDataRef.current
    pendingFormDataRef.current = null
    setConfirmPublicOpen(false)
    if (formData) void save(formData)
  }, [save])

  const previewBounds = useMemo(
    () => (preview ? computeBBox(preview) : null),
    [preview]
  )

  return (
    <>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <div className="grid gap-6 md:grid-cols-2">
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
                    placeholder="Ex: Áreas de risco"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="groupIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-disabled={groups.length === 0 || undefined}
                  data-invalid={
                    groups.length === 0 || fieldState.invalid || undefined
                  }
                >
                  <FieldLabel required>Grupos</FieldLabel>
                  <FieldDescription>
                    O layer aparece no catálogo de todos os grupos marcados.
                  </FieldDescription>
                  {groups.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-lg border p-3">
                      {groups.map(group => {
                        const inputId = `layer-group-${group.id}`
                        return (
                          <Field key={group.id} orientation="horizontal">
                            <Checkbox
                              id={inputId}
                              checked={field.value.includes(group.id)}
                              onCheckedChange={checked => {
                                const selected = checked === true
                                field.onChange(
                                  selected
                                    ? field.value.includes(group.id)
                                      ? field.value
                                      : [...field.value, group.id]
                                    : field.value.filter(id => id !== group.id)
                                )
                              }}
                            />
                            <FieldLabel
                              htmlFor={inputId}
                              className="min-w-0 w-auto flex-1"
                            >
                              <span className="truncate">{group.title}</span>
                            </FieldLabel>
                          </Field>
                        )
                      })}
                    </div>
                  )}
                  {groups.length === 0 ? (
                    <FieldError>
                      Crie um grupo antes de cadastrar um layer.
                    </FieldError>
                  ) : (
                    fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )
                  )}
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
                    placeholder="Descrição do layer"
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
              name="geojson"
              control={form.control}
              render={({ fieldState }) => (
                <GeojsonDropzone
                  file={selectedFile}
                  featureCount={preview?.features.length}
                  hasExistingFile={hasExistingFile}
                  error={fileError ?? fieldState.error?.message ?? null}
                  required={requireGeojson}
                  onFile={applyFile}
                  onClear={clearFile}
                />
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
                    onCheckedChange={checked =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldLabel htmlFor="is_private">
                    Privado (visível apenas para membros e admins)
                  </FieldLabel>
                </Field>
              )}
            />

            <ProvenanceEditor value={provenance} onChange={setProvenance} />
            <PopupEditor data={preview} value={popup} onChange={setPopup} />
          </FieldGroup>

          <div className="flex flex-col gap-4">
            <LayerPreview data={preview} style={style} bounds={previewBounds} />

            <ClassifyEditor
              data={preview}
              value={style}
              onChange={handleStyleChange}
            />
            <StyleEditor value={style} onChange={handleStyleChange} />
            {!hasClassify(style) && (
              <LegendEditor value={legend} onChange={setLegend} />
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            size="lg"
            className="h-12 min-w-56 px-10 text-base"
            disabled={mutation.isPending || groups.length === 0}
          >
            {mutation.isPending ? <Spinner data-icon="inline-start" /> : null}
            {mutation.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>

      <AlertDialog
        open={confirmPublicOpen}
        onOpenChange={open => {
          setConfirmPublicOpen(open)
          if (!open) pendingFormDataRef.current = null
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar layer como público?</AlertDialogTitle>
            <AlertDialogDescription>
              A opção de layer privado não está marcada. Se continuar, o layer
              ficará público e qualquer pessoa poderá visualizá-lo no geoportal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPublic}>
              Publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
