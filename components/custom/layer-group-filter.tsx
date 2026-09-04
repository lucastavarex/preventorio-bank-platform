'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Group } from '@/lib/supabase/types'

const ALL_GROUPS = 'all'

type LayerGroupFilterProps = {
  groups: Pick<Group, 'id' | 'title'>[]
  selectedGroupId?: string
}

export function LayerGroupFilter({
  groups,
  selectedGroupId,
}: LayerGroupFilterProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleValueChange(value: string) {
    const href =
      value === ALL_GROUPS
        ? '/dashboard/layers'
        : `/dashboard/layers?group=${value}`

    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <Select
      value={selectedGroupId ?? ALL_GROUPS}
      onValueChange={handleValueChange}
      disabled={groups.length === 0 || isPending}
    >
      <SelectTrigger id="layer-group-filter" aria-label="Filtrar por grupo">
        <SelectValue placeholder="Todos os grupos" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={ALL_GROUPS}>Todos os grupos</SelectItem>
          {groups.map(group => (
            <SelectItem key={group.id} value={group.id}>
              {group.title}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
