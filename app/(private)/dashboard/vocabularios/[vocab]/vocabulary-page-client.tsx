'use client'

import { ArrowLeftIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { ConfirmDeleteButton } from '@/components/custom/confirm-delete-button'
import {
  DashboardListSkeleton,
  DashboardQueryError,
} from '@/components/dashboard/query-state'
import { VocabularyTermDialog } from '@/components/forms/vocabulary-term-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useDeleteVocabularyTerm,
  useSetVocabularyTermActive,
  useVocabularyTerms,
} from '@/hooks/use-vocabularies'
import { VOCABULARIES, type VocabularyKind } from '@/lib/vocabularies'

export function VocabularyPageClient({ kind }: { kind: VocabularyKind }) {
  const vocabulary = VOCABULARIES[kind]
  const termsQuery = useVocabularyTerms(kind)
  const setActive = useSetVocabularyTermActive(kind)
  const deleteTerm = useDeleteVocabularyTerm(kind)

  if (termsQuery.isPending) {
    return <DashboardListSkeleton cards={3} />
  }

  if (termsQuery.isError) {
    return (
      <DashboardQueryError
        message={termsQuery.error.message || 'Erro ao carregar os termos.'}
      />
    )
  }

  const terms = termsQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard/vocabularios"
            className="flex items-center gap-1 text-muted-foreground text-sm hover:underline"
          >
            <ArrowLeftIcon className="size-3.5" />
            Vocabulários
          </Link>
          <h1 className="font-bold text-2xl">{vocabulary.title}</h1>
          <p className="text-muted-foreground text-sm">
            {vocabulary.description}
          </p>
        </div>
        <VocabularyTermDialog
          kind={kind}
          trigger={
            <Button className="w-fit sm:shrink-0">
              <PlusIcon data-icon="inline-start" />
              Novo termo
            </Button>
          }
        />
      </div>

      {terms.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum termo</CardTitle>
            <CardDescription>
              Sem termos cadastrados, este campo fica indisponível no formulário
              de layer.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="divide-y rounded-lg border">
          {terms.map(term => (
            <div
              key={term.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{term.label}</span>
                  {!term.is_active && <Badge variant="outline">Inativo</Badge>}
                </div>
                <p className="font-mono text-muted-foreground text-xs">
                  {term.slug}
                </p>
                {term.description && (
                  <p className="text-muted-foreground text-sm">
                    {term.description}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  {term.usageCount === 0
                    ? 'Não usado por nenhum layer'
                    : term.usageCount === 1
                      ? 'Usado por 1 layer'
                      : `Usado por ${term.usageCount} layers`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      checked={term.is_active}
                      disabled={setActive.isPending}
                      onCheckedChange={checked =>
                        setActive.mutate({ id: term.id, isActive: checked })
                      }
                      aria-label={
                        term.is_active ? 'Desativar termo' : 'Ativar termo'
                      }
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    Termos inativos não aparecem como opção, mas continuam
                    legíveis nos layers que já os usam.
                  </TooltipContent>
                </Tooltip>

                <VocabularyTermDialog
                  kind={kind}
                  term={term}
                  trigger={
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  }
                />

                {term.usageCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled
                    title="Termo em uso. Desative em vez de excluir."
                  >
                    <Trash2Icon />
                  </Button>
                ) : (
                  <ConfirmDeleteButton
                    action={async () => {
                      // The hook toasts failures; swallowing keeps the dialog
                      // transition from surfacing an unhandled rejection.
                      await deleteTerm.mutateAsync(term.id).catch(() => {})
                    }}
                    message={`Excluir o termo "${term.label}"?`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
