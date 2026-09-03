'use client'

import { Maximize2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  BaseMap,
  type BaseMapHandle,
  type MapCamera,
} from '@/components/map/base-map'
import { GeoJSONLayer } from '@/components/map/geojson-layer'
import { Button } from '@/components/ui/button'
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
        <Button
          type="button"
          variant="ghost"
          className="absolute inset-0 z-10 h-auto w-full whitespace-normal rounded-none hover:bg-background/80 hover:cursor-pointer"
          onClick={() => setOpen(true)}
          aria-label="Clique para ampliar a pré-visualização"
        >
          <span className="text-center flex items-center justify-center gap-2 text-base font-medium text-foreground opacity-0 transition-opacity group-hover/button:opacity-100">
            Clique para ampliar a pré-visualização
            <Maximize2Icon className="size-4" />
          </span>
        </Button>
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
