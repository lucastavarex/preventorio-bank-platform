'use client'

import type * as React from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type ColorInputProps = {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
} & Omit<
  React.ComponentProps<typeof Input>,
  'id' | 'type' | 'value' | 'onChange' | 'className'
>

export function ColorInput({
  id,
  label,
  value,
  onChange,
  className,
  ...props
}: ColorInputProps) {
  const input = (
    <Input
      id={id}
      type="color"
      value={value}
      onChange={event => onChange(event.target.value)}
      className={cn('cursor-pointer p-0.5', className)}
      {...props}
    />
  )

  if (!label) {
    return input
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {input}
    </Field>
  )
}
