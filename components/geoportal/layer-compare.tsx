'use client'

import { GripVerticalIcon, XIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  BaseMap,
  type BaseMapHandle,
  type MapCamera,
} from '@/components/map/base-map'
import { MapZoomControls } from '@/components/map/map-zoom-controls'
import { GeoJSONLayer } from '@/components/map/geojson-layer'
import { Button } from '@/components/ui/button'
import type { Layer } from '@/lib/supabase/types'
import type { StyleSpecification } from 'maplibre-gl'

type LayerCompareProps = {
  leftLayer: Layer
  rightLayer: Layer
  leftData: GeoJSON.FeatureCollection
  rightData: GeoJSON.FeatureCollection
  leftOpacity?: number
  rightOpacity?: number
  leftHiddenClasses?: Set<number>
  rightHiddenClasses?: Set<number>
  mapStyle: StyleSpecification
  camera: MapCamera | null
  trailingControls?: React.ReactNode
  onExit: (camera: MapCamera | undefined) => void
}

export function LayerCompare({
  leftLayer,
  rightLayer,
  leftData,
  rightData,
  leftOpacity,
  rightOpacity,
  leftHiddenClasses,
  rightHiddenClasses,
  mapStyle,
  camera,
  trailingControls,
  onExit,
}: LayerCompareProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftMapRef = useRef<BaseMapHandle>(null)
  const rightMapRef = useRef<BaseMapHandle>(null)
  const syncingRef = useRef(false)
  const [sliderPct, setSliderPct] = useState(50)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    let cleanup: (() => void) | undefined

    const tryAttach = () => {
      if (cancelled) return
      const left = leftMapRef.current?.getMap()
      const right = rightMapRef.current?.getMap()
      if (!left?.isStyleLoaded() || !right?.isStyleLoaded()) {
        attempts += 1
        if (attempts < 180) window.requestAnimationFrame(tryAttach)
        return
      }

      left.resize()
      right.resize()

      const syncFrom = (
        source: NonNullable<typeof left>,
        target: NonNullable<typeof right>
      ) => {
        if (syncingRef.current) return
        syncingRef.current = true
        target.jumpTo({
          center: source.getCenter(),
          zoom: source.getZoom(),
          bearing: source.getBearing(),
          pitch: source.getPitch(),
        })
        syncingRef.current = false
      }

      const onLeftMove = () => syncFrom(left, right)
      const onRightMove = () => syncFrom(right, left)

      left.on('move', onLeftMove)
      right.on('move', onRightMove)

      cleanup = () => {
        left.off('move', onLeftMove)
        right.off('move', onRightMove)
      }
    }

    tryAttach()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  const updateSliderFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setSliderPct(Math.min(90, Math.max(10, pct)))
  }, [])

  const onSliderPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const target = e.currentTarget
      target.setPointerCapture(e.pointerId)
      updateSliderFromClientX(e.clientX)

      const onMove = (ev: PointerEvent) => updateSliderFromClientX(ev.clientX)
      const onUp = (ev: PointerEvent) => {
        target.releasePointerCapture(ev.pointerId)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [updateSliderFromClientX]
  )

  const handleExit = useCallback(() => {
    const cam =
      leftMapRef.current?.getCamera() ?? rightMapRef.current?.getCamera()
    onExit(cam)
  }, [onExit])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <BaseMap
          ref={leftMapRef}
          mapStyle={mapStyle}
          camera={camera}
          showControls={false}
        >
          <GeoJSONLayer
            id={`compare-left-${leftLayer.id}`}
            data={leftData}
            style={leftLayer.style}
            visible
            opacity={leftOpacity}
            hiddenClassIndexes={leftHiddenClasses}
          />
        </BaseMap>
      </div>

      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${sliderPct}%)` }}
      >
        <BaseMap
          ref={rightMapRef}
          mapStyle={mapStyle}
          camera={camera}
          showControls={false}
        >
          <GeoJSONLayer
            id={`compare-right-${rightLayer.id}`}
            data={rightData}
            style={rightLayer.style}
            visible
            opacity={rightOpacity}
            hiddenClassIndexes={rightHiddenClasses}
          />
        </BaseMap>
      </div>

      <div
        role="slider"
        aria-valuemin={10}
        aria-valuemax={90}
        aria-valuenow={Math.round(sliderPct)}
        aria-label="Comparar layers"
        tabIndex={0}
        className="absolute inset-y-0 z-20 w-4 -translate-x-1/2 cursor-ew-resize touch-none"
        style={{ left: `${sliderPct}%` }}
        onPointerDown={onSliderPointerDown}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') setSliderPct(p => Math.max(10, p - 2))
          if (e.key === 'ArrowRight') setSliderPct(p => Math.min(90, p + 2))
        }}
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-background shadow-md" />
        <div className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-secondary text-secondary-foreground shadow-md">
          <GripVerticalIcon className="size-4" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-30 flex max-w-[40%] flex-col gap-1">
        <span className="w-fit rounded-md bg-background/95 px-2 py-1 font-medium text-xs shadow-md backdrop-blur-sm">
          {leftLayer.title}
        </span>
      </div>
      <div className="pointer-events-none absolute right-4 bottom-4 z-30 flex max-w-[40%] flex-col items-end gap-1">
        <span className="w-fit rounded-md bg-background/95 px-2 py-1 font-medium text-xs shadow-md backdrop-blur-sm">
          {rightLayer.title}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5">
        <MapZoomControls getMap={() => leftMapRef.current?.getMap()} />
        {trailingControls}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="shadow-md"
          title="Sair da comparação"
          aria-label="Sair da comparação"
          onClick={handleExit}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
