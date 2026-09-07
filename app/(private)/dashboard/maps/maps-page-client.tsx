'use client'

import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { ConfirmDeleteButton } from '@/components/custom/confirm-delete-button'
import {
  DashboardListSkeleton,
  DashboardQueryError,
} from '@/components/dashboard/query-state'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useDeleteMap, useMaps } from '@/hooks/use-maps'
import { geoportalMapPath } from '@/lib/geoportal-url'

export function MapsPageClient() {
  const mapsQuery = useMaps()
  const deleteMap = useDeleteMap()

  if (mapsQuery.isPending) {
    return <DashboardListSkeleton />
  }

  if (mapsQuery.isError) {
    return (
      <DashboardQueryError
        message={mapsQuery.error.message || 'Erro ao carregar mapas.'}
      />
    )
  }

  const maps = mapsQuery.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Mapas</h1>
          <p className="text-muted-foreground text-sm">
            Composições de camadas publicadas no geoportal.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/maps/new">
            <PlusIcon data-icon="inline-start" />
            Novo mapa
          </Link>
        </Button>
      </div>

      {maps.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum mapa</CardTitle>
            <CardDescription>
              Salve uma composição de camadas para compartilhar no geoportal.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {maps.map(map => (
            <Card key={map.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/dashboard/maps/${map.id}`} className="flex-1">
                    <CardTitle className="hover:underline">
                      {map.title}
                    </CardTitle>
                  </Link>
                  {map.is_private && (
                    <span className="shrink-0 rounded bg-orange-100 px-2 py-0.5 font-medium text-orange-700 text-xs">
                      Privado
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {map.description || 'Sem descrição'}
                </CardDescription>
                <p className="text-muted-foreground text-xs">
                  {map.layers.length} camada{map.layers.length === 1 ? '' : 's'}
                </p>
              </CardHeader>
              <CardFooter className="justify-end gap-2 bg-transparent">
                <Button variant="outline" size="sm" asChild>
                  <Link href={geoportalMapPath(map.id)} target="_blank">
                    Abrir
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/maps/${map.id}`}>Editar</Link>
                </Button>
                <ConfirmDeleteButton
                  action={() => deleteMap.mutateAsync(map.id)}
                  message={`Excluir o mapa "${map.title}"?`}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
