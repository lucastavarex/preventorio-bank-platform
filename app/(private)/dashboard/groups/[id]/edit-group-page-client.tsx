'use client'

import { LayerCards } from '@/components/custom/layer-cards'
import {
  DashboardFormSkeleton,
  DashboardQueryError,
} from '@/components/dashboard/query-state'
import { GroupForm } from '@/components/forms/group-form'
import { useGroup } from '@/hooks/use-groups'
import { useLayers } from '@/hooks/use-layers'

export function EditGroupPageClient({ id }: { id: string }) {
  const groupQuery = useGroup(id)
  const layersQuery = useLayers(id)

  if (groupQuery.isPending || layersQuery.isPending) {
    return <DashboardFormSkeleton />
  }

  if (groupQuery.isError || layersQuery.isError) {
    return (
      <DashboardQueryError
        message={
          groupQuery.error?.message ??
          layersQuery.error?.message ??
          'Erro ao carregar o grupo.'
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Editar grupo</h1>
        <p className="text-muted-foreground text-sm">{groupQuery.data.title}</p>
      </div>
      <GroupForm defaultValues={groupQuery.data} />
      <div className="space-y-4">
        <h2 className="font-bold text-xl">Layers</h2>
        <LayerCards
          layers={layersQuery.data}
          showGroup={false}
          emptyTitle="Nenhum layer neste grupo"
          emptyDescription="Este grupo ainda não possui layers."
        />
      </div>
    </div>
  )
}
