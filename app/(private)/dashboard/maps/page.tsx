import { requireAdmin } from '@/lib/roles.server'
import { MapsPageClient } from './maps-page-client'

export default async function MapsPage() {
  await requireAdmin()
  return <MapsPageClient />
}
