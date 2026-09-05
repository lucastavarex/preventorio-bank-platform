'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type MapLayerMouseEvent, Popup } from 'react-map-gl/maplibre'
import { toast } from 'sonner'
import { GeoportalSidebar } from '@/components/geoportal/geoportal-sidebar'
import { GeoportalToolbar } from '@/components/geoportal/geoportal-toolbar'
import {
  LayerCompare,
  type LayerCompareHandle,
} from '@/components/geoportal/layer-compare'
import {
  BaseMap,
  type BaseMapHandle,
  type MapCamera,
} from '@/components/map/base-map'
import {
  type BasemapId,
  DEFAULT_BASEMAP_ID,
  getBasemapStyle,
  parseBasemapId,
} from '@/components/map/basemap-styles'
import { GeoJSONLayer } from '@/components/map/geojson-layer'
import { TooltipProvider } from '@/components/ui/tooltip'
import { hasGraduatedClassify } from '@/lib/classify'
import type { Group, Layer, LayerStyle } from '@/lib/supabase/types'

type GroupWithLayers = Group & { layers: Layer[] }

type Props = {
  groupsWithLayers: GroupWithLayers[]
  storageBaseUrl: string
}

type PopupInfo = {
  lng: number
  lat: number
  properties: Record<string, unknown>
}

const BASEMAP_STORAGE_KEY = 'geoportal-basemap'

export function GeoportalClient({ groupsWithLayers, storageBaseUrl }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<BaseMapHandle>(null)
  const compareRef = useRef<LayerCompareHandle>(null)
  const layerDataRef = useRef<Record<string, GeoJSON.FeatureCollection>>({})
  const loadingRef = useRef<Set<string>>(new Set())

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP_ID)
  const [mapCamera, setMapCamera] = useState<MapCamera | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    () => new Set()
  )
  /** Bottom → top stack of visible layer ids. */
  const [layerOrder, setLayerOrder] = useState<string[]>([])
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({})
  const [layerData, setLayerData] = useState<
    Record<string, GeoJSON.FeatureCollection>
  >({})
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(
    () => new Set()
  )
  const [layerErrors, setLayerErrors] = useState<Record<string, string>>({})
  const [popup, setPopup] = useState<PopupInfo | null>(null)
  const [hiddenClasses, setHiddenClasses] = useState<
    Record<string, Set<number>>
  >(() => initialHiddenClasses(groupsWithLayers))

  layerDataRef.current = layerData

  useEffect(() => {
    setBasemapId(
      parseBasemapId(window.localStorage.getItem(BASEMAP_STORAGE_KEY))
    )
  }, [])

  const handleBasemapChange = useCallback((id: BasemapId) => {
    const camera = mapRef.current?.getCamera()
    if (camera) setMapCamera(camera)
    setBasemapId(id)
    window.localStorage.setItem(BASEMAP_STORAGE_KEY, id)
  }, [])

  const layersById = useMemo(() => {
    const map = new Map<string, Layer>()
    for (const group of groupsWithLayers) {
      for (const layer of group.layers) map.set(layer.id, layer)
    }
    return map
  }, [groupsWithLayers])

  const loadLayer = useCallback(
    (layer: Layer) => {
      if (!layer.geojson_storage_path) return
      if (layerDataRef.current[layer.id]) return
      if (loadingRef.current.has(layer.id)) return

      loadingRef.current.add(layer.id)
      setLoadingLayers(prev => new Set(prev).add(layer.id))

      fetch(`${storageBaseUrl}/${layer.geojson_storage_path}`)
        .then(async response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          return response.json() as Promise<GeoJSON.FeatureCollection>
        })
        .then(data => {
          setLayerData(prev => {
            const next = { ...prev, [layer.id]: data }
            layerDataRef.current = next
            return next
          })
          setLayerErrors(prev => {
            if (!(layer.id in prev)) return prev
            const next = { ...prev }
            delete next[layer.id]
            return next
          })
        })
        .catch(() => {
          setLayerErrors(prev => ({
            ...prev,
            [layer.id]: 'Falha ao carregar GeoJSON',
          }))
        })
        .finally(() => {
          loadingRef.current.delete(layer.id)
          setLoadingLayers(prev => {
            const next = new Set(prev)
            next.delete(layer.id)
            return next
          })
        })
    },
    [storageBaseUrl]
  )

  const toggleClass = useCallback(
    (layerId: string, classIndex: number) => {
      const layer = layersById.get(layerId)
      if (!layer || !hasGraduatedClassify(layer.style)) return
      const classes = layer.style.classify.classes

      setHiddenClasses(prev => {
        const next = new Set(
          prev[layerId] ??
            classes.flatMap((cls, i) => (cls.visible === false ? [i] : []))
        )
        if (next.has(classIndex)) next.delete(classIndex)
        else next.add(classIndex)
        return { ...prev, [layerId]: next }
      })
    },
    [layersById]
  )

  const visibleLayersRef = useRef(visibleLayers)
  visibleLayersRef.current = visibleLayers

  const enableLayer = useCallback(
    (layer: Layer) => {
      if (visibleLayersRef.current.has(layer.id)) return

      setVisibleLayers(prev => new Set(prev).add(layer.id))
      setLayerOrder(prev =>
        prev.includes(layer.id) ? prev : [...prev, layer.id]
      )
      setLayerOpacity(prev =>
        layer.id in prev
          ? prev
          : { ...prev, [layer.id]: defaultOpacity(layer.style) }
      )
      loadLayer(layer)
    },
    [loadLayer]
  )

  const disableLayer = useCallback((layer: Layer) => {
    if (!visibleLayersRef.current.has(layer.id)) return

    setVisibleLayers(prev => {
      const next = new Set(prev)
      next.delete(layer.id)
      return next
    })
    setLayerOrder(prev => prev.filter(id => id !== layer.id))
  }, [])

  const toggleLayer = useCallback(
    (layer: Layer) => {
      if (visibleLayersRef.current.has(layer.id)) disableLayer(layer)
      else enableLayer(layer)
    },
    [enableLayer, disableLayer]
  )

  const bringLayerToFront = useCallback((layerId: string) => {
    setLayerOrder(prev => {
      if (!prev.includes(layerId)) return prev
      return [...prev.filter(id => id !== layerId), layerId]
    })
  }, [])

  const setLayerOpacityValue = useCallback((layerId: string, value: number) => {
    setLayerOpacity(prev => ({ ...prev, [layerId]: value }))
  }, [])

  const zoomToLayer = useCallback((layer: Layer) => {
    if (!layer.bbox || layer.bbox.length < 4) return
    const map = mapRef.current?.getMap()
    if (!map) return
    map.fitBounds(
      [
        [layer.bbox[0], layer.bbox[1]],
        [layer.bbox[2], layer.bbox[3]],
      ],
      { padding: 50, duration: 1000 }
    )
  }, [])

  const onLayerNameClick = useCallback(
    (layer: Layer) => {
      enableLayer(layer)
      zoomToLayer(layer)
    },
    [enableLayer, zoomToLayer]
  )

  const downloadLayer = useCallback(
    async (layer: Layer) => {
      if (!layer.geojson_storage_path) {
        toast.error('Este layer não possui GeoJSON')
        return
      }

      try {
        const cached = layerDataRef.current[layer.id]
        const blob = cached
          ? new Blob([JSON.stringify(cached)], {
              type: 'application/geo+json',
            })
          : await fetchLayerGeojsonBlob(
              `${storageBaseUrl}/${layer.geojson_storage_path}`
            )

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = geojsonFilename(layer.title)
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch {
        toast.error('Falha ao baixar GeoJSON')
      }
    },
    [storageBaseUrl]
  )

  const stackedVisibleLayers = useMemo(() => {
    return layerOrder
      .map(id => layersById.get(id))
      .filter((layer): layer is Layer => Boolean(layer))
      .filter(layer => visibleLayers.has(layer.id) && layerData[layer.id])
  }, [layerOrder, layersById, visibleLayers, layerData])

  /** Bottom layer → left; top layer → right. */
  const comparePair = useMemo(() => {
    if (stackedVisibleLayers.length !== 2) return null
    const [leftLayer, rightLayer] = stackedVisibleLayers
    if (!layerData[leftLayer.id] || !layerData[rightLayer.id]) return null
    return { leftLayer, rightLayer }
  }, [stackedVisibleLayers, layerData])

  const canCompare = Boolean(comparePair)

  useEffect(() => {
    if (compareMode && !comparePair) {
      setCompareMode(false)
    }
  }, [compareMode, comparePair])

  const enterCompareMode = useCallback(() => {
    if (!comparePair) return
    const camera = mapRef.current?.getCamera()
    if (camera) setMapCamera(camera)
    setPopup(null)
    setCompareMode(true)
  }, [comparePair])

  const exitCompareMode = useCallback((camera: MapCamera | undefined) => {
    if (camera) setMapCamera(camera)
    setCompareMode(false)
  }, [])

  const getMap = useCallback(() => {
    if (compareMode) return compareRef.current?.getMap()
    return mapRef.current?.getMap()
  }, [compareMode])

  const interactiveLayerIds = useMemo(
    () =>
      [...stackedVisibleLayers]
        .reverse()
        .flatMap(l => [l.id, `${l.id}-outline`]),
    [stackedVisibleLayers]
  )

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap()
      if (!map) return

      const queryIds = interactiveLayerIds.filter(id => map.getLayer(id))
      if (queryIds.length === 0) {
        setPopup(null)
        return
      }

      const features = map.queryRenderedFeatures(e.point, { layers: queryIds })

      if (features.length > 0) {
        setPopup({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          properties: (features[0].properties ?? {}) as Record<string, unknown>,
        })
      } else {
        setPopup(null)
      }
    },
    [interactiveLayerIds]
  )

  return (
    <TooltipProvider>
      <div ref={rootRef} className="relative h-svh w-full">
        <div className="absolute inset-0">
          {compareMode && comparePair ? (
            <LayerCompare
              ref={compareRef}
              leftLayer={comparePair.leftLayer}
              rightLayer={comparePair.rightLayer}
              leftData={layerData[comparePair.leftLayer.id]}
              rightData={layerData[comparePair.rightLayer.id]}
              leftOpacity={layerOpacity[comparePair.leftLayer.id]}
              rightOpacity={layerOpacity[comparePair.rightLayer.id]}
              leftHiddenClasses={hiddenClasses[comparePair.leftLayer.id]}
              rightHiddenClasses={hiddenClasses[comparePair.rightLayer.id]}
              mapStyle={getBasemapStyle(basemapId)}
              camera={mapCamera}
            />
          ) : (
            <BaseMap
              key={basemapId}
              ref={mapRef}
              mapStyle={getBasemapStyle(basemapId)}
              camera={mapCamera}
              onClick={handleMapClick}
              interactiveLayerIds={interactiveLayerIds}
              showControls={false}
            >
              {/* Top-first so beforeId always points at an already-mounted layer. */}
              {[...stackedVisibleLayers]
                .reverse()
                .map((layer, index, stackTopFirst) => {
                  const data = layerData[layer.id]
                  if (!data) return null
                  const above = stackTopFirst[index - 1]
                  return (
                    <GeoJSONLayer
                      key={layer.id}
                      id={layer.id}
                      data={data}
                      style={layer.style}
                      visible
                      opacity={layerOpacity[layer.id]}
                      beforeId={above?.id}
                      hiddenClassIndexes={hiddenClasses[layer.id]}
                    />
                  )
                })}

              {popup && (
                <Popup
                  longitude={popup.lng}
                  latitude={popup.lat}
                  onClose={() => setPopup(null)}
                  closeOnClick={false}
                  maxWidth="320px"
                >
                  <div className="max-h-48 overflow-auto text-xs">
                    {Object.keys(popup.properties).length === 0 ? (
                      <p className="text-muted-foreground">Sem atributos</p>
                    ) : (
                      <table className="w-full">
                        <tbody>
                          {Object.entries(popup.properties).map(
                            ([key, val]) => (
                              <tr key={key} className="border-b last:border-0">
                                <td className="pr-2 font-medium">{key}</td>
                                <td>{String(val ?? '')}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Popup>
              )}
            </BaseMap>
          )}
        </div>

        <GeoportalSidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          groupsWithLayers={groupsWithLayers}
          basemapId={basemapId}
          onBasemapChange={handleBasemapChange}
          visibleLayers={visibleLayers}
          layerOrder={layerOrder}
          layersById={layersById}
          layerOpacity={layerOpacity}
          loadingLayers={loadingLayers}
          layerErrors={layerErrors}
          onToggleLayer={toggleLayer}
          onLayerNameClick={onLayerNameClick}
          onDownloadLayer={downloadLayer}
          onBringToFront={bringLayerToFront}
          onOpacityChange={setLayerOpacityValue}
          hiddenClasses={hiddenClasses}
          onToggleClass={toggleClass}
        />

        <GeoportalToolbar
          getMap={getMap}
          fullscreenTargetRef={rootRef}
          onOpenSidebar={() => setSidebarOpen(true)}
          canCompare={canCompare}
          compareMode={compareMode}
          onEnterCompare={enterCompareMode}
          onExitCompare={() => exitCompareMode(compareRef.current?.getCamera())}
        />
      </div>
    </TooltipProvider>
  )
}

function defaultOpacity(style: LayerStyle) {
  return style.fillOpacity ?? style.strokeOpacity ?? style.circleOpacity ?? 1
}

async function fetchLayerGeojsonBlob(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.blob()
}

function geojsonFilename(title: string) {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'layer'}.geojson`
}

function initialHiddenClasses(groups: GroupWithLayers[]) {
  const init: Record<string, Set<number>> = {}
  for (const group of groups) {
    for (const layer of group.layers) {
      if (!hasGraduatedClassify(layer.style)) continue
      const hidden = new Set<number>()
      layer.style.classify.classes.forEach((cls, i) => {
        if (cls.visible === false) hidden.add(i)
      })
      if (hidden.size > 0) init[layer.id] = hidden
    }
  }
  return init
}
