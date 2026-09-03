import { getGroup, updateGroup } from '@/lib/actions/groups'
import { requireAdmin } from '@/lib/roles.server'
import { GroupForm } from '@/components/forms/group-form'

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const group = await getGroup(id)

  const updateWithId = updateGroup.bind(null, id)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Editar grupo</h1>
        <p className="text-muted-foreground text-sm">{group.title}</p>
      </div>
      <GroupForm action={updateWithId} defaultValues={group} />
    </div>
  )
}
