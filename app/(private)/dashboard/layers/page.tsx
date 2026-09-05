import { requireAdmin } from '@/lib/roles.server'
import { LayersPageClient } from './layers-page-client'

export default async function LayersPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  await requireAdmin()
  const { group } = await searchParams
  const groupId = group && group.length > 0 ? group : undefined

  return <LayersPageClient groupId={groupId} />
}
