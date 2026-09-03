import { GeoportalClient } from '@/components/geoportal/geoportal-client'
import { getGroupsWithLayers } from '@/lib/actions/layers'
import { getGeojsonStorageBaseUrl } from '@/lib/storage'

export default async function GeoportalPage() {
  const groupsWithLayers = await getGroupsWithLayers()

  return (
    <GeoportalClient
      groupsWithLayers={groupsWithLayers}
      storageBaseUrl={getGeojsonStorageBaseUrl()}
    />
  )
}
