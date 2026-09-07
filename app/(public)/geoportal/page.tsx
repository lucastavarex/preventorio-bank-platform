import { GeoportalClient } from '@/components/geoportal/geoportal-client'

export default async function GeoportalPage({
  searchParams,
}: {
  searchParams: Promise<{ layer?: string }>
}) {
  const { layer } = await searchParams
  const initialLayerId = layer && layer.length > 0 ? layer : undefined

  return <GeoportalClient initialLayerId={initialLayerId} />
}
