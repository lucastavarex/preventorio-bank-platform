'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BaseMap,
  type BaseMapHandle,
  type MapCamera,
} from '@/components/map/base-map'
import { GeoJSONLayer } from '@/components/map/geojson-layer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LayerStyle } from '@/lib/supabase/types'

type LayerPreviewProps = {
  data: GeoJSON.FeatureCollection | null
  style: LayerStyle
  bounds: number[] | null
}

export function LayerPreview({ data, style, bounds }: LayerPreviewProps) {
  const [open, setOpen] = useState(false)
  const [camera, setCamera] = useState<MapCamera | null>(null)
  const [fittedBounds, setFittedBounds] = useState(bounds?.join(',') ?? '')
  const expandedMapRef = useRef<BaseMapHandle>(null)
  const nextBounds = bounds?.join(',') ?? ''
  if (nextBounds !== fittedBounds) {
    setFittedBounds(nextBounds)
    setCamera(null)
  }

  useEffect(() => {
    if (!open) return
    const resize = () => expandedMapRef.current?.getMap()?.resize()
    const frame = window.requestAnimationFrame(resize)
    const timeout = window.setTimeout(resize, 200)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [open])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      const nextCamera = expandedMapRef.current?.getCamera()
      if (nextCamera) setCamera(nextCamera)
    }
    setOpen(next)
  }

  return (
    <>
      <div className="relative aspect-video overflow-hidden rounded-lg border">
        <BaseMap interactive={false} bounds={bounds} camera={camera}>
          {data && (
            <GeoJSONLayer id="preview-thumb" data={data} style={style} />
          )}
        </BaseMap>
        <button
          type="button"
          className="group absolute inset-0 z-10 cursor-pointer"
          onClick={() => setOpen(true)}
          aria-label="Clique para ampliar a pré-visualização"
        >
          <span className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/60" />
          <span className="relative flex h-full items-center justify-center px-4 text-center text-sm font-medium text-black opacity-0 transition-opacity group-hover:opacity-100">
            Clique para ampliar a pré-visualização
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton
          className="flex h-[min(90vh,56rem)] w-[min(96vw,80rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
        >
          <DialogHeader className="border-b px-4 py-3 pr-12">
            <DialogTitle>Pré-visualização</DialogTitle>
            <DialogDescription>
              Role para zoom, arraste para mover o mapa.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            {open && (
              <BaseMap ref={expandedMapRef} bounds={bounds} camera={camera}>
                {data && (
                  <GeoJSONLayer
                    id="preview-expanded"
                    data={data}
                    style={style}
                  />
                )}
              </BaseMap>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
