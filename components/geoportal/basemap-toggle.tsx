'use client'

import { MapIcon, SatelliteIcon } from 'lucide-react'
import {
  BASEMAP_OPTIONS,
  type BasemapId,
} from '@/components/map/basemap-styles'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const BASEMAP_LABELS: Record<BasemapId, string> = {
  streets: 'OpenStreetMap',
  satellite: 'Satélite',
}

const BASEMAP_ICONS: Record<BasemapId, typeof MapIcon> = {
  streets: MapIcon,
  satellite: SatelliteIcon,
}

export function BasemapToggle({
  value,
  onChange,
}: {
  value: BasemapId
  onChange: (id: BasemapId) => void
}) {
  return (
    <ToggleGroup
      type="single"
      variant="default"
      size="sm"
      spacing={1}
      value={value}
      onValueChange={next => {
        if (next === 'streets' || next === 'satellite') {
          onChange(next)
        }
      }}
      className="w-full rounded-lg border border-primary/25 bg-primary/10 p-0.5"
    >
      {BASEMAP_OPTIONS.map(option => {
        const Icon = BASEMAP_ICONS[option.id]

        return (
          <ToggleGroupItem
            key={option.id}
            value={option.id}
            aria-label={BASEMAP_LABELS[option.id]}
            className="min-w-0 flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
          >
            <Icon data-icon="inline-start" />
            <span className="truncate">{BASEMAP_LABELS[option.id]}</span>
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
