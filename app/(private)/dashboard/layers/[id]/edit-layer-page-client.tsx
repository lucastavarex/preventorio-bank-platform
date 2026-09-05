'use client'

import {
  DashboardFormSkeleton,
  DashboardQueryError,
} from '@/components/dashboard/query-state'
import { LayerForm } from '@/components/forms/layer-form'
import { useGroups } from '@/hooks/use-groups'
import { useLayer } from '@/hooks/use-layers'
import { getGeojsonStorageBaseUrl } from '@/lib/storage'

export function EditLayerPageClient({ id }: { id: string }) {
  const layerQuery = useLayer(id)
  const groupsQuery = useGroups()

  if (layerQuery.isPending || groupsQuery.isPending) {
    return <DashboardFormSkeleton />
  }

  if (layerQuery.isError || groupsQuery.isError) {
    return (
      <DashboardQueryError
        message={
          layerQuery.error?.message ??
          groupsQuery.error?.message ??
          'Erro ao carregar o layer.'
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Editar layer</h1>
        <p className="text-muted-foreground text-sm">{layerQuery.data.title}</p>
      </div>
      <LayerForm
        groups={groupsQuery.data}
        defaultValues={layerQuery.data}
        storageBaseUrl={getGeojsonStorageBaseUrl()}
      />
    </div>
  )
}
