'use client'

import { Field, FieldLabel } from '@/components/ui/field'
import { Slider } from '@/components/ui/slider'

type OpacitySliderProps = {
  id?: string
  label: string
  value: number
  onChange: (value: number) => void
}

export function OpacitySlider({
  id,
  label,
  value,
  onChange,
}: OpacitySliderProps) {
  const percent = Math.round(value * 100)

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <Slider
          id={id}
          min={0}
          max={1}
          step={0.05}
          value={[value]}
          onValueChange={values => onChange(values[0] ?? 0)}
          className="h-3 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-track]]:h- [&_[data-slot=slider-track]]:data-horizontal:h-"
        />
        <span className="w-10 text-right text-muted-foreground text-sm tabular-nums">
          {percent}%
        </span>
      </div>
    </Field>
  )
}
