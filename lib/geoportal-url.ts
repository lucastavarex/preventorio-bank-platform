import {
  type BasemapId,
  DEFAULT_BASEMAP_ID,
  parseBasemapId,
} from '@/components/map/basemap-styles'
import { ROUTES } from '@/lib/site'
import type { SavedMap, SavedMapCamera } from '@/lib/supabase/types'

export const COMPARE_SLIDER_MIN = 10
export const COMPARE_SLIDER_MAX = 90
export const COMPARE_SLIDER_DEFAULT = 50

export type GeoportalSearchInput = {
  map?: string
  layer?: string
  layers?: string
  o?: string
  b?: string
  lng?: string
  lat?: string
  z?: string
  p?: string
  r?: string
  c?: string
  cs?: string
}

export type GeoportalShareCamera = {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
}

export type GeoportalShareState = {
  mapId?: string
  layerIds: string[]
  opacities: Record<string, number>
  basemapId: BasemapId
  camera?: GeoportalShareCamera
  compare?: boolean
  compareSlider?: number
}

export type ParsedGeoportalSearch = {
  mapId?: string
  layerId?: string
  layerIds?: string[]
  opacities?: number[]
  basemapId?: BasemapId
  camera?: GeoportalShareCamera
  compare?: boolean
  compareSlider?: number
}

function parseOptionalNumber(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : undefined
}

export function clampCompareSlider(value: number) {
  return Math.min(
    COMPARE_SLIDER_MAX,
    Math.max(COMPARE_SLIDER_MIN, Math.round(value))
  )
}

function hasShareableView(state: GeoportalShareState) {
  return (
    state.layerIds.length > 0 || Boolean(state.camera) || Boolean(state.compare)
  )
}

export function hasGeoportalShareParams(parsed: ParsedGeoportalSearch) {
  return Boolean(
    parsed.mapId ||
      parsed.layerId ||
      parsed.layerIds?.length ||
      parsed.basemapId ||
      parsed.camera ||
      parsed.compare
  )
}

function writeCamera(
  params: URLSearchParams,
  camera: GeoportalShareCamera | undefined
) {
  if (!camera) return
  params.set('lng', camera.longitude.toFixed(5))
  params.set('lat', camera.latitude.toFixed(5))
  params.set('z', camera.zoom.toFixed(2))
  if (camera.pitch) params.set('p', camera.pitch.toFixed(2))
  if (camera.bearing) params.set('r', camera.bearing.toFixed(2))
}

export function parseGeoportalSearch(
  params: GeoportalSearchInput
): ParsedGeoportalSearch {
  const layerIds = (params.layers ?? '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
  const opacities = (params.o ?? '')
    .split(',')
    .map(value => Number.parseInt(value, 10))
    .filter(value => Number.isFinite(value))
  const longitude = parseOptionalNumber(params.lng)
  const latitude = parseOptionalNumber(params.lat)
  const zoom = parseOptionalNumber(params.z)
  const bearing = parseOptionalNumber(params.r) ?? 0
  const pitch = parseOptionalNumber(params.p) ?? 0
  const compare = params.c === '1'
  const compareSliderRaw = parseOptionalNumber(params.cs)

  return {
    mapId: params.map || undefined,
    layerId: params.layer || undefined,
    layerIds: layerIds.length > 0 ? layerIds : undefined,
    opacities: opacities.length > 0 ? opacities : undefined,
    basemapId: params.b ? parseBasemapId(params.b) : undefined,
    camera:
      longitude != null && latitude != null && zoom != null
        ? { longitude, latitude, zoom, bearing, pitch }
        : undefined,
    compare: compare || undefined,
    compareSlider:
      compare && compareSliderRaw != null
        ? clampCompareSlider(compareSliderRaw)
        : undefined,
  }
}

export function buildGeoportalSearch(state: GeoportalShareState) {
  const params = new URLSearchParams()

  if (state.layerIds.length > 0) {
    params.set('layers', state.layerIds.join(','))
    const encoded = state.layerIds.map(id =>
      Math.round((state.opacities[id] ?? 1) * 100)
    )
    if (encoded.some(value => value !== 100)) {
      params.set('o', encoded.join(','))
    }
  }

  if (hasShareableView(state) || state.basemapId !== DEFAULT_BASEMAP_ID) {
    params.set('b', state.basemapId)
  }

  writeCamera(params, state.camera)

  if (state.compare) {
    params.set('c', '1')
    const slider = clampCompareSlider(
      state.compareSlider ?? COMPARE_SLIDER_DEFAULT
    )
    if (slider !== COMPARE_SLIDER_DEFAULT) {
      params.set('cs', String(slider))
    }
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
  writeCamera(params, state.camera)
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
