import {
  type BasemapId,
  DEFAULT_BASEMAP_ID,
  parseBasemapId,
} from '@/components/map/basemap-styles'
import { ROUTES } from '@/lib/site'
import type { SavedMap, SavedMapCamera } from '@/lib/supabase/types'

export type GeoportalSearchInput = {
  map?: string
  layer?: string
  layers?: string
  o?: string
  b?: string
  lng?: string
  lat?: string
  z?: string
}

export type GeoportalShareState = {
  mapId?: string
  layerIds: string[]
  opacities: Record<string, number>
  basemapId: BasemapId
  camera?: Pick<SavedMapCamera, 'longitude' | 'latitude' | 'zoom'> & {
    longitude: number
    latitude: number
    zoom: number
  }
}

export function parseGeoportalSearch(params: GeoportalSearchInput) {
  const layerIds = (params.layers ?? '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
  const opacities = (params.o ?? '')
    .split(',')
    .map(value => Number.parseInt(value, 10))
    .filter(value => Number.isFinite(value))
  const longitude = Number.parseFloat(params.lng ?? '')
  const latitude = Number.parseFloat(params.lat ?? '')
  const zoom = Number.parseFloat(params.z ?? '')

  return {
    mapId: params.map || undefined,
    layerId: params.layer || undefined,
    layerIds: layerIds.length > 0 ? layerIds : undefined,
    opacities: opacities.length > 0 ? opacities : undefined,
    basemapId: params.b ? parseBasemapId(params.b) : undefined,
    camera:
      Number.isFinite(longitude) &&
      Number.isFinite(latitude) &&
      Number.isFinite(zoom)
        ? { longitude, latitude, zoom, bearing: 0, pitch: 0 }
        : undefined,
  }
}

export function buildGeoportalSearch(state: GeoportalShareState) {
  const params = new URLSearchParams()

  if (state.mapId) {
    params.set('map', state.mapId)
    const query = params.toString()
    return query ? `?${query}` : ''
  }

  if (state.layerIds.length > 0) {
    params.set('layers', state.layerIds.join(','))
    const encoded = state.layerIds.map(id =>
      Math.round((state.opacities[id] ?? 1) * 100)
    )
    if (encoded.some(value => value !== 100)) {
      params.set('o', encoded.join(','))
    }
  }

  if (state.basemapId !== DEFAULT_BASEMAP_ID) {
    params.set('b', state.basemapId)
  }

  if (state.camera) {
    params.set('lng', state.camera.longitude.toFixed(5))
    params.set('lat', state.camera.latitude.toFixed(5))
    params.set('z', state.camera.zoom.toFixed(2))
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function replaceGeoportalUrl(state: GeoportalShareState) {
  const next = `${ROUTES.geoportal}${buildGeoportalSearch(state)}`
  window.history.replaceState(window.history.state, '', next)
}

export function geoportalMapPath(mapId: string) {
  return `${ROUTES.geoportal}?map=${encodeURIComponent(mapId)}`
}

export function savedMapNewPath(state: GeoportalShareState) {
  const params = new URLSearchParams()
  if (state.layerIds.length > 0) {
    params.set('layers', state.layerIds.join(','))
    params.set(
      'o',
      state.layerIds
        .map(id => Math.round((state.opacities[id] ?? 1) * 100))
        .join(',')
    )
  }
  params.set('b', state.basemapId)
  if (state.camera) {
    params.set('lng', state.camera.longitude.toFixed(5))
    params.set('lat', state.camera.latitude.toFixed(5))
    params.set('z', state.camera.zoom.toFixed(2))
  }
  const query = params.toString()
  return `/dashboard/maps/new${query ? `?${query}` : ''}`
}

export function cameraFromSaved(camera: SavedMapCamera | undefined) {
  if (
    camera == null ||
    camera.longitude == null ||
    camera.latitude == null ||
    camera.zoom == null
  ) {
    return undefined
  }

  return {
    longitude: camera.longitude,
    latitude: camera.latitude,
    zoom: camera.zoom,
    bearing: camera.bearing ?? 0,
    pitch: camera.pitch ?? 0,
  }
}

export function compositionFromSavedMap(map: SavedMap): GeoportalShareState {
  const opacities: Record<string, number> = {}
  const layerIds = map.layers.map(layer => {
    opacities[layer.id] = layer.opacity ?? 1
    return layer.id
  })

  return {
    mapId: map.id,
    layerIds,
    opacities,
    basemapId: parseBasemapId(map.basemap_id),
    camera: cameraFromSaved(map.camera),
  }
}
