'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type PaletteOption = {
  id: string
  label: string
  stops: string[]
}

type PalettePickerProps = {
  value: string
  options: PaletteOption[]
  onChange: (id: string) => void
}

export function PalettePicker({
  value,
  options,
  onChange,
}: PalettePickerProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      value={value}
      onValueChange={next => {
        if (next) onChange(next)
      }}
      className="grid w-full grid-cols-3 sm:grid-cols-5"
    >
      {options.map(palette => (
        <ToggleGroupItem
          key={palette.id}
          value={palette.id}
          title={palette.label}
          aria-label={palette.label}
          className="h-auto min-w-0 flex-col items-stretch gap-1 p-1.5"
        >
          <span
            className="h-4 w-full rounded-sm"
            style={{
              background: `linear-gradient(to right, ${palette.stops.join(',')})`,
            }}
          />
          <span className="truncate text-xs">{palette.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
