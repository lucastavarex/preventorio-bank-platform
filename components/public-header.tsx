import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'
import { PublicAuthControls } from '@/components/public-auth-controls'
import { Button } from '@/components/ui/button'
import { ROUTES, SITE_NAME } from '@/lib/site'

export function PublicHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 p-4 md:px-10">
      <Link href="/" className="flex items-center gap-2">
        <BrandMark />
        <span className="font-semibold">{SITE_NAME}</span>
      </Link>
      <nav className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href={ROUTES.geoportal}>Geoportal</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={ROUTES.sobre}>Sobre</Link>
        </Button>
        <PublicAuthControls />
      </nav>
    </header>
  )
}
