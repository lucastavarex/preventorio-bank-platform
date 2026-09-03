'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Group } from '@/lib/supabase/types'

type GroupFormProps = {
  action: (formData: FormData) => Promise<void>
  defaultValues?: Partial<Group>
}

export function GroupForm({ action, defaultValues }: GroupFormProps) {
  const [isPrivate, setIsPrivate] = useState(defaultValues?.is_private ?? false)

  return (
    <form action={action} className="flex flex-col gap-4">
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
          <input
            type="hidden"
            name="is_private"
            value={isPrivate ? 'on' : ''}
          />
        </Field>
      </FieldGroup>

      <div className="flex justify-end pt-6">
        <Button type="submit" size="lg" className="h-12 min-w-56 px-10 text-base">
          Salvar
        </Button>
      </div>
    </form>
  )
}
