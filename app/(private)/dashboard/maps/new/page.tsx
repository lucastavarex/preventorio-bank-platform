import {
  type GeoportalSearchInput,
  parseGeoportalSearch,
} from '@/lib/geoportal-url'
import { requireAdmin } from '@/lib/roles.server'
import { NewMapPageClient } from './new-map-page-client'

export default async function NewMapPage({
  searchParams,
}: {
  searchParams: Promise<GeoportalSearchInput>
}) {
  await requireAdmin()
  const params = await searchParams
  const parsed = parseGeoportalSearch(params)

  return (
    <NewMapPageClient
      draft={{
        layerIds: parsed.layerIds,
        opacities: parsed.opacities,
        basemapId: parsed.basemapId,
        camera: parsed.camera,
      }}
    />
  )
}
