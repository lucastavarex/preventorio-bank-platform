'use client'

import {
  DashboardFormSkeleton,
  DashboardQueryError,
} from '@/components/dashboard/query-state'
import { MapForm } from '@/components/forms/map-form'
import { useLayers } from '@/hooks/use-layers'
import type { SavedMapCamera } from '@/lib/supabase/types'

export function NewMapPageClient({
  draft,
}: {
  draft?: {
    layerIds?: string[]
    opacities?: number[]
    basemapId?: string
    camera?: SavedMapCamera
  }
}) {
  const layersQuery = useLayers()

  if (layersQuery.isPending) {
    return <DashboardFormSkeleton />
  }

  if (layersQuery.isError) {
    return (
      <DashboardQueryError
        message={layersQuery.error.message || 'Erro ao carregar camadas.'}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Novo mapa</h1>
        <p className="text-muted-foreground text-sm">
          Publique uma composição de camadas no geoportal.
        </p>
      </div>
      <MapForm layers={layersQuery.data} draft={draft} />
    </div>
  )
}
