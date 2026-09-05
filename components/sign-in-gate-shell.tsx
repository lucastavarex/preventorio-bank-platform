import Image from 'next/image'
import type { ReactNode } from 'react'
import coverImage from '@/app/assets/cover.png'
import { Card, CardContent } from '@/components/ui/card'

export function SignInGateShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh md:grid-cols-2">
      <div className="flex flex-col justify-center bg-primary/12 p-6 md:p-10 lg:p-16">
        <div className="mx-auto w-full max-w-md">
          <Card className="[--card-spacing:--spacing(6)]">
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </div>
      <div className="relative hidden p-10 md:block bg-primary/12">
        <div className="relative h-full overflow-hidden rounded-3xl">
          <Image
            src={coverImage}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent"
          />
        </div>
      </div>
    </div>
  )
}
