'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
  FieldError,
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
import {
  createVocabularyTermFormSchema,
  type VocabularyTermFormValues,
} from '@/lib/schemas/vocabulary-term-form'
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
  const createTerm = useCreateVocabularyTerm(kind)
  const updateTerm = useUpdateVocabularyTerm(kind)
  const isPending = createTerm.isPending || updateTerm.isPending
  const isCreate = !term
  const schema = useMemo(
    () => createVocabularyTermFormSchema({ isCreate }),
    [isCreate]
  )

  const form = useForm<VocabularyTermFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: term?.label ?? '',
      slug: '',
      description: term?.description ?? '',
      sortOrder: term?.sort_order ?? 0,
      isActive: term?.is_active ?? true,
    },
  })

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next) {
        form.reset({
          label: term?.label ?? '',
          slug: '',
          description: term?.description ?? '',
          sortOrder: term?.sort_order ?? 0,
          isActive: term?.is_active ?? true,
        })
      }
    },
    [form, term]
  )

  const onSubmit = useCallback(
    async (values: VocabularyTermFormValues) => {
      if (isPending) return

      const formData = new FormData()
      formData.set('label', values.label)
      formData.set('description', values.description)
      formData.set('sort_order', String(values.sortOrder))
      formData.set('is_active', values.isActive ? 'on' : 'off')
      if (isCreate) {
        formData.set('slug', values.slug)
      }

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
    [createTerm, isCreate, isPending, term, updateTerm]
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
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <FieldGroup>
            <Controller
              name="label"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="term-label" required>
                    Rótulo
                  </FieldLabel>
                  <Input
                    {...field}
                    id="term-label"
                    aria-invalid={fieldState.invalid || undefined}
                    aria-required
                    placeholder="Ex: Percepção de risco"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  <FieldDescription>
                    Como o termo aparece no formulário e na ficha pública.
                  </FieldDescription>
                </Field>
              )}
            />

            {term ? (
              <Field>
                <FieldLabel>Identificador</FieldLabel>
                <p className="font-mono text-sm">{term.slug}</p>
                <FieldDescription>
                  É o valor gravado nas camadas, por isso não pode mudar.
                </FieldDescription>
              </Field>
            ) : (
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="term-slug">Identificador</FieldLabel>
                    <Input
                      {...field}
                      id="term-slug"
                      aria-invalid={fieldState.invalid || undefined}
                      placeholder="gerado a partir do rótulo"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                    <FieldDescription>
                      Valor gravado nas camadas. Depois de criado não muda mais.
                    </FieldDescription>
                  </Field>
                )}
              />
            )}

            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="term-description">Descrição</FieldLabel>
                  <Textarea
                    {...field}
                    id="term-description"
                    placeholder="Nota interna sobre quando usar este termo"
                  />
                </Field>
              )}
            />

            <Controller
              name="sortOrder"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="term-sort-order">Ordem</FieldLabel>
                  <Input
                    id="term-sort-order"
                    type="number"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={event => {
                      const next = event.target.valueAsNumber
                      field.onChange(Number.isFinite(next) ? next : 0)
                    }}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  <FieldDescription>
                    Menor primeiro na lista de opções.
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="term-is-active"
                    checked={field.value}
                    onCheckedChange={checked =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldLabel htmlFor="term-is-active">
                    Ativo (aparece como opção em novos layers)
                  </FieldLabel>
                </Field>
              )}
            />
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
