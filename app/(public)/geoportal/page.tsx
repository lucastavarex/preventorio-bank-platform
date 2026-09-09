import { GeoportalClient } from '@/components/geoportal/geoportal-client'
import {
  type GeoportalSearchInput,
  hasGeoportalShareParams,
  parseGeoportalSearch,
} from '@/lib/geoportal-url'

export default async function GeoportalPage({
  searchParams,
}: {
  searchParams: Promise<GeoportalSearchInput>
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
      initialCompare={parsed.compare}
      initialCompareSlider={parsed.compareSlider}
      hasShareParams={hasGeoportalShareParams(parsed)}
    />
  )
}
