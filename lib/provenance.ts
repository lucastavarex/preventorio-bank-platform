import type {
  LayerProvenance,
  ParticipationLevel,
  ProvenanceHazard,
  ProvenanceSource,
  ProvenanceTheme,
} from '@/lib/supabase/types'

export const PROVENANCE_SOURCES: { id: ProvenanceSource; label: string }[] = [
  { id: 'osm', label: 'OpenStreetMap' },
  { id: 'kobo', label: 'KoboToolbox' },
  { id: 'workshop', label: 'Oficina comunitária' },
  { id: 'qgis', label: 'QGIS' },
  { id: 'other', label: 'Outro' },
]

export const PROVENANCE_THEMES: { id: ProvenanceTheme; label: string }[] = [
  { id: 'physical_vulnerability', label: 'Vulnerabilidade física' },
  { id: 'risk_perception', label: 'Percepção de risco' },
  { id: 'infrastructure', label: 'Infraestrutura' },
  { id: 'overlay', label: 'Cruzamento / sobreposição' },
  { id: 'other', label: 'Outro' },
]

export const PROVENANCE_HAZARDS: { id: ProvenanceHazard; label: string }[] = [
  { id: 'landslide', label: 'Deslizamento de terra' },
  { id: 'rockfall', label: 'Deslizamento de rocha' },
  { id: 'hydrological', label: 'Eventos hídricos' },
  { id: 'none', label: 'Não se aplica' },
]

export const PARTICIPATION_LEVELS: {
  id: ParticipationLevel
  label: string
}[] = [
  { id: 'low', label: 'Baixo' },
  { id: 'medium', label: 'Médio' },
  { id: 'high', label: 'Alto' },
]

export function provenanceLabel(
  options: { id: string; label: string }[],
  id: string | undefined
) {
  return options.find(option => option.id === id)?.label
}

export function hasPublicProvenance(provenance: LayerProvenance | undefined) {
  if (!provenance) return false
  return Boolean(
    provenance.source ||
      provenance.sourceDetail ||
      provenance.period ||
      provenance.producers ||
      provenance.theme ||
      provenance.hazard ||
      provenance.participationLevel ||
      provenance.license ||
      provenance.usageRestriction
  )
}
