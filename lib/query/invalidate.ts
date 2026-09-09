import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'

export function invalidateGroups(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.layers.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.geoportal.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.geojson.all }),
  ])
}

export function invalidateLayers(queryClient: QueryClient, layerId?: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.layers.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.geoportal.all }),
    layerId
      ? queryClient.invalidateQueries({
          queryKey: queryKeys.geojson.byLayer(layerId),
        })
      : Promise.resolve(),
  ])
}

export function invalidateVocabularies(queryClient: QueryClient) {
  // Layer lists and the geoportal render provenance labels, so they go stale
  // whenever a term changes.
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.vocabularies.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.layers.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.geoportal.all }),
  ])
}

export function invalidateMaps(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.maps.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.geoportal.all }),
  ])
}
