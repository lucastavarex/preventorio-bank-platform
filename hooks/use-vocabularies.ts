'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createVocabularyTerm,
  deleteVocabularyTerm,
  getProvenanceVocabularies,
  getVocabularyCounts,
  getVocabularyTerms,
  setVocabularyTermActive,
  updateVocabularyTerm,
} from '@/lib/actions/vocabularies'
import { invalidateVocabularies } from '@/lib/query/invalidate'
import { queryKeys } from '@/lib/query/keys'
import type { VocabularyKind } from '@/lib/vocabularies'

/** Vocabularies change rarely, so the form and the geoportal share one cache. */
export function useProvenanceVocabularies() {
  return useQuery({
    queryKey: queryKeys.vocabularies.provenance(),
    queryFn: getProvenanceVocabularies,
    staleTime: 5 * 60 * 1000,
  })
}

export function useVocabularyTerms(kind: VocabularyKind) {
  return useQuery({
    queryKey: queryKeys.vocabularies.terms(kind),
    queryFn: () => getVocabularyTerms(kind),
  })
}

export function useVocabularyCounts() {
  return useQuery({
    queryKey: queryKeys.vocabularies.counts(),
    queryFn: getVocabularyCounts,
  })
}

export function useCreateVocabularyTerm(kind: VocabularyKind) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => createVocabularyTerm(kind, formData),
    onSuccess: () => invalidateVocabularies(queryClient),
  })
}

export function useUpdateVocabularyTerm(kind: VocabularyKind) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateVocabularyTerm(kind, id, formData),
    onSuccess: () => invalidateVocabularies(queryClient),
  })
}

export function useSetVocabularyTermActive(kind: VocabularyKind) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setVocabularyTermActive(kind, id, isActive),
    onSuccess: () => invalidateVocabularies(queryClient),
    onError: error =>
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar o termo.'
      ),
  })
}

export function useDeleteVocabularyTerm(kind: VocabularyKind) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteVocabularyTerm(kind, id),
    onSuccess: () => invalidateVocabularies(queryClient),
    onError: error =>
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o termo.'
      ),
  })
}
