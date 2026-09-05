'use client'

import { GripVerticalIcon } from 'lucide-react'
import type { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl'
import {
  forwardRef,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  BaseMap,
  type BaseMapHandle,
  type MapCamera,
} from '@/components/map/base-map'
import { GeoJSONLayer } from '@/components/map/geojson-layer'
import type { Layer } from '@/lib/supabase/types'

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
}

export type LayerCompareHandle = {
  getMap: () => MaplibreMap | undefined
  getCamera: () => MapCamera | undefined
}

export const LayerCompare = forwardRef<LayerCompareHandle, LayerCompareProps>(
  function LayerCompare(
    {
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
    },
    ref
  ) {
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

    useImperativeHandle(ref, () => ({
      getMap: () => leftMapRef.current?.getMap(),
      getCamera: () =>
        leftMapRef.current?.getCamera() ?? rightMapRef.current?.getCamera(),
    }))

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
      </div>
    )
  }
)
