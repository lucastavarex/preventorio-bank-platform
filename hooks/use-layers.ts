'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createLayer,
  deleteLayer,
  getGroupsWithLayers,
  getLayer,
  getLayers,
  updateLayer,
} from '@/lib/actions/layers'
import { isNextRedirect, withRedirectInvalidation } from '@/lib/next-redirect'
import { invalidateLayers } from '@/lib/query/invalidate'
import { queryKeys } from '@/lib/query/keys'

export function useLayers(groupId?: string) {
  return useQuery({
    queryKey: queryKeys.layers.list(groupId),
    queryFn: () => getLayers(groupId),
  })
}

export function useLayer(id: string) {
  return useQuery({
    queryKey: queryKeys.layers.detail(id),
    queryFn: () => getLayer(id),
    enabled: Boolean(id),
  })
}

export function useGroupsWithLayers() {
  return useQuery({
    queryKey: queryKeys.geoportal.groupsWithLayers(),
    queryFn: getGroupsWithLayers,
  })
}

export function useCreateLayer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      withRedirectInvalidation(
        () => createLayer(formData),
        () => invalidateLayers(queryClient)
      ),
  })
}

export function useUpdateLayer(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      withRedirectInvalidation(
        () => updateLayer(id, formData),
        () => {
          const file = formData.get('geojson')
          const replaced = file instanceof File && file.size > 0
          return invalidateLayers(
            queryClient,
            replaced ? `${id}.geojson` : undefined
          )
        }
      ),
  })
}

export function useDeleteLayer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; geojsonPath?: string | null }) => {
      await deleteLayer(input.id)
    },
    onSuccess: (_data, input) =>
      invalidateLayers(queryClient, input.geojsonPath ?? undefined),
    onError: error => {
      if (isNextRedirect(error)) return
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o layer.'
      )
    },
  })
}
