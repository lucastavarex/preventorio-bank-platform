'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClassifyEditor } from '@/components/forms/classify-editor'
import { GeojsonDropzone } from '@/components/forms/geojson-dropzone'
import { LayerPreview } from '@/components/forms/layer-preview'
import { LegendEditor } from '@/components/forms/legend-editor'
import { StyleEditor } from '@/components/forms/style-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hasGraduatedClassify, legendFromClassify } from '@/lib/classify'
import { computeBBox, parseFeatureCollection } from '@/lib/geojson'
import type {
  Group,
  Layer,
  LayerStyle,
  LegendConfig,
} from '@/lib/supabase/types'

type LayerFormProps = {
  action: (formData: FormData) => Promise<void>
  groups: Group[]
  defaultValues?: Partial<Layer>
  storageBaseUrl?: string
  geojsonRequired?: boolean
}

export function LayerForm({
  action,
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
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!defaultValues?.geojson_storage_path || !storageBaseUrl) return
    let cancelled = false

    fetch(`${storageBaseUrl}/${defaultValues.geojson_storage_path}`)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.text()
      })
      .then(text => {
        if (cancelled) return
        const geojson = parseFeatureCollection(text)
        setSavedPreview(geojson)
        setPreview(geojson)
        setFileError(null)
      })
      .catch(() => {
        if (cancelled) return
        setFileError('Não foi possível carregar o GeoJSON salvo.')
      })

    return () => {
      cancelled = true
    }
  }, [defaultValues?.geojson_storage_path, storageBaseUrl])

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

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      setSubmitError(null)
      setPending(true)
      const legendToSave = hasGraduatedClassify(style)
        ? legendFromClassify(style.classify, style.type)
        : legend
      formData.set('style', JSON.stringify(style))
      formData.set('legend', JSON.stringify(legendToSave))
      if (selectedFile) {
        formData.set('geojson', selectedFile)
      }
      try {
        await action(formData)
      } catch (error) {
        if (isNextRedirect(error)) throw error
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o layer.'
        )
        setPending(false)
      }
    },
    [action, selectedFile, style, legend]
  )

  const previewBounds = useMemo(
    () => (preview ? computeBBox(preview) : null),
    [preview]
  )
  const hasExistingFile = Boolean(defaultValues?.geojson_storage_path)

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={defaultValues?.title}
              placeholder="Ex: Áreas de risco"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group_id">Grupo</Label>
            <select
              id="group_id"
              name="group_id"
              required
              defaultValue={defaultValues?.group_id}
              disabled={groups.length === 0}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Selecione um grupo</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            {groups.length === 0 && (
              <p className="text-destructive text-sm">
                Crie um grupo antes de cadastrar um layer.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              name="description"
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue={defaultValues?.description ?? ''}
              placeholder="Descrição do layer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anotações</Label>
            <textarea
              id="notes"
              name="notes"
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue={defaultValues?.notes ?? ''}
              placeholder="Anotações internas"
            />
          </div>

          <GeojsonDropzone
            file={selectedFile}
            featureCount={preview?.features.length}
            hasExistingFile={hasExistingFile}
            error={fileError}
            required={geojsonRequired && !hasExistingFile}
            onFile={applyFile}
            onClear={clearFile}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_private"
              name="is_private"
              defaultChecked={defaultValues?.is_private ?? false}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="is_private">
              Privado (visível apenas para leitores e admins)
            </Label>
          </div>
        </div>

        <div className="space-y-4">
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

      {submitError && (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={
            pending ||
            groups.length === 0 ||
            (geojsonRequired && !hasExistingFile && !selectedFile)
          }
        >
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}
