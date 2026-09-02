import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function AuthBrandPanel() {
  return (
    <div className="relative hidden bg-primary/15 md:block">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-xl">
          B
        </div>
        <p className="font-semibold">Banco do Preventório</p>
        <p className="text-balance text-muted-foreground text-sm">
          Portal interno do geoportal
        </p>
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
