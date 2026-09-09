'use client'

import { type ReactNode, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateVocabularyTerm,
  useUpdateVocabularyTerm,
} from '@/hooks/use-vocabularies'
import type { ProvenanceTerm } from '@/lib/supabase/types'
import { VOCABULARIES, type VocabularyKind } from '@/lib/vocabularies'

type VocabularyTermDialogProps = {
  kind: VocabularyKind
  /** Absent when creating. */
  term?: ProvenanceTerm
  trigger: ReactNode
}

export function VocabularyTermDialog({
  kind,
  term,
  trigger,
}: VocabularyTermDialogProps) {
  const vocabulary = VOCABULARIES[kind]
  const [open, setOpen] = useState(false)
  const [isActive, setIsActive] = useState(term?.is_active ?? true)
  const createTerm = useCreateVocabularyTerm(kind)
  const updateTerm = useUpdateVocabularyTerm(kind)
  const isPending = createTerm.isPending || updateTerm.isPending

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next) setIsActive(term?.is_active ?? true)
    },
    [term]
  )

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (isPending) return

      const formData = new FormData(event.currentTarget)
      formData.set('is_active', isActive ? 'on' : 'off')

      try {
        if (term) {
          await updateTerm.mutateAsync({ id: term.id, formData })
        } else {
          await createTerm.mutateAsync(formData)
        }
        setOpen(false)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o termo.'
        )
      }
    },
    [createTerm, isActive, isPending, term, updateTerm]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {term ? 'Editar termo' : `Novo ${vocabulary.singular}`}
          </DialogTitle>
          <DialogDescription>{vocabulary.description}</DialogDescription>
        </DialogHeader>

        <form
          key={open ? (term?.id ?? 'new') : 'closed'}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="term-label">Rótulo</FieldLabel>
              <Input
                id="term-label"
                name="label"
                required
                defaultValue={term?.label}
                placeholder="Ex: Percepção de risco"
              />
              <FieldDescription>
                Como o termo aparece no formulário e na ficha pública.
              </FieldDescription>
            </Field>

            {term ? (
              <Field>
                <FieldLabel>Identificador</FieldLabel>
                <p className="font-mono text-sm">{term.slug}</p>
                <FieldDescription>
                  É o valor gravado nas camadas, por isso não pode mudar.
                </FieldDescription>
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="term-slug">Identificador</FieldLabel>
                <Input
                  id="term-slug"
                  name="slug"
                  placeholder="gerado a partir do rótulo"
                />
                <FieldDescription>
                  Valor gravado nas camadas. Depois de criado não muda mais.
                </FieldDescription>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="term-description">Descrição</FieldLabel>
              <Textarea
                id="term-description"
                name="description"
                defaultValue={term?.description ?? ''}
                placeholder="Nota interna sobre quando usar este termo"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="term-sort-order">Ordem</FieldLabel>
              <Input
                id="term-sort-order"
                name="sort_order"
                type="number"
                defaultValue={term?.sort_order ?? 0}
              />
              <FieldDescription>
                Menor primeiro na lista de opções.
              </FieldDescription>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="term-is-active"
                checked={isActive}
                onCheckedChange={checked => setIsActive(checked === true)}
              />
              <FieldLabel htmlFor="term-is-active">
                Ativo (aparece como opção em novos layers)
              </FieldLabel>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
