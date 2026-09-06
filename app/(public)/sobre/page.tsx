import type { Metadata } from 'next'
import Link from 'next/link'
import { SobreHeroActions } from '@/components/sobre-hero-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ARTICLE,
  PARTNERS,
  ROUTES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  THESIS,
} from '@/lib/site'

export const metadata: Metadata = {
  title: `Sobre · ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
}

const thesisFields = [
  { label: 'Instituição', value: THESIS.university },
  { label: 'Unidade', value: `${THESIS.school} · ${THESIS.department}` },
  { label: 'Curso', value: THESIS.course },
  { label: 'Aluno', value: THESIS.student },
  { label: 'Orientador', value: THESIS.advisor },
] as const

export default function SobrePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 pb-8">
      <section className="flex flex-col gap-5">
        <Badge variant="secondary">Trabalho de conclusão de curso</Badge>
        <div className="flex flex-col gap-3">
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">
            {SITE_NAME}
          </h1>
          <p className="text-lg text-muted-foreground">{SITE_TAGLINE}</p>
          <p className="text-muted-foreground">{SITE_DESCRIPTION}</p>
        </div>
        <SobreHeroActions />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">O que é</h2>
        <p className="text-muted-foreground">
          Este geoportal reúne, em um só lugar, as camadas geoespaciais
          produzidas em projetos de mapeamento participativo. Há um ambiente
          público para consulta no mapa e um ambiente autenticado para gerenciar
          grupos, camadas e metadados, com controle de acesso por papéis.
        </p>
        <p className="text-muted-foreground">
          O sistema não edita geometrias no navegador, não faz processamento
          geoespacial avançado e não se integra ao QGIS. A estruturação dos
          dados parte das camadas já existentes, convertidas para um formato
          compatível com a aplicação.
        </p>
      </section>

      <section id="origem" className="flex scroll-mt-8 flex-col gap-4">
        <h2 className="font-semibold text-xl">Origem das camadas</h2>
        <p className="text-muted-foreground">
          Pesquisadores do {PARTNERS.labis.name} ({PARTNERS.labis.fullName}), em
          parceria com organizações comunitárias, produziram camadas sobre
          vulnerabilidade socioambiental, infraestrutura urbana e riscos no
          território do Preventório. Esses dados foram construídos no QGIS e
          depois convertidos para GeoJSON, preservando metadados para
          visualização e gestão nesta plataforma.
        </p>
        <p className="text-muted-foreground">
          O processo de mapeamento comunitário está descrito no capítulo{' '}
          <cite className="not-italic">“{ARTICLE.title}”</cite>, de Figueiredo
          et al. (2025), no âmbito do {PARTNERS.urbe.name}.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link
              href={ARTICLE.doiUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver DOI
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={ROUTES.artigo}>Abrir o artigo no portal</Link>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Estudo de caso</h2>
        <p className="text-muted-foreground">
          O recorte territorial é o Morro do Preventório, no município de
          Niterói, estado do Rio de Janeiro. A base cartográfica é o
          OpenStreetMap, em razão do mapeamento participativo já realizado na
          região.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Trabalho de graduação</h2>
        <Card>
          <CardHeader>
            <CardTitle>Projeto de graduação</CardTitle>
            <CardDescription>{THESIS.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-[8rem_1fr]">
              {thesisFields.map(field => (
                <div key={field.label} className="contents">
                  <dt className="text-muted-foreground text-sm">
                    {field.label}
                  </dt>
                  <dd className="text-sm">{field.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Parceiros</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{PARTNERS.labis.name}</CardTitle>
              <CardDescription>{PARTNERS.labis.fullName}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Produziu as camadas geográficas em parceria com organizações
                comunitárias, hoje organizadas neste geoportal.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{PARTNERS.banco.name}</CardTitle>
              <CardDescription>
                Parceiro comunitário no território do Preventório
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={PARTNERS.banco.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Acessar o site
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Referência</h2>
        <Card>
          <CardHeader>
            <CardTitle>{ARTICLE.title}</CardTitle>
            <CardDescription>Capítulo publicado em 2025</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">{ARTICLE.citation}</p>
            <p className="text-muted-foreground text-sm">
              ISBN {ARTICLE.isbn}. DOI:{' '}
              <Link
                href={ARTICLE.doiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {ARTICLE.doiLabel}
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
