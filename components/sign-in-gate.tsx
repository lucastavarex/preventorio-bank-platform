'use client'

import { LockIcon, MapIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { SignInForm } from '@/components/sign-in-form'
import { SignInGateShell } from '@/components/sign-in-gate-shell'
import { Button } from '@/components/ui/button'

export function SignInGate() {
  const [view, setView] = useState<'choose' | 'sign-in'>('choose')

  if (view === 'sign-in') {
    return <SignInForm variant="gate" onBack={() => setView('choose')} />
  }

  return (
    <SignInGateShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xl">
            B
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm tracking-wide">
              Banco do Preventório
            </p>
            <h1 className="font-bold text-3xl tracking-tight">Geoportal</h1>
            <p className="text-balance text-muted-foreground">
              Explore o mapa público ou entre com sua conta (somente convite).
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/geoportal">
              <MapIcon data-icon="inline-start" />
              Entrar no geoportal
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setView('sign-in')}
          >
            <LockIcon data-icon="inline-start" />
            Fazer login
          </Button>
        </div>
      </div>
    </SignInGateShell>
  )
}
