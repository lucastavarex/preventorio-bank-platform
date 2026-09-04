import Link from 'next/link'
import { ConfirmDeleteButton } from '@/components/custom/confirm-delete-button'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { deleteLayer } from '@/lib/actions/layers'
import type { LayerWithGroup } from '@/lib/supabase/types'

type LayerCardsProps = {
  layers: LayerWithGroup[]
  showGroup?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function LayerCards({
  layers,
  showGroup = true,
  emptyTitle = 'Nenhum layer',
  emptyDescription = 'Crie o primeiro layer fazendo upload de um arquivo GeoJSON.',
}: LayerCardsProps) {
  if (layers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{emptyTitle}</CardTitle>
          <CardDescription>{emptyDescription}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {layers.map(layer => (
        <Card key={layer.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <Link href={`/dashboard/layers/${layer.id}`} className="flex-1">
                <CardTitle className="hover:underline">{layer.title}</CardTitle>
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
            {showGroup && (
              <p className="text-muted-foreground text-xs">
                Grupo: {layer.groups?.title ?? '—'}
              </p>
            )}
          </CardHeader>
          <CardFooter className="justify-end gap-2 bg-transparent">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/layers/${layer.id}`}>Editar</Link>
            </Button>
            <ConfirmDeleteButton
              action={deleteLayer.bind(null, layer.id)}
              message={`Excluir o layer "${layer.title}"?`}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
