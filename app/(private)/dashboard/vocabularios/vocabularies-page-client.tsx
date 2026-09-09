'use client'

import Link from 'next/link'
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
import { useVocabularyCounts } from '@/hooks/use-vocabularies'
import { VOCABULARIES, VOCABULARY_KINDS } from '@/lib/vocabularies'

export function VocabulariesPageClient() {
  const countsQuery = useVocabularyCounts()

  if (countsQuery.isPending) {
    return <DashboardListSkeleton cards={6} />
  }

  if (countsQuery.isError) {
    return (
      <DashboardQueryError
        message={countsQuery.error.message || 'Erro ao carregar vocabulários.'}
      />
    )
  }

  const counts = countsQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div className="min-w-0">
        <h1 className="font-bold text-2xl">Vocabulários</h1>
        <p className="text-muted-foreground text-sm">
          As listas de proveniência que aparecem no formulário de layer e na
          ficha pública.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VOCABULARY_KINDS.map(kind => {
          const vocabulary = VOCABULARIES[kind]
          const count = counts[kind]

          return (
            <Card key={kind}>
              <CardHeader>
                <Link href={`/dashboard/vocabularios/${kind}`}>
                  <CardTitle className="hover:underline">
                    {vocabulary.title}
                  </CardTitle>
                </Link>
                <CardDescription>{vocabulary.description}</CardDescription>
              </CardHeader>
              <CardFooter className="items-center justify-between bg-transparent">
                <span className="text-muted-foreground text-sm">
                  {count === 1 ? '1 termo' : `${count} termos`}
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/vocabularios/${kind}`}>
                    Gerenciar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
