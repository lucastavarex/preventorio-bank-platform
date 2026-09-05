'use client'

import { useQuery } from '@tanstack/react-query'
import { parseFeatureCollection } from '@/lib/geojson'
import { queryKeys } from '@/lib/query/keys'

export async function fetchGeojson(
  storageBaseUrl: string,
  path: string
): Promise<GeoJSON.FeatureCollection> {
  const response = await fetch(`${storageBaseUrl}/${path}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return parseFeatureCollection(await response.text())
}

export function useGeojson(
  path: string | undefined,
  storageBaseUrl: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.geojson.byPath(path ?? ''),
    queryFn: () => fetchGeojson(storageBaseUrl!, path!),
    enabled: Boolean(path && storageBaseUrl),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
