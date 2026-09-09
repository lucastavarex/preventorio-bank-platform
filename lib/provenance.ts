import type { LayerProvenance, ProvenanceTerm } from '@/lib/supabase/types'
import {
  type ProvenanceVocabularies,
  VOCABULARIES,
  type VocabularyKind,
} from '@/lib/vocabularies'

/**
 * Provenance fields store term slugs. `producers` became a list of slugs, but a
 * layer saved before the vocabulary tables may still carry a single string.
 */
export function toTermSlugs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value.filter(
          (item): item is string => typeof item === 'string' && item.length > 0
        )
      ),
    ]
  }
  if (typeof value === 'string' && value.length > 0) {
    return [
      ...new Set(
        value
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0)
      ),
    ]
  }
  return []
}

/** Falls back to the raw slug so a deleted term never renders as blank. */
export function provenanceLabel(
  terms: ProvenanceTerm[] | undefined,
  slug: string | undefined
) {
  if (!slug) return undefined
  return terms?.find(term => term.slug === slug)?.label ?? slug
}

export function provenanceLabels(
  terms: ProvenanceTerm[] | undefined,
  value: unknown
) {
  return toTermSlugs(value)
    .map(slug => provenanceLabel(terms, slug))
    .filter((label): label is string => Boolean(label))
}

/**
 * Drops slugs that no longer exist in the vocabularies and forces `producers`
 * into an array, so a stale form payload cannot write dangling references.
 */
export function normalizeProvenance(
  provenance: LayerProvenance,
  vocabularies: ProvenanceVocabularies
): LayerProvenance {
  const known = (kind: VocabularyKind, slug: string) =>
    vocabularies[kind].some(term => term.slug === slug)

  const single = (kind: VocabularyKind, value: unknown) =>
    typeof value === 'string' && known(kind, value) ? value : undefined

  const text = (value: unknown) =>
    typeof value === 'string' && value.length > 0 ? value : undefined

  const producers = toTermSlugs(provenance.producers).filter(slug =>
    known('responsaveis', slug)
  )

  const normalized: LayerProvenance = {
    source: single('fontes', provenance.source),
    sourceDetail: text(provenance.sourceDetail),
    period: text(provenance.period),
    producers: producers.length > 0 ? producers : undefined,
    theme: single('temas', provenance.theme),
    hazard: single('perigos', provenance.hazard),
    participationLevel: single('participacao', provenance.participationLevel),
    license: single('licencas', provenance.license),
    usageRestriction: text(provenance.usageRestriction),
  }

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined)
  ) as LayerProvenance
}

export function hasPublicProvenance(provenance: LayerProvenance | undefined) {
  if (!provenance) return false
  return Boolean(
    provenance.source ||
      provenance.sourceDetail ||
      provenance.period ||
      toTermSlugs(provenance.producers).length > 0 ||
      provenance.theme ||
      provenance.hazard ||
      provenance.participationLevel ||
      provenance.license ||
      provenance.usageRestriction
  )
}

/** Slugs a layer references for a given vocabulary. */
export function provenanceSlugsFor(
  provenance: LayerProvenance | undefined,
  kind: VocabularyKind
) {
  return toTermSlugs(provenance?.[VOCABULARIES[kind].field])
}
