'use client'

import {
  BringToFrontIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Columns2Icon,
  EyeIcon,
  EyeOffIcon,
  LayersIcon,
  LocateIcon,
  Loader2Icon,
  XIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type MapLayerMouseEvent, Popup } from 'react-map-gl/maplibre'
import { BasemapSwitcher } from '@/components/geoportal/basemap-switcher'
import { GeoportalLegend } from '@/components/geoportal/geoportal-legend'
import { LayerCompare } from '@/components/geoportal/layer-compare'
import { BaseMap, type BaseMapHandle, type MapCamera } from '@/components/map/base-map'
import {
  type BasemapId,
  DEFAULT_BASEMAP_ID,
  getBasemapStyle,
  parseBasemapId,
} from '@/components/map/basemap-styles'
import { GeoJSONLayer } from '@/components/map/geojson-layer'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Slider } from '@/components/ui/slider'
import { hasGraduatedClassify } from '@/lib/classify'
import type { Group, Layer, LayerStyle } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

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
  const mapRef = useRef<BaseMapHandle>(null)
  const layerDataRef = useRef<Record<string, GeoJSON.FeatureCollection>>({})
  const loadingRef = useRef<Set<string>>(new Set())

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP_ID)
  const [mapCamera, setMapCamera] = useState<MapCamera | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groupsWithLayers[0] ? [groupsWithLayers[0].id] : [])
  )
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
    setBasemapId(parseBasemapId(window.localStorage.getItem(BASEMAP_STORAGE_KEY)))
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

  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

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

  const mapControls = (
    <>
      <BasemapSwitcher
        value={basemapId}
        onChange={handleBasemapChange}
        className="shadow-md"
      />
      {!compareMode && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="shadow-md"
          disabled={!canCompare}
          title={
            canCompare
              ? 'Comparar os 2 layers visíveis'
              : 'Ative exatamente 2 layers para comparar'
          }
          aria-label="Comparar layers"
          onClick={enterCompareMode}
        >
          <Columns2Icon />
        </Button>
      )}
    </>
  )

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

  const activeLayers = stackedVisibleLayers

  return (
    <div className="relative h-svh w-full">
      <div className="absolute inset-0">
        {compareMode && comparePair ? (
          <LayerCompare
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
            trailingControls={mapControls}
            onExit={exitCompareMode}
          />
        ) : (
          <BaseMap
            key={basemapId}
            ref={mapRef}
            mapStyle={getBasemapStyle(basemapId)}
            camera={mapCamera}
            onClick={handleMapClick}
            interactiveLayerIds={interactiveLayerIds}
            trailingControls={mapControls}
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
                        {Object.entries(popup.properties).map(([key, val]) => (
                          <tr key={key} className="border-b last:border-0">
                            <td className="pr-2 font-medium">{key}</td>
                            <td>{String(val ?? '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Popup>
            )}
          </BaseMap>
        )}
      </div>

      <Button
        variant="secondary"
        size="icon"
        className="absolute top-4 left-4 z-10 shadow-md"
        onClick={() => setSidebarOpen(prev => !prev)}
      >
        {sidebarOpen ? <XIcon /> : <LayersIcon />}
      </Button>

      <aside
        className={cn(
          'absolute top-16 left-4 z-10 w-80 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm transition-transform',
          !sidebarOpen && '-translate-x-[22rem]'
        )}
      >
        <div className="p-4">
          <h2 className="mb-3 font-semibold text-sm">Layers</h2>

          {groupsWithLayers.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Nenhum grupo cadastrado.
            </p>
          )}

          {groupsWithLayers.map(group => (
            <Collapsible
              key={group.id}
              open={expandedGroups.has(group.id)}
              onOpenChange={() => toggleGroup(group.id)}
              className="mb-2"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex h-auto w-full items-center gap-1.5 rounded-lg px-1 py-1 text-left text-sm font-bold hover:bg-muted"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {expandedGroups.has(group.id) ? (
                      <ChevronDownIcon className="size-4" />
                    ) : (
                      <ChevronRightIcon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{group.title}</span>
                  {group.is_private && (
                    <span className="shrink-0 rounded bg-orange-100 px-2 py-0.5 font-medium text-orange-700 text-[10px]">
                      Privado
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="ml-3 flex flex-col gap-1.5 border-l pl-3">
                {group.layers.map(layer => {
                  const isVisible = visibleLayers.has(layer.id)
                  const isLoading = loadingLayers.has(layer.id)
                  const canZoom = Boolean(layer.bbox && layer.bbox.length >= 4)
                  const opacity =
                    layerOpacity[layer.id] ?? defaultOpacity(layer.style)
                  const isTop =
                    layerOrder.length > 0 &&
                    layerOrder[layerOrder.length - 1] === layer.id

                  return (
                    <div key={layer.id} className="flex flex-col gap-1">
                      <div className="flex h-6 items-center gap-1.5 text-sm">
                        <button
                          type="button"
                          onClick={() => onLayerNameClick(layer)}
                          title={
                            isVisible
                              ? canZoom
                                ? 'Zoom para o layer'
                                : layer.title
                              : 'Mostrar layer'
                          }
                          className="flex h-6 min-w-0 flex-1 cursor-pointer items-center gap-1 rounded-md bg-muted/60 px-2 text-left hover:bg-muted"
                        >
                          <span className="truncate">{layer.title}</span>
                          {layerErrors[layer.id] && (
                            <span
                              className="shrink-0 text-[10px] text-destructive"
                              title={layerErrors[layer.id]}
                            >
                              erro
                            </span>
                          )}
                        </button>
                        <div className="flex h-6 shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon-xs"
                            disabled={isLoading}
                            onClick={() => toggleLayer(layer)}
                            title={isVisible ? 'Ocultar' : 'Mostrar'}
                          >
                            {isLoading ? (
                              <Loader2Icon className="animate-spin" />
                            ) : isVisible ? (
                              <EyeIcon />
                            ) : (
                              <EyeOffIcon />
                            )}
                          </Button>
                          {canZoom && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon-xs"
                              onClick={() => zoomToLayer(layer)}
                              title="Zoom para o layer"
                            >
                              <LocateIcon />
                            </Button>
                          )}
                        </div>
                      </div>

                      {isVisible && (
                        <div className="flex h-6 items-center gap-1.5 text-sm">
                          <div className="flex h-6 min-w-0 flex-1 items-center gap-2 rounded-md bg-muted/60 px-2">
                            <Slider
                              min={0}
                              max={1}
                              step={0.05}
                              value={[opacity]}
                              onValueChange={values =>
                                setLayerOpacityValue(layer.id, values[0] ?? 0)
                              }
                              className="min-w-0 flex-1"
                              aria-label={`Opacidade de ${layer.title}`}
                            />
                            <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                              {Math.round(opacity * 100)}%
                            </span>
                          </div>
                          <div className="flex h-6 shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon-xs"
                              disabled={isTop || layerOrder.length < 2}
                              onClick={() => bringLayerToFront(layer.id)}
                              title="Trazer para frente"
                            >
                              <BringToFrontIcon />
                            </Button>
                            {canZoom && <div className="size-6" aria-hidden />}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {group.layers.length === 0 && (
                  <p className="py-1 text-muted-foreground text-xs">
                    Nenhum layer
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </aside>

      {activeLayers.length > 0 && (
        <GeoportalLegend
          layers={activeLayers}
          hiddenClasses={hiddenClasses}
          onToggleClass={toggleClass}
        />
      )}
    </div>
  )
}

function defaultOpacity(style: LayerStyle) {
  return style.fillOpacity ?? style.strokeOpacity ?? style.circleOpacity ?? 1
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
