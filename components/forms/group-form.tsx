'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCreateGroup, useUpdateGroup } from '@/hooks/use-groups'
import { isNextRedirect } from '@/lib/next-redirect'
import { type GroupFormValues, groupFormSchema } from '@/lib/schemas/group-form'
import type { Group } from '@/lib/supabase/types'

type GroupFormProps = {
  defaultValues?: Partial<Group>
}

export function GroupForm({ defaultValues }: GroupFormProps) {
  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup(defaultValues?.id ?? '')
  const mutation = defaultValues?.id ? updateGroup : createGroup

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      notes: defaultValues?.notes ?? '',
      isPrivate: defaultValues?.is_private ?? false,
    },
  })

  const onSubmit = useCallback(
    async (values: GroupFormValues) => {
      if (mutation.isPending) return

      const formData = new FormData()
      formData.set('title', values.title)
      formData.set('description', values.description)
      formData.set('notes', values.notes)
      formData.set('is_private', values.isPrivate ? 'on' : '')

      try {
        await mutation.mutateAsync(formData)
      } catch (error) {
        if (isNextRedirect(error)) throw error
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o grupo.'
        )
      }
    },
    [mutation]
  )

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="title" required>
                Título
              </FieldLabel>
              <Input
                {...field}
                id="title"
                aria-invalid={fieldState.invalid || undefined}
                aria-required
                placeholder="Ex: Infraestrutura"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="description">Descrição</FieldLabel>
              <Textarea
                {...field}
                id="description"
                placeholder="Descrição do grupo"
              />
            </Field>
          )}
        />

        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="notes">Anotações</FieldLabel>
              <Textarea
                {...field}
                id="notes"
                placeholder="Anotações internas (não visíveis no geoportal)"
              />
            </Field>
          )}
        />

        <Controller
          name="isPrivate"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="is_private"
                checked={field.value}
                onCheckedChange={checked => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="is_private">
                Privado (visível apenas para usuários autenticados)
              </FieldLabel>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          size="lg"
          className="h-12 min-w-56 px-10 text-base"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Spinner data-icon="inline-start" /> : null}
          {mutation.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
