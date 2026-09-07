import { requireAdmin } from '@/lib/roles.server'
import { EditMapPageClient } from './edit-map-page-client'

export default async function EditMapPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  return <EditMapPageClient id={id} />
}
