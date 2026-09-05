import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { LayerCards } from '@/components/custom/layer-cards'
import { LayerGroupFilter } from '@/components/custom/layer-group-filter'
import { Button } from '@/components/ui/button'
import { getGroups } from '@/lib/actions/groups'
import { getLayers } from '@/lib/actions/layers'
import { requireAdmin } from '@/lib/roles.server'

export default async function LayersPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  await requireAdmin()
  const { group } = await searchParams
  const groupId = group && group.length > 0 ? group : undefined
  const [layers, groups] = await Promise.all([getLayers(groupId), getGroups()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl">Layers</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os layers do geoportal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <LayerGroupFilter groups={groups} selectedGroupId={groupId} />
          )}
          <Button asChild>
            <Link href="/dashboard/layers/new">
              <PlusIcon data-icon="inline-start" />
              Novo layer
            </Link>
          </Button>
        </div>
      </div>

      <LayerCards
        layers={layers}
        emptyTitle={groupId ? 'Nenhum layer neste grupo' : 'Nenhum layer'}
        emptyDescription={
          groupId
            ? 'Este grupo ainda não possui layers.'
            : 'Crie o primeiro layer fazendo upload de um arquivo GeoJSON.'
        }
      />
    </div>
  )
}
