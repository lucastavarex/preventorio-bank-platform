import Link from 'next/link'
import { PublicAuthControls } from '@/components/public-auth-controls'

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between gap-4 p-4 md:px-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
          B
        </div>
        <span className="font-semibold">Banco do Preventório</span>
      </Link>
      <PublicAuthControls />
    </header>
  )
}
