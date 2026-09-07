'use client'

import { useQuery } from '@tanstack/react-query'
import { getLayerGeojsonAccess } from '@/lib/actions/geojson'
import { parseFeatureCollection } from '@/lib/geojson'
import { queryKeys } from '@/lib/query/keys'

export async function fetchGeojson(
  layerId: string
): Promise<GeoJSON.FeatureCollection> {
  const { url } = await getLayerGeojsonAccess(layerId)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return parseFeatureCollection(await response.text())
}

export function useGeojson(layerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.geojson.byLayer(layerId ?? ''),
    queryFn: () => fetchGeojson(layerId!),
    enabled: Boolean(layerId),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
