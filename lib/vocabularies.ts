import type { LayerProvenance, ProvenanceTerm } from '@/lib/supabase/types'

export type VocabularyKind =
  | 'fontes'
  | 'temas'
  | 'perigos'
  | 'participacao'
  | 'licencas'
  | 'responsaveis'

export type VocabularyTable =
  | 'provenance_sources'
  | 'provenance_themes'
  | 'provenance_hazards'
  | 'participation_levels'
  | 'provenance_licenses'
  | 'provenance_producers'

type VocabularyConfig = {
  table: VocabularyTable
  /** Key inside layers.provenance fed by this vocabulary. */
  field: keyof LayerProvenance
  title: string
  singular: string
  description: string
  /** The layer keeps a list of slugs instead of a single one. */
  multi?: boolean
}

export const VOCABULARIES: Record<VocabularyKind, VocabularyConfig> = {
  fontes: {
    table: 'provenance_sources',
    field: 'source',
    title: 'Fontes / métodos',
    singular: 'fonte / método',
    description: 'De onde a camada veio: OpenStreetMap, Kobo, oficina, QGIS.',
  },
  temas: {
    table: 'provenance_themes',
    field: 'theme',
    title: 'Temas',
    singular: 'tema',
    description:
      'Eixo temático da camada: vulnerabilidade física, percepção de risco, infraestrutura.',
  },
  perigos: {
    table: 'provenance_hazards',
    field: 'hazard',
    title: 'Perigos associados',
    singular: 'perigo',
    description: 'Ameaça que a camada trata: deslizamento, evento hídrico.',
  },
  participacao: {
    table: 'participation_levels',
    field: 'participationLevel',
    title: 'Graus de participação',
    singular: 'grau de participação',
    description:
      'Quanto a comunidade participou da produção da camada: baixo, médio, alto.',
  },
  licencas: {
    table: 'provenance_licenses',
    field: 'license',
    title: 'Licenças',
    singular: 'licença',
    description: 'Termos de uso do dado, como CC BY 4.0.',
  },
  responsaveis: {
    table: 'provenance_producers',
    field: 'producers',
    title: 'Responsáveis',
    singular: 'responsável',
    description:
      'Instituições e coletivos que produziram a camada. Uma camada pode ter vários.',
    multi: true,
  },
}

export const VOCABULARY_KINDS = Object.keys(VOCABULARIES) as VocabularyKind[]

/** Every vocabulary loaded at once, the shape the layer form and the public
 * fact sheet consume. Includes retired terms so old layers keep their label. */
export type ProvenanceVocabularies = Record<VocabularyKind, ProvenanceTerm[]>

export type ProvenanceTermWithUsage = ProvenanceTerm & {
  /** How many layers currently reference this term. */
  usageCount: number
}

export function isVocabularyKind(value: unknown): value is VocabularyKind {
  return typeof value === 'string' && value in VOCABULARIES
}

/**
 * Guards every path that turns a client-supplied kind into a table name.
 */
export function getVocabulary(kind: unknown): VocabularyConfig {
  if (!isVocabularyKind(kind)) {
    throw new Error('Vocabulário desconhecido.')
  }
  return VOCABULARIES[kind]
}

/** Mirrors public.provenance_slugify in the database. */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
