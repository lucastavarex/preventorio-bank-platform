import { MapIcon } from 'lucide-react'
import Link from 'next/link'
import { HomeInternalCta } from '@/components/home-internal-cta'
import { PublicHeader } from '@/components/public-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-muted">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-4xl flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-bold text-2xl md:text-3xl">
              Portal do Geoportal
            </h1>
            <p className="max-w-lg text-balance text-muted-foreground">
              Explore o mapa ou entre no painel interno (somente convite).
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Geoportal</CardTitle>
                <CardDescription>
                  Mapa público. Não precisa de conta para explorar.
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/geoportal">
                    <MapIcon data-icon="inline-start" />
                    Abrir mapa
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Portal interno</CardTitle>
                <CardDescription>
                  Gestão do geoportal. Acesso somente para quem recebeu
                  convite.
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto w-full">
                <HomeInternalCta />
              </CardFooter>
            </Card>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            <Link href="/sobre" className="underline-offset-4 hover:underline">
              Sobre
            </Link>
            {' · '}
            <a
              href="https://bancopreventorio.org.br/"
              className="underline-offset-4 hover:underline"
              rel="noreferrer"
              target="_blank"
            >
              Site institucional
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
