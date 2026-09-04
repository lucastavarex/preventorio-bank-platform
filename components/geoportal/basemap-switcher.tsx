'use client'

import { CheckIcon, MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BASEMAP_OPTIONS,
  type BasemapId,
} from '@/components/map/basemap-styles'

type BasemapSwitcherProps = {
  value: BasemapId
  onChange: (id: BasemapId) => void
  className?: string
}

export function BasemapSwitcher({
  value,
  onChange,
  className,
}: BasemapSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={className}
          title="Estilo do mapa base"
          aria-label="Estilo do mapa base"
        >
          <MapIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>Mapa base</DropdownMenuLabel>
        {BASEMAP_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onChange(option.id)}
          >
            <span className="flex-1">{option.label}</span>
            {value === option.id && <CheckIcon className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
