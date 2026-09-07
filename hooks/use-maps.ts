'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createMap,
  deleteMap,
  getMap,
  getMapForViewer,
  getMaps,
  updateMap,
} from '@/lib/actions/maps'
import { isNextRedirect, withRedirectInvalidation } from '@/lib/next-redirect'
import { invalidateMaps } from '@/lib/query/invalidate'
import { queryKeys } from '@/lib/query/keys'

export function useMaps() {
  return useQuery({
    queryKey: queryKeys.maps.list(),
    queryFn: getMaps,
  })
}

export function useMap(id: string) {
  return useQuery({
    queryKey: queryKeys.maps.detail(id),
    queryFn: () => getMap(id),
    enabled: Boolean(id),
  })
}

export function useMapForViewer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.maps.viewer(id ?? ''),
    queryFn: () => getMapForViewer(id!),
    enabled: Boolean(id),
  })
}

export function useCreateMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      withRedirectInvalidation(
        () => createMap(formData),
        () => invalidateMaps(queryClient)
      ),
  })
}

export function useUpdateMap(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      withRedirectInvalidation(
        () => updateMap(id, formData),
        () => invalidateMaps(queryClient)
      ),
  })
}

export function useDeleteMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteMap(id),
    onSuccess: () => invalidateMaps(queryClient),
    onError: error => {
      if (isNextRedirect(error)) return
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o mapa.'
      )
    },
  })
}
