import { GeoportalClient } from '@/components/geoportal/geoportal-client'
import { parseGeoportalSearch } from '@/lib/geoportal-url'

export default async function GeoportalPage({
  searchParams,
}: {
  searchParams: Promise<{
    map?: string
    layer?: string
    layers?: string
    o?: string
    b?: string
    lng?: string
    lat?: string
    z?: string
  }>
}) {
  const parsed = parseGeoportalSearch(await searchParams)

  return (
    <GeoportalClient
      initialMapId={parsed.mapId}
      initialLayerId={parsed.layerId}
      initialLayerIds={parsed.layerIds}
      initialOpacities={parsed.opacities}
      initialBasemapId={parsed.basemapId}
      initialCamera={parsed.camera}
    />
  )
}
