'use client'

import { Show } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function PublicAuthControls() {
  return (
    <div className="flex justify-end p-4">
      <Show when="signed-out">
        <Button asChild>
          <Link href="/sign-in">Entrar</Link>
        </Button>
      </Show>
      <Show when="signed-in">
        <Button asChild>
          <Link href="/dashboard">Painel</Link>
        </Button>
      </Show>
    </div>
  )
}
