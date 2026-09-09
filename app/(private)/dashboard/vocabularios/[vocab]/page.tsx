import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/roles.server'
import { isVocabularyKind } from '@/lib/vocabularies'
import { VocabularyPageClient } from './vocabulary-page-client'

export default async function VocabularyPage({
  params,
}: {
  params: Promise<{ vocab: string }>
}) {
  await requireAdmin()
  const { vocab } = await params

  if (!isVocabularyKind(vocab)) notFound()

  return <VocabularyPageClient kind={vocab} />
}
