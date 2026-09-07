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

export function invalidateLayers(
  queryClient: QueryClient,
  layerId?: string
) {
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

export function invalidateMaps(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.maps.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.geoportal.all }),
  ])
}
