'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { GeojsonDropzone } from '@/components/custom/geojson-dropzone'
import { ClassifyEditor } from '@/components/forms/classify-editor'
import { LayerPreview } from '@/components/forms/layer-preview'
import { LegendEditor } from '@/components/forms/legend-editor'
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
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useGeojson } from '@/hooks/use-geojson'
import { useCreateLayer, useUpdateLayer } from '@/hooks/use-layers'
import { hasGraduatedClassify, legendFromClassify } from '@/lib/classify'
import { computeBBox, parseFeatureCollection } from '@/lib/geojson'
import { isNextRedirect } from '@/lib/next-redirect'
import type {
  Group,
  Layer,
  LayerStyle,
  LegendConfig,
} from '@/lib/supabase/types'

type LayerFormProps = {
  groups: Group[]
  defaultValues?: Partial<Layer>
  storageBaseUrl?: string
  geojsonRequired?: boolean
}

export function LayerForm({
  groups,
  defaultValues,
  storageBaseUrl,
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
  const [groupId, setGroupId] = useState(defaultValues?.group_id ?? '')
  const [isPrivate, setIsPrivate] = useState(defaultValues?.is_private ?? false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [confirmPublicOpen, setConfirmPublicOpen] = useState(false)
  const pendingFormDataRef = useRef<FormData | null>(null)
  const createLayer = useCreateLayer()
  const updateLayer = useUpdateLayer(defaultValues?.id ?? '')
  const mutation = defaultValues?.id ? updateLayer : createLayer
  const geojsonQuery = useGeojson(
    defaultValues?.geojson_storage_path ?? undefined,
    storageBaseUrl
  )

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

  const handleStyleChange = useCallback((next: LayerStyle) => {
    setStyle(next)
    if (hasGraduatedClassify(next)) {
      setLegend(legendFromClassify(next.classify, next.type))
    }
  }, [])

  const buildFormData = useCallback(
    (form: HTMLFormElement) => {
      const formData = new FormData(form)
      const legendToSave = hasGraduatedClassify(style)
        ? legendFromClassify(style.classify, style.type)
        : legend
      formData.set('style', JSON.stringify(style))
      formData.set('legend', JSON.stringify(legendToSave))
      formData.set('group_id', groupId)
      formData.set('is_private', isPrivate ? 'on' : '')
      if (selectedFile) {
        formData.set('geojson', selectedFile)
      }
      return formData
    },
    [selectedFile, style, legend, groupId, isPrivate]
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
              <FieldLabel htmlFor="group_id">Grupo</FieldLabel>
              <Select
                value={groupId}
                onValueChange={setGroupId}
                disabled={groups.length === 0}
              >
                <SelectTrigger id="group_id" className="w-full">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {groups.length === 0 && (
                <FieldError>
                  Crie um grupo antes de cadastrar um layer.
                </FieldError>
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
          </FieldGroup>

          <div className="flex flex-col gap-4">
            <LayerPreview data={preview} style={style} bounds={previewBounds} />

            <ClassifyEditor
              data={preview}
              value={style}
              onChange={handleStyleChange}
            />
            <StyleEditor value={style} onChange={handleStyleChange} />
            {!hasGraduatedClassify(style) && (
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
              !groupId ||
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
