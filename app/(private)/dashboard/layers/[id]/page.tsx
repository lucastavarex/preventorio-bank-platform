import { LayerForm } from '@/components/forms/layer-form'
import { getGroups } from '@/lib/actions/groups'
import { getLayer, updateLayer } from '@/lib/actions/layers'
import { requireAdmin } from '@/lib/roles.server'
import { getGeojsonStorageBaseUrl } from '@/lib/storage'

export default async function EditLayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [layer, groups] = await Promise.all([getLayer(id), getGroups()])

  const updateWithId = updateLayer.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Editar layer</h1>
        <p className="text-muted-foreground text-sm">{layer.title}</p>
      </div>
      <LayerForm
        action={updateWithId}
        groups={groups}
        defaultValues={layer}
        storageBaseUrl={getGeojsonStorageBaseUrl()}
      />
    </div>
  )
}
