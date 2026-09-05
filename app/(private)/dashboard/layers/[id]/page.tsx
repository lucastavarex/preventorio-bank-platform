import { requireAdmin } from '@/lib/roles.server'
import { EditLayerPageClient } from './edit-layer-page-client'

export default async function EditLayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  return <EditLayerPageClient id={id} />
}
