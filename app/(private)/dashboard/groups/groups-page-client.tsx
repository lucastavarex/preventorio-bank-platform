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
import { useDeleteGroup, useGroups } from '@/hooks/use-groups'

export function GroupsPageClient() {
  const groupsQuery = useGroups()
  const deleteGroup = useDeleteGroup()

  if (groupsQuery.isPending) {
    return <DashboardListSkeleton />
  }

  if (groupsQuery.isError) {
    return (
      <DashboardQueryError
        message={groupsQuery.error.message || 'Erro ao carregar grupos.'}
      />
    )
  }

  const groups = groupsQuery.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Grupos</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os grupos de layers do geoportal.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/groups/new">
            <PlusIcon data-icon="inline-start" />
            Novo grupo
          </Link>
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum grupo</CardTitle>
            <CardDescription>
              Crie o primeiro grupo para organizar seus layers.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => (
            <Card key={group.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/groups/${group.id}`}
                    className="flex-1"
                  >
                    <CardTitle className="hover:underline">
                      {group.title}
                    </CardTitle>
                  </Link>
                  {group.is_private && (
                    <span className="shrink-0 rounded bg-orange-100 px-2 py-0.5 font-medium text-orange-700 text-xs">
                      Privado
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {group.description || 'Sem descrição'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-end gap-2 bg-transparent">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/layers?group=${group.id}`}>
                    Ver layers
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/groups/${group.id}`}>Editar</Link>
                </Button>
                <ConfirmDeleteButton
                  action={() => deleteGroup.mutateAsync(group.id)}
                  message={`Excluir o grupo "${group.title}" e todos os layers associados?`}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
