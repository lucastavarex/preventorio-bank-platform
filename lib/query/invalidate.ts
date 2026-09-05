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
  geojsonPath?: string
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.layers.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.geoportal.all }),
    geojsonPath
      ? queryClient.invalidateQueries({
          queryKey: queryKeys.geojson.byPath(geojsonPath),
        })
      : Promise.resolve(),
  ])
}
