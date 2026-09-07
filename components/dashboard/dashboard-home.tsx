import {
  BookOpenIcon,
  FolderIcon,
  FolderPlusIcon,
  GlobeIcon,
  InfoIcon,
  LayersIcon,
  LockIcon,
  type LucideIcon,
  MapIcon,
  PlusIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandMark } from '@/components/brand-mark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  DashboardGroupSummary,
  DashboardOverview,
  DashboardRecentLayer,
} from '@/lib/actions/dashboard'
import { ROLE_LABELS, type Role } from '@/lib/roles'
import { ARTICLE, geoportalLayerPath, ROUTES, SITE_TAGLINE } from '@/lib/site'
import { cn } from '@/lib/utils'

function PrivateBadge() {
  return (
    <span className="shrink-0 rounded bg-orange-100 px-2 py-0.5 font-medium text-orange-700 text-xs">
      Privado
    </span>
  )
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
    new Date(value)
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-semibold text-lg">
      <span className="size-1.5 rounded-full bg-primary" />
      {children}
    </h2>
  )
}

function IconChip({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
        className
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}

export function DashboardHome({
  name,
  role,
  overview,
}: {
  name: string
  role: Role
  overview: DashboardOverview
}) {
  const { isAdmin } = overview

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-xl bg-accent px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <BrandMark size="md" className="hidden sm:block" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-bold text-2xl">Olá, {name}</h1>
              <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                {ROLE_LABELS[role]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{SITE_TAGLINE}</p>
            {!isAdmin && (
              <p className="text-muted-foreground text-sm">
                Você pode consultar as camadas públicas e privadas no mapa.
                Apenas administradores podem editá-las.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href={ROUTES.geoportal}>
              <MapIcon data-icon="inline-start" />
              Acessar o Geoportal
            </Link>
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" asChild>
                <Link href="/dashboard/layers/new">
                  <PlusIcon data-icon="inline-start" />
                  Novo layer
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/groups/new">
                  <FolderPlusIcon data-icon="inline-start" />
                  Novo grupo
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>Catálogo</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FolderIcon}
            label="Grupos"
            value={overview.groupCount}
          />
          <StatCard
            icon={LayersIcon}
            label="Layers"
            value={overview.layerCount}
          />
          <StatCard
            icon={GlobeIcon}
            label="Layers públicos"
            value={overview.publicLayerCount}
          />
          <StatCard
            icon={LockIcon}
            label="Layers privados"
            value={overview.privateLayerCount}
          />
        </div>
      </section>

      {isAdmin && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Integridade do acervo</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <IncompleteCard
              title="Sem GeoJSON"
              description="Camadas sem arquivo enviado."
              items={overview.missingGeojson}
            />
            <IncompleteCard
              title="Sem descrição"
              description="Camadas sem metadado de descrição."
              items={overview.missingDescription}
            />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>Por grupo</SectionTitle>
        {overview.groups.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum grupo</CardTitle>
              <CardDescription>
                {isAdmin
                  ? 'Crie o primeiro grupo para organizar as camadas.'
                  : 'Ainda não há grupos visíveis para o seu acesso.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y">
              {overview.groups.map(group => (
                <GroupRow key={group.id} group={group} isAdmin={isAdmin} />
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Atualizadas recentemente</SectionTitle>
        {overview.recentLayers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma camada</CardTitle>
              <CardDescription>
                {isAdmin
                  ? 'Envie um GeoJSON para publicar a primeira camada.'
                  : 'Ainda não há camadas visíveis para o seu acesso.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y">
              {overview.recentLayers.map(layer => (
                <RecentLayerRow
                  key={layer.id}
                  layer={layer}
                  isAdmin={isAdmin}
                />
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Contexto</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-secondary/40">
            <CardHeader>
              <div className="flex items-start gap-3">
                <IconChip icon={BookOpenIcon} />
                <div className="flex flex-col gap-1">
                  <CardTitle>{ARTICLE.title}</CardTitle>
                  <CardDescription>
                    Estudo de caso do mapeamento comunitário do Morro do
                    Preventório.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.artigo}>
                  <BookOpenIcon data-icon="inline-start" />
                  Ler o artigo
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-secondary/40">
            <CardHeader>
              <div className="flex items-start gap-3">
                <IconChip icon={InfoIcon} />
                <div className="flex flex-col gap-1">
                  <CardTitle>Sobre o geoportal</CardTitle>
                  <CardDescription>
                    Origem das camadas, recorte do trabalho e parceiros do
                    projeto.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.sobre}>
                  <InfoIcon data-icon="inline-start" />
                  Ver sobre
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

function layerCountLabel(count: number) {
  return count === 1 ? '1 layer' : `${count} layers`
}

function GroupRow({
  group,
  isAdmin,
}: {
  group: DashboardGroupSummary
  isAdmin: boolean
}) {
  const inner = (
    <>
      <span className="min-w-0 truncate font-medium">{group.title}</span>
      <span className="flex shrink-0 items-center gap-2 text-muted-foreground text-sm">
        {group.isPrivate && <PrivateBadge />}
        {layerCountLabel(group.layerCount)}
      </span>
    </>
  )

  return (
    <li>
      {isAdmin ? (
        <Link
          href={`/dashboard/layers?group=${group.id}`}
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/60"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {inner}
        </div>
      )}
    </li>
  )
}

function RecentLayerRow({
  layer,
  isAdmin,
}: {
  layer: DashboardRecentLayer
  isAdmin: boolean
}) {
  const groupTitle = layer.groupTitle ?? 'Sem grupo'
  const updatedLabel = formatUpdatedAt(layer.updatedAt)

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link
        href={geoportalLayerPath(layer.id)}
        className="min-w-0 flex-1 rounded-md hover:bg-accent/60"
      >
        <p className="truncate font-medium hover:underline">{layer.title}</p>
        <p className="text-muted-foreground text-xs">
          {groupTitle} — {updatedLabel}
        </p>
      </Link>
      <div className="flex items-center gap-2">
        {layer.isPrivate && <PrivateBadge />}
        {isAdmin ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/layers/${layer.id}`}>Editar</Link>
          </Button>
        ) : null}
      </div>
    </li>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <IconChip icon={icon} />
        </div>
        <CardTitle className="font-semibold text-3xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

function IncompleteCard({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: { id: string; title: string }[]
}) {
  const hasIssues = items.length > 0

  return (
    <Card className={cn(hasIssues && 'bg-destructive/5')}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle
          className={cn(
            'font-semibold text-3xl tabular-nums',
            hasIssues && 'text-destructive'
          )}
        >
          {items.length}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {hasIssues && (
        <CardContent>
          <ul className="flex flex-col gap-1.5">
            {items.map(item => (
              <li key={item.id}>
                <Link
                  href={`/dashboard/layers/${item.id}`}
                  className="inline-flex items-center gap-1.5 text-sm hover:underline"
                >
                  <LayersIcon className="size-3.5 text-muted-foreground" />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
