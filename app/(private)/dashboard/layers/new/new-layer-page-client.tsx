'use client'

import {
  DashboardFormSkeleton,
  DashboardQueryError,
} from '@/components/dashboard/query-state'
import { LayerForm } from '@/components/forms/layer-form'
import { useGroups } from '@/hooks/use-groups'

export function NewLayerPageClient() {
  const groupsQuery = useGroups()

  if (groupsQuery.isPending) {
    return <DashboardFormSkeleton />
  }

  if (groupsQuery.isError) {
    return (
      <DashboardQueryError
        message={groupsQuery.error.message || 'Erro ao carregar grupos.'}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Novo layer</h1>
        <p className="text-muted-foreground text-sm">
          Faça upload de um GeoJSON e configure o layer.
        </p>
      </div>
      <LayerForm groups={groupsQuery.data} geojsonRequired />
    </div>
  )
}
