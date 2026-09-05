import { requireAdmin } from '@/lib/roles.server'
import { NewLayerPageClient } from './new-layer-page-client'

export default async function NewLayerPage() {
  await requireAdmin()

  return <NewLayerPageClient />
}
