export const queryKeys = {
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: () => [...queryKeys.groups.lists()] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.groups.details(), id] as const,
  },
  layers: {
    all: ['layers'] as const,
    lists: () => [...queryKeys.layers.all, 'list'] as const,
    list: (groupId?: string) =>
      [...queryKeys.layers.lists(), { groupId: groupId ?? null }] as const,
    details: () => [...queryKeys.layers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.layers.details(), id] as const,
  },
  geoportal: {
    all: ['geoportal'] as const,
    groupsWithLayers: () =>
      [...queryKeys.geoportal.all, 'groups-with-layers'] as const,
  },
  geojson: {
    all: ['geojson'] as const,
    byPath: (path: string) => [...queryKeys.geojson.all, path] as const,
  },
}
