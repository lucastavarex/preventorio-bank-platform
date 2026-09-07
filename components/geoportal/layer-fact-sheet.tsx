'use client'

import {
  hasPublicProvenance,
  PARTICIPATION_LEVELS,
  PROVENANCE_HAZARDS,
  PROVENANCE_SOURCES,
  PROVENANCE_THEMES,
  provenanceLabel,
} from '@/lib/provenance'
import type { Layer } from '@/lib/supabase/types'

export function LayerFactSheet({ layer }: { layer: Layer }) {
  const rows = [
    layer.description ? { label: 'Descrição', value: layer.description } : null,
    provenanceLabel(PROVENANCE_SOURCES, layer.provenance?.source)
      ? {
          label: 'Fonte',
          value: [
            provenanceLabel(PROVENANCE_SOURCES, layer.provenance.source),
            layer.provenance.sourceDetail,
          ]
            .filter(Boolean)
            .join(' — '),
        }
      : layer.provenance?.sourceDetail
        ? { label: 'Fonte', value: layer.provenance.sourceDetail }
        : null,
    layer.provenance?.period
      ? { label: 'Período', value: layer.provenance.period }
      : null,
    layer.provenance?.producers
      ? { label: 'Responsáveis', value: layer.provenance.producers }
      : null,
    provenanceLabel(PROVENANCE_THEMES, layer.provenance?.theme)
      ? {
          label: 'Tema',
          value: provenanceLabel(PROVENANCE_THEMES, layer.provenance.theme),
        }
      : null,
    provenanceLabel(PROVENANCE_HAZARDS, layer.provenance?.hazard)
      ? {
          label: 'Perigo',
          value: provenanceLabel(PROVENANCE_HAZARDS, layer.provenance.hazard),
        }
      : null,
    provenanceLabel(PARTICIPATION_LEVELS, layer.provenance?.participationLevel)
      ? {
          label: 'Participação',
          value: provenanceLabel(
            PARTICIPATION_LEVELS,
            layer.provenance.participationLevel
          ),
        }
      : null,
    layer.provenance?.license
      ? { label: 'Licença', value: layer.provenance.license }
      : null,
    layer.provenance?.usageRestriction
      ? { label: 'Restrição de uso', value: layer.provenance.usageRestriction }
      : null,
  ].filter((row): row is { label: string; value: string } =>
    Boolean(row?.value)
  )

  if (rows.length === 0 && !hasPublicProvenance(layer.provenance)) {
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
