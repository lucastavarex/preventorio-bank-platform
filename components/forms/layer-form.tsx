'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
  const [groupIds, setGroupIds] = useState<string[]>(defaultGroupIds ?? [])
  const [isPrivate, setIsPrivate] = useState(defaultValues?.is_private ?? false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [confirmPublicOpen, setConfirmPublicOpen] = useState(false)
  const pendingFormDataRef = useRef<FormData | null>(null)
  const createLayer = useCreateLayer()
  const updateLayer = useUpdateLayer(defaultValues?.id ?? '')
  const mutation = defaultValues?.id ? updateLayer : createLayer
  const geojsonQuery = useGeojson(defaultValues?.id)

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
        setSelectedFile(null)
        setFileError('Envie um arquivo .geojson ou .json.')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        try {
          const geojson = parseFeatureCollection(reader.result as string)
          setPreview(geojson)
          setSelectedFile(file)
          setFileError(null)
        } catch (error) {
          setSelectedFile(null)
          setPreview(savedPreview)
          setFileError(
            error instanceof Error ? error.message : 'Arquivo GeoJSON inválido.'
          )
        }
      }
      reader.readAsText(file)
    },
    [savedPreview]
  )

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setFileError(null)
    setPreview(savedPreview)
  }, [savedPreview])

  const toggleGroup = useCallback((groupId: string, checked: boolean) => {
    setGroupIds(prev =>
      checked
        ? prev.includes(groupId)
          ? prev
          : [...prev, groupId]
        : prev.filter(id => id !== groupId)
    )
  }, [])

  const handleStyleChange = useCallback((next: LayerStyle) => {
    setStyle(next)
    if (hasClassify(next)) {
      setLegend(legendFromClassify(next.classify, next.type))
    }
  }, [])

  const buildFormData = useCallback(
    (form: HTMLFormElement) => {
      const formData = new FormData(form)
      const legendToSave = hasClassify(style)
        ? legendFromClassify(style.classify, style.type)
        : legend
      formData.set('style', JSON.stringify(style))
      formData.set('legend', JSON.stringify(legendToSave))
      formData.set('provenance', JSON.stringify(provenance))
      formData.set('popup', JSON.stringify(popup))
      formData.set('is_private', isPrivate ? 'on' : '')
      formData.delete('group_ids')
      for (const id of groupIds) {
        formData.append('group_ids', id)
      }
      if (selectedFile) {
        formData.set('geojson', selectedFile)
      }
      return formData
    },
    [selectedFile, style, legend, provenance, popup, groupIds, isPrivate]
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

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (mutation.isPending) return

      const formData = buildFormData(event.currentTarget)

      if (!isPrivate) {
        pendingFormDataRef.current = formData
        setConfirmPublicOpen(true)
        return
      }

      void save(formData)
    },
    [mutation.isPending, buildFormData, isPrivate, save]
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
  const hasExistingFile = Boolean(defaultValues?.geojson_storage_path)

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Título</FieldLabel>
              <Input
                id="title"
                name="title"
                required
                defaultValue={defaultValues?.title}
                placeholder="Ex: Áreas de risco"
              />
            </Field>

            <Field data-disabled={groups.length === 0 || undefined}>
              <FieldLabel>Grupos</FieldLabel>
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
                          checked={groupIds.includes(group.id)}
                          onCheckedChange={checked =>
                            toggleGroup(group.id, checked === true)
                          }
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
                groupIds.length === 0 && (
                  <FieldError>Selecione ao menos um grupo.</FieldError>
                )
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descrição</FieldLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={defaultValues?.description ?? ''}
                placeholder="Descrição do layer"
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

            <GeojsonDropzone
              file={selectedFile}
              featureCount={preview?.features.length}
              hasExistingFile={hasExistingFile}
              error={fileError}
              required={geojsonRequired && !hasExistingFile}
              onFile={applyFile}
              onClear={clearFile}
            />

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
            disabled={
              mutation.isPending ||
              groups.length === 0 ||
              groupIds.length === 0 ||
              (geojsonRequired && !hasExistingFile && !selectedFile)
            }
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
