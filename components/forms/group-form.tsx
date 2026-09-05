'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCreateGroup, useUpdateGroup } from '@/hooks/use-groups'
import { isNextRedirect } from '@/lib/next-redirect'
import type { Group } from '@/lib/supabase/types'

type GroupFormProps = {
  defaultValues?: Partial<Group>
}

export function GroupForm({ defaultValues }: GroupFormProps) {
  const [isPrivate, setIsPrivate] = useState(defaultValues?.is_private ?? false)
  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup(defaultValues?.id ?? '')
  const mutation = defaultValues?.id ? updateGroup : createGroup

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (mutation.isPending) return

      const formData = new FormData(event.currentTarget)
      formData.set('is_private', isPrivate ? 'on' : '')

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
    [isPrivate, mutation]
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Título</FieldLabel>
          <Input
            id="title"
            name="title"
            required
            defaultValue={defaultValues?.title}
            placeholder="Ex: Infraestrutura"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Descrição</FieldLabel>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description ?? ''}
            placeholder="Descrição do grupo"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Anotações</FieldLabel>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="Anotações internas (não visíveis no geoportal)"
          />
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="is_private"
            checked={isPrivate}
            onCheckedChange={checked => setIsPrivate(checked === true)}
          />
          <FieldLabel htmlFor="is_private">
            Privado (visível apenas para usuários autenticados)
          </FieldLabel>
        </Field>
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
