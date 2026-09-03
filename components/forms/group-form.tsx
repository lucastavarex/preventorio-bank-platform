'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Group } from '@/lib/supabase/types'

type GroupFormProps = {
  action: (formData: FormData) => Promise<void>
  defaultValues?: Partial<Group>
}

export function GroupForm({ action, defaultValues }: GroupFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          placeholder="Ex: Infraestrutura"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Descrição do grupo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Anotações</Label>
        <textarea
          id="notes"
          name="notes"
          className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={defaultValues?.notes ?? ''}
          placeholder="Anotações internas (não visíveis no geoportal)"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_private"
          name="is_private"
          defaultChecked={defaultValues?.is_private ?? false}
          className="size-4 rounded border-input"
        />
        <Label htmlFor="is_private">
          Privado (visível apenas para usuários autenticados)
        </Label>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}
