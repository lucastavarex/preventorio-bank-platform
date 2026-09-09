'use server'

import { revalidatePath } from 'next/cache'
import { provenanceSlugsFor } from '@/lib/provenance'
import { requireAdmin } from '@/lib/roles.server'
import { createServiceClient } from '@/lib/supabase/server'
import type {
  ProvenanceTermInsert,
  ProvenanceTermUpdate,
} from '@/lib/supabase/types'
import {
  getVocabulary,
  type ProvenanceTermWithUsage,
  type ProvenanceVocabularies,
  slugify,
  VOCABULARY_KINDS,
  type VocabularyKind,
} from '@/lib/vocabularies'

const UNIQUE_VIOLATION = '23505'

function revalidateVocabularyPages() {
  revalidatePath('/dashboard/vocabularios', 'layout')
  revalidatePath('/dashboard/layers', 'layout')
  revalidatePath('/geoportal')
}

/**
 * Public on purpose: the geoportal fact sheet has to resolve labels for
 * anonymous visitors. Retired terms are included so an old layer still shows a
 * readable label.
 */
export async function getProvenanceVocabularies(): Promise<ProvenanceVocabularies> {
  const supabase = createServiceClient()

  const results = await Promise.all(
    VOCABULARY_KINDS.map(async kind => {
      const { data, error } = await supabase
        .from(getVocabulary(kind).table)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true })

      if (error) throw new Error(error.message)
      return [kind, data ?? []] as const
    })
  )

  return Object.fromEntries(results) as ProvenanceVocabularies
}

/**
 * Usage counts come from a single pass over the layers, which keeps the admin
 * list able to warn before a delete without one query per term.
 */
async function countUsage(kind: VocabularyKind) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('layers')
    .select('id, title, provenance')

  if (error) throw new Error(error.message)

  const usage = new Map<string, string[]>()
  for (const layer of data ?? []) {
    for (const slug of provenanceSlugsFor(layer.provenance, kind)) {
      usage.set(slug, [...(usage.get(slug) ?? []), layer.title])
    }
  }

  return usage
}

export async function getVocabularyTerms(
  kind: VocabularyKind
): Promise<ProvenanceTermWithUsage[]> {
  await requireAdmin()
  const vocabulary = getVocabulary(kind)
  const supabase = createServiceClient()

  const [{ data, error }, usage] = await Promise.all([
    supabase
      .from(vocabulary.table)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true }),
    countUsage(kind),
  ])

  if (error) throw new Error(error.message)

  return (data ?? []).map(term => ({
    ...term,
    usageCount: usage.get(term.slug)?.length ?? 0,
  }))
}

export async function getVocabularyCounts(): Promise<
  Record<VocabularyKind, number>
> {
  await requireAdmin()
  const supabase = createServiceClient()

  const results = await Promise.all(
    VOCABULARY_KINDS.map(async kind => {
      const { count, error } = await supabase
        .from(getVocabulary(kind).table)
        .select('id', { count: 'exact', head: true })

      if (error) throw new Error(error.message)
      return [kind, count ?? 0] as const
    })
  )

  return Object.fromEntries(results) as Record<VocabularyKind, number>
}

function parseTermForm(formData: FormData) {
  const label = ((formData.get('label') as string) ?? '').trim()
  if (label.length === 0) {
    throw new Error('Informe o rótulo do termo.')
  }

  const description = ((formData.get('description') as string) ?? '').trim()
  const sortOrder = Number.parseInt(
    (formData.get('sort_order') as string) ?? '',
    10
  )

  return {
    label,
    description: description.length > 0 ? description : null,
    is_active: formData.get('is_active') !== 'off',
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  }
}

export async function createVocabularyTerm(
  kind: VocabularyKind,
  formData: FormData
) {
  await requireAdmin()
  const vocabulary = getVocabulary(kind)
  const supabase = createServiceClient()

  const fields = parseTermForm(formData)
  const requested = ((formData.get('slug') as string) ?? '').trim()
  const slug = slugify(requested.length > 0 ? requested : fields.label)

  if (slug.length === 0) {
    throw new Error(
      'Não foi possível gerar um identificador a partir do rótulo. Preencha o identificador manualmente.'
    )
  }

  const payload: ProvenanceTermInsert = { ...fields, slug }
  const { error } = await supabase.from(vocabulary.table).insert(payload)

  if (error) {
    throw new Error(
      error.code === UNIQUE_VIOLATION
        ? `Já existe um termo com o identificador "${slug}".`
        : error.message
    )
  }

  revalidateVocabularyPages()
}

/**
 * The slug stays frozen: it is the value already written inside
 * layers.provenance, so renaming it would orphan every layer using the term.
 */
export async function updateVocabularyTerm(
  kind: VocabularyKind,
  id: string,
  formData: FormData
) {
  await requireAdmin()
  const vocabulary = getVocabulary(kind)
  const supabase = createServiceClient()

  const payload: ProvenanceTermUpdate = {
    ...parseTermForm(formData),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from(vocabulary.table)
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidateVocabularyPages()
}

export async function setVocabularyTermActive(
  kind: VocabularyKind,
  id: string,
  isActive: boolean
) {
  await requireAdmin()
  const vocabulary = getVocabulary(kind)
  const supabase = createServiceClient()

  const { error } = await supabase
    .from(vocabulary.table)
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidateVocabularyPages()
}

export async function deleteVocabularyTerm(kind: VocabularyKind, id: string) {
  await requireAdmin()
  const vocabulary = getVocabulary(kind)
  const supabase = createServiceClient()

  const { data: term, error: termError } = await supabase
    .from(vocabulary.table)
    .select('slug, label')
    .eq('id', id)
    .single()

  if (termError) throw new Error(termError.message)

  const usage = await countUsage(kind)
  const titles = usage.get(term.slug) ?? []

  if (titles.length > 0) {
    const sample = titles.slice(0, 3).join(', ')
    const rest = titles.length > 3 ? ` e mais ${titles.length - 3}` : ''
    throw new Error(
      `"${term.label}" está em uso por ${titles.length} camada(s): ${sample}${rest}. Desative o termo em vez de excluir.`
    )
  }

  const { error } = await supabase.from(vocabulary.table).delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidateVocabularyPages()
}
