'use client'

import { Show } from '@clerk/nextjs'
import { LayoutDashboardIcon, LockIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HomeInternalCta() {
  return (
    <div className="w-full">
      <Show when="signed-out">
        <Button asChild className="w-full">
          <Link href="/sign-in">
            <LockIcon data-icon="inline-start" />
            Entrar
          </Link>
        </Button>
      </Show>
      <Show when="signed-in">
        <Button asChild className="w-full">
          <Link href="/dashboard">
            <LayoutDashboardIcon data-icon="inline-start" />
            Abrir painel
          </Link>
        </Button>
      </Show>
    </div>
  )
}
