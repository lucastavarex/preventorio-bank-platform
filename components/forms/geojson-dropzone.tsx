'use client'

import { FileJsonIcon, UploadIcon, XIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  required = false,
  onFile,
  onClear,
}: GeojsonDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const canClear = Boolean(onClear) && (!required || hasExistingFile)

  const pickFile = (list: FileList | null) => {
    const next = list?.[0]
    if (!next) return
    onFile(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>Arquivo GeoJSON</Label>
      {hasExistingFile && !file && (
        <p className="text-muted-foreground text-xs">
          Mantendo o GeoJSON atual. Arraste outro arquivo para substituir.
        </p>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={e => {
          pickFile(e.target.files)
          e.target.value = ''
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          inputRef.current?.click()
        }}
        onDragEnter={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={e => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          setDragOver(true)
        }}
        onDragLeave={e => {
          e.preventDefault()
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setDragOver(false)
        }}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          pickFile(e.dataTransfer.files)
        }}
        className={cn(
          'flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-ring bg-muted ring-2 ring-ring/40'
            : 'border-input hover:bg-muted/50',
          error && 'border-destructive'
        )}
      >
        {file ? (
          <div className="flex w-full max-w-sm flex-col items-center gap-2">
            <FileJsonIcon className="size-8 text-primary" />
            <p className="max-w-full truncate font-medium text-sm">{file.name}</p>
            <p className="text-muted-foreground text-xs">
              {formatBytes(file.size)}
              {featureCount != null &&
                ` · ${featureCount} ${featureCount === 1 ? 'feição' : 'feições'}`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                Clique ou arraste para trocar
              </span>
              {canClear && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={e => {
                    e.stopPropagation()
                    onClear?.()
                  }}
                  aria-label="Remover arquivo"
                >
                  <XIcon />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <UploadIcon className="size-8 text-muted-foreground" />
            <p className="font-medium text-sm">
              Arraste um GeoJSON ou clique para selecionar
            </p>
            <p className="text-muted-foreground text-xs">
              Arquivos .geojson ou .json
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
