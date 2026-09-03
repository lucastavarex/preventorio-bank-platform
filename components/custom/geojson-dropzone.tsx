'use client'

import { FileJsonIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type GeojsonDropzoneProps = {
  file: File | null
  featureCount?: number
  hasExistingFile?: boolean
  error?: string | null
  required?: boolean
  onFile: (file: File) => void
  onClear?: () => void
}

const ACCEPT = '.geojson,.json'

export function GeojsonDropzone({
  file,
  featureCount,
  hasExistingFile = false,
  error,
  onFile,
  onClear,
}: GeojsonDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const canClear = Boolean(file && onClear)

  const pickFile = (list: FileList | null) => {
    const next = list?.[0]
    if (!next) return
    onFile(next)
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={inputId}>Arquivo GeoJSON</FieldLabel>
      {hasExistingFile && !file && (
        <FieldDescription>
          Mantendo o GeoJSON atual. Arraste outro arquivo para substituir.
        </FieldDescription>
      )}
      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={event => {
          pickFile(event.target.files)
          event.target.value = ''
        }}
      />
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          aria-invalid={error ? true : undefined}
          onClick={() => inputRef.current?.click()}
          onDragEnter={event => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragOver={event => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'copy'
            setDragOver(true)
          }}
          onDragLeave={event => {
            event.preventDefault()
            if (event.currentTarget.contains(event.relatedTarget as Node)) return
            setDragOver(false)
          }}
          onDrop={event => {
            event.preventDefault()
            setDragOver(false)
            pickFile(event.dataTransfer.files)
          }}
          className={cn(
            'h-auto min-h-32 w-full flex-col gap-2 whitespace-normal rounded-xl border-dashed px-4 py-6 hover:bg-muted/50 [&_svg:not([class*="size-"])]:size-8',
            dragOver && 'border-ring bg-muted ring-2 ring-ring/40'
          )}
        >
          {file ? (
            <div className="flex w-full flex-col items-center gap-2">
              <FileJsonIcon className="text-primary" />
              <p className="max-w-full truncate font-medium text-sm">
                {file.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatBytes(file.size)}
                {featureCount != null &&
                  ` · ${featureCount} ${featureCount === 1 ? 'feição' : 'feições'}`}
              </p>
              <span className="text-muted-foreground text-xs">
                Clique ou arraste para trocar
              </span>
            </div>
          ) : (
            <>
              <UploadIcon className="text-muted-foreground" />
              <p className="font-medium text-sm">
                Arraste um GeoJSON ou clique para selecionar
              </p>
              <p className="text-muted-foreground text-xs">
                Arquivos .geojson ou .json
              </p>
            </>
          )}
        </Button>
        {canClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-destructive"
            onClick={onClear}
            aria-label="Remover arquivo"
          >
            <Trash2Icon />
          </Button>
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
