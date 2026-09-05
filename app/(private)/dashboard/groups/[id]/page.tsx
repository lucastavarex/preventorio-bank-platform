import { requireAdmin } from '@/lib/roles.server'
import { EditGroupPageClient } from './edit-group-page-client'

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  return <EditGroupPageClient id={id} />
}
