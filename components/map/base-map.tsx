'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import type { StyleSpecification } from 'maplibre-gl'
import * as maplibregl from 'maplibre-gl'
import { setWorkerUrl } from 'maplibre-gl'
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import MapGL, {
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre'
import { OSM_STYLE } from '@/components/map/basemap-styles'
import { MapZoomControls } from '@/components/map/map-zoom-controls'

if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')
}

const INITIAL_VIEW = {
  longitude: -43.100004,
  latitude: -22.935535,
  zoom: 16,
} as const

export type MapCamera = {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
}

export type BaseMapHandle = {
  getMap: () => maplibregl.Map | undefined
  getCamera: () => MapCamera | undefined
}

type BaseMapProps = {
  children?: ReactNode
  interactive?: boolean
  onClick?: (e: MapLayerMouseEvent) => void
  interactiveLayerIds?: string[]
  bounds?: number[] | null
  camera?: MapCamera | null
  mapStyle?: StyleSpecification
  /** Extra controls stacked below the zoom buttons (e.g. basemap switcher). */
  trailingControls?: ReactNode
  /** When false, hides the built-in zoom / trailing control stack. Default true if interactive. */
  showControls?: boolean
}

export function readCamera(map: maplibregl.Map): MapCamera {
  const center = map.getCenter()
  return {
    longitude: center.lng,
    latitude: center.lat,
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  }
}

export const BaseMap = forwardRef<BaseMapHandle, BaseMapProps>(function BaseMap(
  {
    children,
    interactive = true,
    onClick,
    interactiveLayerIds,
    bounds,
    camera,
    mapStyle = OSM_STYLE,
    trailingControls,
    showControls,
  },
  ref
) {
  const mapRef = useRef<MapRef>(null)
  const [mounted, setMounted] = useState(false)
  const boundsRef = useRef(bounds)
  boundsRef.current = bounds
  const cameraRef = useRef(camera)
  cameraRef.current = camera
  const controlsVisible = showControls ?? interactive

  useEffect(() => {
    setMounted(true)
  }, [])

  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current?.getMap(),
    getCamera: () => {
      const map = mapRef.current?.getMap()
      return map ? readCamera(map) : undefined
    },
  }))

  const applyCamera = useCallback((map: maplibregl.Map, next: MapCamera) => {
    map.jumpTo({
      center: [next.longitude, next.latitude],
      zoom: next.zoom,
      bearing: next.bearing,
      pitch: next.pitch,
    })
  }, [])

  const fitToBounds = useCallback((map: maplibregl.Map) => {
    const nextBounds = boundsRef.current
    if (!nextBounds || nextBounds.length < 4) return
    map.fitBounds(
      [
        [nextBounds[0], nextBounds[1]],
        [nextBounds[2], nextBounds[3]],
      ],
      { padding: 40, duration: 500 }
    )
  }, [])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    if (camera) {
      applyCamera(map, camera)
      return
    }
    if (!bounds || bounds.length < 4) return
    fitToBounds(map)
  }, [applyCamera, bounds, camera, fitToBounds])

  if (!mounted) {
    return <div className="h-full w-full bg-muted" />
  }

  return (
    <div className="relative h-full w-full">
      <MapGL
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={mapStyle}
        initialViewState={camera ?? INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        interactive={interactive}
        onClick={onClick}
        interactiveLayerIds={interactiveLayerIds}
        canvasContextAttributes={{ preserveDrawingBuffer: true }}
        onLoad={e => {
          e.target.resize()
          const saved = cameraRef.current
          if (saved) {
            applyCamera(e.target, saved)
            return
          }
          fitToBounds(e.target)
        }}
      >
        {children}
      </MapGL>

      {controlsVisible && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
          <MapZoomControls getMap={() => mapRef.current?.getMap()} />
          {trailingControls}
        </div>
      )}
    </div>
  )
})
