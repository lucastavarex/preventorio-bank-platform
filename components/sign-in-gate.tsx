'use client'

import { InfoIcon, LockIcon, MapIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { BrandMark } from '@/components/brand-mark'
import { SignInForm } from '@/components/sign-in-form'
import { SignInGateShell } from '@/components/sign-in-gate-shell'
import { Button } from '@/components/ui/button'
import { ROUTES, SITE_NAME } from '@/lib/site'

export function SignInGate() {
  const [view, setView] = useState<'choose' | 'sign-in'>('choose')

  if (view === 'sign-in') {
    return <SignInForm variant="gate" onBack={() => setView('choose')} />
  }

  return (
    <SignInGateShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <BrandMark size="md" />
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm tracking-wide">{SITE_NAME}</p>
            <h1 className="font-bold text-3xl tracking-tight">Geoportal</h1>
            <p className="text-balance text-muted-foreground">
              Explore as camadas públicas ou entre com convite para
              pesquisadores e parceiros.
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
          <Button variant="ghost" size="lg" className="w-full" asChild>
            <Link href={ROUTES.sobre}>
              <InfoIcon data-icon="inline-start" />
              Sobre o projeto
            </Link>
          </Button>
        </div>
      </div>
    </SignInGateShell>
  )
}
