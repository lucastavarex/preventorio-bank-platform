import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandMark } from '@/components/brand-mark'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES, SITE_NAME } from '@/lib/site'

function AuthBrandPanel() {
  return (
    <div className="relative hidden bg-primary/15 md:block">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <BrandMark variant="badge" size="md" />
        <p className="font-semibold">{SITE_NAME}</p>
        <p className="text-balance text-muted-foreground text-sm">
          Acesso por convite a pesquisadores e parceiros
        </p>
        <Link
          href={ROUTES.sobre}
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          Sobre o projeto
        </Link>
      </div>
    </div>
  )
}

export function AuthPageShell({
  children,
  footer,
}: {
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-4xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            {children}
            <AuthBrandPanel />
          </CardContent>
        </Card>
        {footer}
      </div>
    </div>
  )
}

export function AuthFormFallback() {
  return (
    <AuthPageShell>
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </AuthPageShell>
  )
}
