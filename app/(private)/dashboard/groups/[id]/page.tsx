import { LayerCards } from '@/components/custom/layer-cards'
import { GroupForm } from '@/components/forms/group-form'
import { getGroup, updateGroup } from '@/lib/actions/groups'
import { getLayers } from '@/lib/actions/layers'
import { requireAdmin } from '@/lib/roles.server'

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [group, layers] = await Promise.all([getGroup(id), getLayers(id)])

  const updateWithId = updateGroup.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Editar grupo</h1>
        <p className="text-muted-foreground text-sm">{group.title}</p>
      </div>
      <GroupForm action={updateWithId} defaultValues={group} />
      <div className="space-y-4">
        <h2 className="font-bold text-xl">Layers</h2>
        <LayerCards
          layers={layers}
          showGroup={false}
          emptyTitle="Nenhum layer neste grupo"
          emptyDescription="Este grupo ainda não possui layers."
        />
      </div>
    </div>
  )
}
