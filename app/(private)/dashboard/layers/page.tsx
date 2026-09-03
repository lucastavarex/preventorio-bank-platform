import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { ConfirmDeleteButton } from '@/components/confirm-delete-button'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { deleteLayer, getLayers } from '@/lib/actions/layers'
import { requireAdmin } from '@/lib/roles.server'

export default async function LayersPage() {
  await requireAdmin()
  const layers = await getLayers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Layers</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os layers do geoportal.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/layers/new">
            <PlusIcon data-icon="inline-start" />
            Novo layer
          </Link>
        </Button>
      </div>

      {layers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum layer</CardTitle>
            <CardDescription>
              Crie o primeiro layer fazendo upload de um arquivo GeoJSON.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {layers.map(layer => (
            <Card key={layer.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/layers/${layer.id}`}
                    className="flex-1"
                  >
                    <CardTitle className="hover:underline">
                      {layer.title}
                    </CardTitle>
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    {layer.is_private && (
                      <span className="rounded bg-orange-100 px-2 py-0.5 font-medium text-orange-700 text-xs">
                        Privado
                      </span>
                    )}
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {layer.description || 'Sem descrição'}
                </CardDescription>
                <p className="text-muted-foreground text-xs">
                  Grupo: {layer.groups?.title ?? '—'}
                </p>
              </CardHeader>
              <div className="flex items-center justify-end gap-2 border-t px-6 py-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/layers/${layer.id}`}>Editar</Link>
                </Button>
                <ConfirmDeleteButton
                  action={deleteLayer.bind(null, layer.id)}
                  message={`Excluir o layer "${layer.title}"?`}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
