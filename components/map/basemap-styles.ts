import type { StyleSpecification } from 'maplibre-gl'

export type BasemapId = 'streets' | 'satellite'

export type BasemapOption = {
  id: BasemapId
  label: string
  style: StyleSpecification
}

function rasterStyle(
  id: string,
  tiles: string[],
  attribution: string,
  maxzoom = 19
): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      [id]: {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
        maxzoom,
      },
    },
    layers: [{ id, type: 'raster', source: id }],
  }
}

export const OSM_STYLE = rasterStyle(
  'osm',
  ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  '&copy; OpenStreetMap contributors'
)

export const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'streets',
    label: 'Default (OpenStreetMap)',
    style: OSM_STYLE,
  },
  {
    id: 'satellite',
    label: 'Satellite (Esri)',
    style: rasterStyle(
      'esri-satellite',
      [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      'Tiles &copy; Esri',
      18
    ),
  },
]

export const DEFAULT_BASEMAP_ID: BasemapId = 'streets'

const BASEMAP_BY_ID = Object.fromEntries(
  BASEMAP_OPTIONS.map(option => [option.id, option])
) as Record<BasemapId, BasemapOption>

export function getBasemapStyle(id: BasemapId): StyleSpecification {
  return (BASEMAP_BY_ID[id] ?? BASEMAP_BY_ID[DEFAULT_BASEMAP_ID]).style
}

export function parseBasemapId(value: string | null | undefined): BasemapId {
  if (value === 'streets' || value === 'satellite') {
    return value
  }
  return DEFAULT_BASEMAP_ID
}
