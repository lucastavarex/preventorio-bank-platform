'use client'

import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  LayersIcon,
  LocateIcon,
  XIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type MapLayerMouseEvent, Popup } from 'react-map-gl/maplibre'
import { GeoportalLegend } from '@/components/geoportal/geoportal-legend'
import { BaseMap, type BaseMapHandle } from '@/components/map/base-map'
import { GeoJSONLayer } from '@/components/map/geojson-layer'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { hasGraduatedClassify } from '@/lib/classify'
import type { Group, Layer } from '@/lib/supabase/types'
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

export function GeoportalClient({ groupsWithLayers, storageBaseUrl }: Props) {
  const mapRef = useRef<BaseMapHandle>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groupsWithLayers.map(g => g.id))
  )
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    () => new Set(groupsWithLayers.flatMap(g => g.layers.map(l => l.id)))
  )
  const [layerData, setLayerData] = useState<
    Record<string, GeoJSON.FeatureCollection>
  >({})
  const [layerErrors, setLayerErrors] = useState<Record<string, string>>({})
  const [popup, setPopup] = useState<PopupInfo | null>(null)
  const [hiddenClasses, setHiddenClasses] = useState<
    Record<string, Set<number>>
  >(() => initialHiddenClasses(groupsWithLayers))

  useEffect(() => {
    const allLayers = groupsWithLayers.flatMap(g => g.layers)
    let cancelled = false

    for (const layer of allLayers) {
      if (!layer.geojson_storage_path) continue

      fetch(`${storageBaseUrl}/${layer.geojson_storage_path}`)
        .then(async response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          return response.json() as Promise<GeoJSON.FeatureCollection>
        })
        .then(data => {
          if (cancelled) return
          setLayerData(prev => ({ ...prev, [layer.id]: data }))
          setLayerErrors(prev => {
            if (!(layer.id in prev)) return prev
            const next = { ...prev }
            delete next[layer.id]
            return next
          })
        })
        .catch(() => {
          if (cancelled) return
          setLayerErrors(prev => ({
            ...prev,
            [layer.id]: 'Falha ao carregar GeoJSON',
          }))
        })
    }

    return () => {
      cancelled = true
    }
  }, [groupsWithLayers, storageBaseUrl])

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
      const layer = groupsWithLayers
        .flatMap(g => g.layers)
        .find(l => l.id === layerId)
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
    [groupsWithLayers]
  )

  const toggleLayer = useCallback((id: string) => {
    setVisibleLayers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

  const interactiveLayerIds = useMemo(
    () =>
      groupsWithLayers.flatMap(g =>
        g.layers
          .filter(l => visibleLayers.has(l.id) && layerData[l.id])
          .flatMap(l => [l.id, `${l.id}-outline`])
      ),
    [groupsWithLayers, visibleLayers, layerData]
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

  const activeLayers = groupsWithLayers
    .flatMap(g => g.layers)
    .filter(l => visibleLayers.has(l.id))

  return (
    <div className="relative h-svh w-full">
      <div className="absolute inset-0">
        <BaseMap
          ref={mapRef}
          onClick={handleMapClick}
          interactiveLayerIds={interactiveLayerIds}
        >
          {groupsWithLayers.flatMap(g =>
            g.layers.map(layer => {
              const data = layerData[layer.id]
              if (!data) return null
              return (
                <GeoJSONLayer
                  key={layer.id}
                  id={layer.id}
                  data={data}
                  style={layer.style}
                  visible={visibleLayers.has(layer.id)}
                  hiddenClassIndexes={hiddenClasses[layer.id]}
                />
              )
            })
          )}

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
          'absolute top-16 left-4 z-10 w-72 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm transition-transform',
          !sidebarOpen && '-translate-x-80'
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
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-start px-1 py-1 font-medium"
                >
                  {expandedGroups.has(group.id) ? (
                    <ChevronDownIcon data-icon="inline-start" />
                  ) : (
                    <ChevronRightIcon data-icon="inline-start" />
                  )}
                  <span className="truncate">{group.title}</span>
                  {group.is_private && (
                    <span className="ml-auto rounded bg-orange-100 px-1 py-0.5 text-orange-700 text-[10px]">
                      Privado
                    </span>
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="ml-3 flex flex-col gap-0.5 border-l pl-3">
                {group.layers.map(layer => (
                  <div
                    key={layer.id}
                    className="flex items-center gap-1.5 rounded px-1 py-1 text-sm hover:bg-muted"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => toggleLayer(layer.id)}
                      title={
                        visibleLayers.has(layer.id) ? 'Ocultar' : 'Mostrar'
                      }
                    >
                      {visibleLayers.has(layer.id) ? (
                        <EyeIcon />
                      ) : (
                        <EyeOffIcon />
                      )}
                    </Button>
                    <span className="flex-1 truncate">{layer.title}</span>
                    {layerErrors[layer.id] && (
                      <span
                        className="shrink-0 text-[10px] text-destructive"
                        title={layerErrors[layer.id]}
                      >
                        erro
                      </span>
                    )}
                    {layer.bbox && layer.bbox.length >= 4 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => zoomToLayer(layer)}
                        title="Zoom para o layer"
                      >
                        <LocateIcon />
                      </Button>
                    )}
                  </div>
                ))}
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
