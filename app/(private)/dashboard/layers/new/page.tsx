import { LayerForm } from '@/components/forms/layer-form'
import { getGroups } from '@/lib/actions/groups'
import { createLayer } from '@/lib/actions/layers'
import { requireAdmin } from '@/lib/roles.server'

export default async function NewLayerPage() {
  await requireAdmin()
  const groups = await getGroups()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Novo layer</h1>
        <p className="text-muted-foreground text-sm">
          Faça upload de um GeoJSON e configure o layer.
        </p>
      </div>
      <LayerForm action={createLayer} groups={groups} geojsonRequired />
    </div>
  )
}
