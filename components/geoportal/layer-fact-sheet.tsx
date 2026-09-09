'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useProvenanceVocabularies } from '@/hooks/use-vocabularies'
import {
  hasPublicProvenance,
  provenanceLabel,
  provenanceLabels,
} from '@/lib/provenance'
import type { Layer } from '@/lib/supabase/types'

export function LayerFactSheet({ layer }: { layer: Layer }) {
  const vocabulariesQuery = useProvenanceVocabularies()

  if (vocabulariesQuery.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const vocabularies = vocabulariesQuery.data
  const provenance = layer.provenance
  const sourceLabel = provenanceLabel(vocabularies?.fontes, provenance?.source)
  const producers = provenanceLabels(
    vocabularies?.responsaveis,
    provenance?.producers
  )

  const rows = [
    layer.description ? { label: 'Descrição', value: layer.description } : null,
    sourceLabel
      ? {
          label: 'Fonte',
          value: [sourceLabel, provenance.sourceDetail]
            .filter(Boolean)
            .join(' — '),
        }
      : provenance?.sourceDetail
        ? { label: 'Fonte', value: provenance.sourceDetail }
        : null,
    provenance?.period ? { label: 'Período', value: provenance.period } : null,
    producers.length > 0
      ? { label: 'Responsáveis', value: producers.join(', ') }
      : null,
    {
      label: 'Tema',
      value: provenanceLabel(vocabularies?.temas, provenance?.theme),
    },
    {
      label: 'Perigo',
      value: provenanceLabel(vocabularies?.perigos, provenance?.hazard),
    },
    {
      label: 'Participação',
      value: provenanceLabel(
        vocabularies?.participacao,
        provenance?.participationLevel
      ),
    },
    {
      label: 'Licença',
      value: provenanceLabel(vocabularies?.licencas, provenance?.license),
    },
    provenance?.usageRestriction
      ? { label: 'Restrição de uso', value: provenance.usageRestriction }
      : null,
  ].filter((row): row is { label: string; value: string } =>
    Boolean(row?.value)
  )

  if (rows.length === 0 && !hasPublicProvenance(provenance)) {
    return (
      <p className="text-muted-foreground text-sm">
        Esta camada ainda não tem ficha de proveniência.
      </p>
    )
  }

  return (
    <dl className="flex flex-col gap-3">
      {rows.map(row => (
        <div key={row.label} className="flex flex-col gap-1">
          <dt className="text-muted-foreground text-xs">{row.label}</dt>
          <dd className="text-sm">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
