'use client'

import { Show } from '@clerk/nextjs'
import { BookOpenIcon, MapIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/site'

export function SobreHeroActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href={ROUTES.geoportal}>
          <MapIcon data-icon="inline-start" />
          Abrir o geoportal
        </Link>
      </Button>
      <Show when="signed-in">
        <Button variant="outline" asChild>
          <Link href={ROUTES.artigo}>
            <BookOpenIcon data-icon="inline-start" />
            Ler o artigo
          </Link>
        </Button>
      </Show>
    </div>
  )
}
