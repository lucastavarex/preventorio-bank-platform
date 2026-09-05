import Image from 'next/image'
import type { ReactNode } from 'react'
import coverImage from '@/app/assets/cover.png'

export function SignInGateShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh md:grid-cols-2">
      <div className="flex flex-col justify-center bg-background p-6 md:p-10 lg:p-16">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
      <div className="relative hidden md:block">
        <Image
          src={coverImage}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover grayscale"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent"
        />
      </div>
    </div>
  )
}
