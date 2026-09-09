import { requireAdmin } from '@/lib/roles.server'
import { VocabulariesPageClient } from './vocabularies-page-client'

export default async function VocabulariesPage() {
  await requireAdmin()

  return <VocabulariesPageClient />
}
