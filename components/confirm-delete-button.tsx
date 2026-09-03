'use client'

import { Trash2Icon } from 'lucide-react'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

type ConfirmDeleteButtonProps = {
  action: () => Promise<void>
  message: string
}

export function ConfirmDeleteButton({
  action,
  message,
}: ConfirmDeleteButtonProps) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(message)) return
        startTransition(async () => {
          await action()
        })
      }}
    >
      <Trash2Icon className="size-4" />
    </Button>
  )
}
