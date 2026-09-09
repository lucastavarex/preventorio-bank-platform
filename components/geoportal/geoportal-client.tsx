'use client'

import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type MapLayerMouseEvent, Popup } from 'react-map-gl/maplibre'
import { toast } from 'sonner'
import { FeaturePopup } from '@/components/geoportal/feature-popup'
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
import { fetchGeojson } from '@/hooks/use-geojson'
import { useGroupsWithLayers } from '@/hooks/use-layers'
import { useMapForViewer } from '@/hooks/use-maps'
import { hasClassify } from '@/lib/classify'
import {
  COMPARE_SLIDER_DEFAULT,
  clampCompareSlider,
  compositionFromSavedMap,
  type GeoportalShareState,
  replaceGeoportalUrl,
  savedMapNewPath,
} from '@/lib/geoportal-url'
import { queryKeys } from '@/lib/query/keys'
import type { Group, Layer, LayerStyle } from '@/lib/supabase/types'

type GroupWithLayers = Group & { layers: Layer[] }

type PopupInfo = {
  lng: number
  lat: number
  layerId: string
  properties: Record<string, unknown>
}

const BASEMAP_STORAGE_KEY = 'geoportal-basemap'

export function GeoportalClient({
  initialMapId,
  initialLayerId,
  initialLayerIds,
  initialOpacities,
  initialBasemapId,
  initialCamera,
  initialCompare,
  initialCompareSlider,
  hasShareParams,
}: {
  initialMapId?: string
  initialLayerId?: string
  initialLayerIds?: string[]
  initialOpacities?: number[]
  initialBasemapId?: BasemapId
  initialCamera?: MapCamera
  initialCompare?: boolean
  initialCompareSlider?: number
  hasShareParams?: boolean
}) {
  const queryClient = useQueryClient()
  const groupsQuery = useGroupsWithLayers()
  const groupsWithLayers = groupsQuery.data ?? []
  const savedMapQuery = useMapForViewer(initialMapId)

  const rootRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<BaseMapHandle>(null)
  const compareRef = useRef<LayerCompareHandle>(null)
  const appliedViewRef = useRef(false)
  const wantCompareRef = useRef(Boolean(initialCompare))
  const compareWasActiveRef = useRef(false)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [basemapId, setBasemapId] = useState<BasemapId>(
    initialBasemapId ?? DEFAULT_BASEMAP_ID
  )
  const [mapCamera, setMapCamera] = useState<MapCamera | null>(
    initialCamera ?? null
  )
  const [compareMode, setCompareMode] = useState(false)
  const [compareSlider, setCompareSlider] = useState(
    () => initialCompareSlider ?? COMPARE_SLIDER_DEFAULT
  )
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    () => new Set()
  )
  const [layerOrder, setLayerOrder] = useState<string[]>([])
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({})
  const [popup, setPopup] = useState<PopupInfo | null>(null)
  const [hiddenClasses, setHiddenClasses] = useState<
    Record<string, Set<number>>
  >({})
  const [factLayerId, setFactLayerId] = useState<string | null>(null)
  const [shareRevision, setShareRevision] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    if (hasShareParams) return
    setBasemapId(
      parseBasemapId(window.localStorage.getItem(BASEMAP_STORAGE_KEY))
    )
  }, [hasShareParams])

  useEffect(() => {
    if (groupsQuery.isError) {
      toast.error(
        groupsQuery.error instanceof Error
          ? groupsQuery.error.message
          : 'Não foi possível carregar o geoportal.'
      )
    }
  }, [groupsQuery.isError, groupsQuery.error])

  useEffect(() => {
    setHiddenClasses(prev => {
      const defaults = initialHiddenClasses(groupsWithLayers)
      let changed = false
      const next = { ...prev }
      for (const [id, hidden] of Object.entries(defaults)) {
        if (!(id in next)) {
          next[id] = hidden
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [groupsWithLayers])

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

  const visibleLayerList = useMemo(
    () =>
      layerOrder
        .map(id => layersById.get(id))
        .filter((layer): layer is Layer => Boolean(layer))
        .filter(
          layer => visibleLayers.has(layer.id) && layer.geojson_storage_path
        ),
    [layerOrder, layersById, visibleLayers]
  )

  const geojsonQueries = useQueries({
    queries: visibleLayerList.map(layer => ({
      queryKey: queryKeys.geojson.byLayer(layer.id),
      queryFn: () => fetchGeojson(layer.id),
      staleTime: Number.POSITIVE_INFINITY,
    })),
  })

  const layerData = useMemo(() => {
    const data: Record<string, GeoJSON.FeatureCollection> = {}
    visibleLayerList.forEach((layer, index) => {
      const result = geojsonQueries[index]?.data
      if (result) data[layer.id] = result
    })
    return data
  }, [visibleLayerList, geojsonQueries])

  const loadingLayers = useMemo(() => {
    const loading = new Set<string>()
    visibleLayerList.forEach((layer, index) => {
      if (geojsonQueries[index]?.isPending) loading.add(layer.id)
    })
    return loading
  }, [visibleLayerList, geojsonQueries])

  const layerErrors = useMemo(() => {
    const errors: Record<string, string> = {}
    visibleLayerList.forEach((layer, index) => {
      if (geojsonQueries[index]?.isError) {
        errors[layer.id] = 'Falha ao carregar GeoJSON'
      }
    })
    return errors
  }, [visibleLayerList, geojsonQueries])

  const toggleClass = useCallback(
    (layerId: string, classIndex: number) => {
      const layer = layersById.get(layerId)
      if (!layer || !hasClassify(layer.style)) return
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

  const enableLayer = useCallback((layer: Layer, opacity?: number) => {
    setVisibleLayers(prev => new Set(prev).add(layer.id))
    setLayerOrder(prev =>
      prev.includes(layer.id) ? prev : [...prev, layer.id]
    )
    setLayerOpacity(prev =>
      layer.id in prev && opacity == null
        ? prev
        : { ...prev, [layer.id]: opacity ?? defaultOpacity(layer.style) }
    )
  }, [])

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
      else {
        enableLayer(layer)
      }
    },
    [enableLayer, disableLayer]
  )

  const reorderLayers = useCallback((nextOrder: string[]) => {
    setLayerOrder(nextOrder)
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

  const applyShareState = useCallback(
    (state: GeoportalShareState) => {
      const nextVisible = new Set<string>()
      const nextOrder: string[] = []
      const nextOpacity: Record<string, number> = {}

      for (const id of state.layerIds) {
        const layer = layersById.get(id)
        if (!layer) continue
        nextVisible.add(id)
        nextOrder.push(id)
        nextOpacity[id] = state.opacities[id] ?? defaultOpacity(layer.style)
      }

      setVisibleLayers(nextVisible)
      setLayerOrder(nextOrder)
      setLayerOpacity(nextOpacity)
      setBasemapId(state.basemapId)
      if (state.camera) {
        setMapCamera({
          longitude: state.camera.longitude,
          latitude: state.camera.latitude,
          zoom: state.camera.zoom,
          bearing: state.camera.bearing ?? 0,
          pitch: state.camera.pitch ?? 0,
        })
      }
    },
    [layersById]
  )

  useEffect(() => {
    if (appliedViewRef.current || layersById.size === 0) return

    if (initialMapId) {
      if (savedMapQuery.isPending) return
      if (savedMapQuery.data) {
        const saved = compositionFromSavedMap(savedMapQuery.data)
        applyShareState({
          ...saved,
          basemapId: initialBasemapId ?? saved.basemapId,
          camera: initialCamera ?? saved.camera,
        })
        appliedViewRef.current = true
        return
      }
    }

    if (initialLayerIds?.length) {
      const opacities: Record<string, number> = {}
      initialLayerIds.forEach((id, index) => {
        const pct = initialOpacities?.[index]
        if (pct != null) opacities[id] = pct / 100
      })
      applyShareState({
        layerIds: initialLayerIds,
        opacities,
        basemapId: initialBasemapId ?? basemapId,
        camera: initialCamera,
      })
      appliedViewRef.current = true
      return
    }

    if (initialLayerId) {
      const layer = layersById.get(initialLayerId)
      if (layer) {
        enableLayer(layer)
        const tryFocus = () => {
          const map = mapRef.current?.getMap()
          if (!map) {
            requestAnimationFrame(tryFocus)
            return
          }
          zoomToLayer(layer)
        }
        tryFocus()
      }
    }

    appliedViewRef.current = true
  }, [
    applyShareState,
    basemapId,
    enableLayer,
    initialBasemapId,
    initialCamera,
    initialLayerId,
    initialLayerIds,
    initialMapId,
    initialOpacities,
    layersById,
    savedMapQuery.data,
    savedMapQuery.isPending,
    zoomToLayer,
  ])

  const flushShareUrl = useCallback(() => {
    const ids = layerOrder.filter(id => visibleLayers.has(id))
    const liveCamera =
      (compareMode
        ? compareRef.current?.getCamera()
        : mapRef.current?.getCamera()) ?? mapCamera

    replaceGeoportalUrl({
      layerIds: ids,
      opacities: layerOpacity,
      basemapId,
      camera: liveCamera ?? undefined,
      compare: compareMode,
      compareSlider: clampCompareSlider(compareSlider),
    })
  }, [
    basemapId,
    compareMode,
    compareSlider,
    layerOpacity,
    layerOrder,
    mapCamera,
    visibleLayers,
  ])

  useEffect(() => {
    if (!appliedViewRef.current || shareRevision < 0) return
    const timer = window.setTimeout(flushShareUrl, 400)
    return () => window.clearTimeout(timer)
  }, [flushShareUrl, shareRevision])

  const downloadLayer = useCallback(
    async (layer: Layer) => {
      if (!layer.geojson_storage_path) {
        toast.error('Este layer não possui GeoJSON')
        return
      }

      try {
        const cached = queryClient.getQueryData<GeoJSON.FeatureCollection>(
          queryKeys.geojson.byLayer(layer.id)
        )
        const data = cached ?? (await fetchGeojson(layer.id))
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/geo+json',
        })
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
    [queryClient]
  )

  const stackedVisibleLayers = useMemo(() => {
    return layerOrder
      .map(id => layersById.get(id))
      .filter((layer): layer is Layer => Boolean(layer))
      .filter(layer => visibleLayers.has(layer.id) && layerData[layer.id])
  }, [layerOrder, layersById, visibleLayers, layerData])

  const comparePair = useMemo(() => {
    if (stackedVisibleLayers.length !== 2) return null
    const [leftLayer, rightLayer] = stackedVisibleLayers
    if (!layerData[leftLayer.id] || !layerData[rightLayer.id]) return null
    return { leftLayer, rightLayer }
  }, [stackedVisibleLayers, layerData])

  const canCompare = Boolean(comparePair)

  useEffect(() => {
    if (compareMode) compareWasActiveRef.current = true
  }, [compareMode])

  useEffect(() => {
    if (comparePair) {
      if (wantCompareRef.current && !compareMode) {
        setCompareMode(true)
      }
      return
    }
    if (compareWasActiveRef.current) {
      setCompareMode(false)
      wantCompareRef.current = false
    }
  }, [compareMode, comparePair])

  const enterCompareMode = useCallback(() => {
    if (!comparePair) return
    const camera = mapRef.current?.getCamera()
    if (camera) setMapCamera(camera)
    setPopup(null)
    wantCompareRef.current = true
    setCompareMode(true)
  }, [comparePair])

  const exitCompareMode = useCallback((camera: MapCamera | undefined) => {
    if (camera) setMapCamera(camera)
    wantCompareRef.current = false
    setCompareMode(false)
  }, [])

  const getMap = useCallback(() => {
    if (compareMode) return compareRef.current?.getMap()
    return mapRef.current?.getMap()
  }, [compareMode])

  const exportPng = useCallback(() => {
    const map = getMap()
    if (!map) {
      toast.error('O mapa ainda não carregou')
      return
    }
    try {
      const dataUrl = map.getCanvas().toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${geojsonFilename(savedMapQuery.data?.title ?? 'geoportal-preventorio').replace(/\.geojson$/, '')}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('Não foi possível exportar a imagem')
    }
  }, [getMap, savedMapQuery.data?.title])

  const saveMapHref = savedMapNewPath({
    layerIds: layerOrder.filter(id => visibleLayers.has(id)),
    opacities: layerOpacity,
    basemapId,
    camera: mapRef.current?.getCamera() ?? mapCamera ?? undefined,
  })

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
        const feature = features[0]
        const layerId = feature.layer.id.replace(/-outline$/, '')
        setPopup({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          layerId,
          properties: (feature.properties ?? {}) as Record<string, unknown>,
        })
      } else {
        setPopup(null)
      }
    },
    [interactiveLayerIds]
  )

  const popupLayer = popup ? layersById.get(popup.layerId) : undefined

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
              sliderPct={compareSlider}
              onSliderChange={setCompareSlider}
              onMoveEnd={() => setShareRevision(value => value + 1)}
            />
          ) : (
            <BaseMap
              key={basemapId}
              ref={mapRef}
              mapStyle={getBasemapStyle(basemapId)}
              camera={mapCamera}
              onClick={handleMapClick}
              onMoveEnd={() => setShareRevision(value => value + 1)}
              interactiveLayerIds={interactiveLayerIds}
              showControls={false}
            >
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

              {popup && popupLayer && (
                <Popup
                  longitude={popup.lng}
                  latitude={popup.lat}
                  onClose={() => setPopup(null)}
                  closeOnClick={false}
                  maxWidth="320px"
                >
                  <FeaturePopup
                    layer={popupLayer}
                    properties={popup.properties}
                  />
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
          onReorderLayers={reorderLayers}
          onOpacityChange={setLayerOpacityValue}
          hiddenClasses={hiddenClasses}
          onToggleClass={toggleClass}
          factLayerId={factLayerId}
          onFactLayerIdChange={setFactLayerId}
        />

        <GeoportalToolbar
          getMap={getMap}
          fullscreenTargetRef={rootRef}
          hidden={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          canCompare={canCompare}
          compareMode={compareMode}
          onEnterCompare={enterCompareMode}
          onExitCompare={() => exitCompareMode(compareRef.current?.getCamera())}
          onExportPng={exportPng}
          onPrepareShare={flushShareUrl}
          saveMapHref={saveMapHref}
        />
      </div>
    </TooltipProvider>
  )
}

function defaultOpacity(style: LayerStyle) {
  return style.fillOpacity ?? style.strokeOpacity ?? style.circleOpacity ?? 1
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
      if (!hasClassify(layer.style)) continue
      const hidden = new Set<number>()
      layer.style.classify.classes.forEach((cls, i) => {
        if (cls.visible === false) hidden.add(i)
      })
      if (hidden.size > 0) init[layer.id] = hidden
    }
  }
  return init
}
