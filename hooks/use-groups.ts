'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createGroup,
  deleteGroup,
  getGroup,
  getGroups,
  updateGroup,
} from '@/lib/actions/groups'
import { isNextRedirect, withRedirectInvalidation } from '@/lib/next-redirect'
import { invalidateGroups } from '@/lib/query/invalidate'
import { queryKeys } from '@/lib/query/keys'

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: getGroups,
  })
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => getGroup(id),
    enabled: Boolean(id),
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      withRedirectInvalidation(
        () => createGroup(formData),
        () => invalidateGroups(queryClient)
      ),
  })
}

export function useUpdateGroup(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      withRedirectInvalidation(
        () => updateGroup(id, formData),
        () => invalidateGroups(queryClient)
      ),
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => invalidateGroups(queryClient),
    onError: error => {
      if (isNextRedirect(error)) return
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o grupo.'
      )
    },
  })
}
