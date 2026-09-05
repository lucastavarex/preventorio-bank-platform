import { requireAdmin } from '@/lib/roles.server'
import { GroupsPageClient } from './groups-page-client'

export default async function GroupsPage() {
  await requireAdmin()

  return <GroupsPageClient />
}
