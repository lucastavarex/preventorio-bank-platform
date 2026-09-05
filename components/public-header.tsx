import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'
import { PublicAuthControls } from '@/components/public-auth-controls'

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between gap-4 p-4 md:px-10">
      <Link href="/" className="flex items-center gap-2">
        <BrandMark />
        <span className="font-semibold">Banco do Preventório</span>
      </Link>
      <PublicAuthControls />
    </header>
  )
}
