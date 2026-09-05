import { GroupForm } from '@/components/forms/group-form'
import { createGroup } from '@/lib/actions/groups'
import { requireAdmin } from '@/lib/roles.server'

export default async function NewGroupPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Novo grupo</h1>
        <p className="text-muted-foreground text-sm">
          Crie um grupo para organizar layers relacionados.
        </p>
      </div>
      <GroupForm action={createGroup} />
    </div>
  )
}
