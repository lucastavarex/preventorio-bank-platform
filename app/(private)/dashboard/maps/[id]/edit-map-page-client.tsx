'use client'

import {
  DashboardFormSkeleton,
  DashboardQueryError,
} from '@/components/dashboard/query-state'
import { MapForm } from '@/components/forms/map-form'
import { useLayers } from '@/hooks/use-layers'
import { useMap } from '@/hooks/use-maps'

export function EditMapPageClient({ id }: { id: string }) {
  const mapQuery = useMap(id)
  const layersQuery = useLayers()

  if (mapQuery.isPending || layersQuery.isPending) {
    return <DashboardFormSkeleton />
  }

  if (mapQuery.isError || layersQuery.isError) {
    return (
      <DashboardQueryError
        message={
          mapQuery.error?.message ??
          layersQuery.error?.message ??
          'Erro ao carregar o mapa.'
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Editar mapa</h1>
        <p className="text-muted-foreground text-sm">{mapQuery.data.title}</p>
      </div>
      <MapForm layers={layersQuery.data} defaultValues={mapQuery.data} />
    </div>
  )
}
