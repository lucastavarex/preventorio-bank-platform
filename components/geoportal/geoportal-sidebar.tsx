'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import {
  BringToFrontIcon,
  Building2Icon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  DownloadIcon,
  FileTextIcon,
  HouseIcon,
  InfoIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LeafIcon,
  ListIcon,
  LogInIcon,
  MapIcon,
  PencilIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { BasemapToggle } from '@/components/geoportal/basemap-toggle'
import {
  filterLayersWithLegend,
  GeoportalLegendBody,
} from '@/components/geoportal/geoportal-legend'
import type { BasemapId } from '@/components/map/basemap-styles'
import { NavUser } from '@/components/nav-user'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CLERK_ORG_ROLES } from '@/lib/roles'
import type { Group, Layer, LayerStyle } from '@/lib/supabase/types'

type GroupWithLayers = Group & { layers: Layer[] }

const accordionTriggerClassName =
  'min-h-11 items-center py-3 hover:no-underline'

type GeoportalSidebarProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupsWithLayers: GroupWithLayers[]
  basemapId: BasemapId
  onBasemapChange: (id: BasemapId) => void
  visibleLayers: Set<string>
  layerOrder: string[]
  layersById: Map<string, Layer>
  layerOpacity: Record<string, number>
  loadingLayers: Set<string>
  layerErrors: Record<string, string>
  onToggleLayer: (layer: Layer) => void
  onLayerNameClick: (layer: Layer) => void
  onDownloadLayer: (layer: Layer) => void
  onBringToFront: (layerId: string) => void
  onOpacityChange: (layerId: string, value: number) => void
  hiddenClasses: Record<string, Set<number>>
  onToggleClass: (layerId: string, classIndex: number) => void
}

export function GeoportalSidebar({
  open,
  onOpenChange,
  groupsWithLayers,
  basemapId,
  onBasemapChange,
  visibleLayers,
  layerOrder,
  layersById,
  layerOpacity,
  loadingLayers,
  layerErrors,
  onToggleLayer,
  onLayerNameClick,
  onDownloadLayer,
  onBringToFront,
  onOpacityChange,
  hiddenClasses,
  onToggleClass,
}: GeoportalSidebarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { user, isLoaded } = useUser()
  const { has, isLoaded: authLoaded } = useAuth()
  const isAdmin =
    authLoaded && (has?.({ role: CLERK_ORG_ROLES.admin }) ?? false)
  const [query, setQuery] = useState('')
  const [accordionValue, setAccordionValue] = useState<string[]>([])
  const [infoOpen, setInfoOpen] = useState(false)

  const activeLayers = useMemo(
    () =>
      layerOrder
        .map(id => layersById.get(id))
        .filter((layer): layer is Layer => Boolean(layer))
        .filter(layer => visibleLayers.has(layer.id)),
    [layerOrder, layersById, visibleLayers]
  )
  const legendLayers = useMemo(
    () => filterLayersWithLegend(activeLayers),
    [activeLayers]
  )

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groupsWithLayers

    return groupsWithLayers
      .map(group => {
        const groupMatches = group.title.toLowerCase().includes(q)
        const layers = groupMatches
          ? group.layers
          : group.layers.filter(layer => layer.title.toLowerCase().includes(q))
        return { ...group, layers }
      })
      .filter(group => group.layers.length > 0)
  }, [groupsWithLayers, query])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) return
    setAccordionValue(prev => {
      const next = new Set(prev)
      for (const group of filteredGroups) next.add(group.id)
      return [...next]
    })
  }, [filteredGroups, query])

  const closePanel = () => {
    onOpenChange(false)
    setAccordionValue([])
    setQuery('')
  }

  const openPanel = (section?: string) => {
    onOpenChange(true)
    if (section === 'search') {
      window.requestAnimationFrame(() => searchInputRef.current?.focus())
      return
    }
    if (section === 'active-layers' || section) {
      setAccordionValue(prev =>
        prev.includes(section) ? prev : [...prev, section]
      )
    }
  }

  const infoDialog = (
    <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Informações GeoPortal</DialogTitle>
          <DialogDescription>
            Visualização das camadas geográficas.
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Mapas base: OpenStreetMap e Esri World Imagery.
        </p>
      </DialogContent>
    </Dialog>
  )

  if (!open) {
    return (
      <>
        <aside className="absolute inset-y-0 left-0 z-20 flex w-12 flex-col border-r bg-background/95 shadow-md backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-2">
            <RailButton title="Expandir menu" onClick={() => openPanel()}>
              <ChevronsRightIcon />
            </RailButton>
            <Separator />
            <RailButton title="Mapa base" onClick={() => openPanel()}>
              <MapIcon />
            </RailButton>
            <RailButton
              title="Camadas ativas"
              onClick={() => openPanel('active-layers')}
            >
              <LayersIcon />
            </RailButton>
            {legendLayers.length > 0 && (
              <RailButton title="Legenda" onClick={() => openPanel('legend')}>
                <ListIcon />
              </RailButton>
            )}
            <RailButton
              title="Pesquisar camadas"
              onClick={() => openPanel('search')}
            >
              <SearchIcon />
            </RailButton>
          </div>

          <div className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto p-2">
            {groupsWithLayers.map(group => {
              const Icon = getGroupIcon(group.title)
              return (
                <RailButton
                  key={group.id}
                  title={group.title}
                  onClick={() => openPanel(group.id)}
                >
                  <Icon />
                </RailButton>
              )
            })}
          </div>

          <div className="flex flex-col items-center gap-3 p-2">
            {!isLoaded || user ? (
              <NavUser standalone compact />
            ) : (
              <RailButton title="Entrar" href="/sign-in">
                <LogInIcon />
              </RailButton>
            )}
            <RailButton title="Portal interno" href="/dashboard">
              <LayoutDashboardIcon />
            </RailButton>
            <RailButton
              title="Informações GeoPortal"
              onClick={() => setInfoOpen(true)}
            >
              <InfoIcon />
            </RailButton>
          </div>
        </aside>
        {infoDialog}
      </>
    )
  }

  return (
    <>
      <aside className="absolute inset-y-0 left-0 z-20 flex w-80 max-w-[calc(100vw-1rem)] flex-col border-r bg-background/95 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Recolher menu"
            aria-label="Recolher menu"
            onClick={closePanel}
          >
            <ChevronsLeftIcon />
          </Button>
          <h2 className="min-w-0 flex-1 truncate font-semibold text-sm">
            Controle do Mapa
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Fechar menu"
            aria-label="Fechar menu"
            onClick={closePanel}
          >
            <XIcon />
          </Button>
        </div>

        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <section className="flex flex-col gap-2">
            <h3 className="font-medium text-sm">Mapa Base</h3>
            <BasemapToggle value={basemapId} onChange={onBasemapChange} />
          </section>

          <Separator />

          <Accordion
            type="multiple"
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="gap-1"
          >
            <AccordionItem value="active-layers">
              <AccordionTrigger className={accordionTriggerClassName}>
                <span className="flex min-w-0 items-center gap-2">
                  <LayersIcon className="size-4" />
                  <span className="truncate">Camadas Ativas</span>
                  <Badge variant="secondary">{activeLayers.length}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {activeLayers.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Nenhuma camada ativada.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeLayers.map(layer => (
                      <LayerRow
                        key={layer.id}
                        layer={layer}
                        isVisible
                        isLoading={loadingLayers.has(layer.id)}
                        error={layerErrors[layer.id]}
                        opacity={
                          layerOpacity[layer.id] ?? defaultOpacity(layer.style)
                        }
                        isTop={
                          layerOrder.length > 0 &&
                          layerOrder[layerOrder.length - 1] === layer.id
                        }
                        layerCount={layerOrder.length}
                        onToggle={onToggleLayer}
                        onNameClick={onLayerNameClick}
                        onDownload={onDownloadLayer}
                        onBringToFront={onBringToFront}
                        onOpacityChange={onOpacityChange}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            {legendLayers.length > 0 && (
              <AccordionItem value="legend">
                <AccordionTrigger className={accordionTriggerClassName}>
                  <span className="flex min-w-0 items-center gap-2">
                    <ListIcon className="size-4" />
                    <span className="truncate">Legenda</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <GeoportalLegendBody
                    layers={legendLayers}
                    hiddenClasses={hiddenClasses}
                    onToggleClass={onToggleClass}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          <div className="relative">
            <Input
              ref={searchInputRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Pesquisar camadas"
              aria-label="Pesquisar camadas"
              className="pr-8"
            />
            <SearchIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {groupsWithLayers.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Nenhum grupo cadastrado.
            </p>
          )}

          {filteredGroups.length === 0 && groupsWithLayers.length > 0 && (
            <p className="text-muted-foreground text-sm">
              Nenhuma camada encontrada.
            </p>
          )}

          <Accordion
            type="multiple"
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="gap-1"
          >
            {filteredGroups.map(group => {
              const Icon = getGroupIcon(group.title)
              return (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger className={accordionTriggerClassName}>
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="size-4" />
                      <span className="truncate">{group.title}</span>
                      {group.is_private && (
                        <Badge variant="secondary">Privado</Badge>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2">
                      {group.layers.map(layer => {
                        const isVisible = visibleLayers.has(layer.id)
                        return (
                          <LayerRow
                            key={layer.id}
                            layer={layer}
                            isVisible={isVisible}
                            isLoading={loadingLayers.has(layer.id)}
                            error={layerErrors[layer.id]}
                            opacity={
                              layerOpacity[layer.id] ??
                              defaultOpacity(layer.style)
                            }
                            isTop={
                              layerOrder.length > 0 &&
                              layerOrder[layerOrder.length - 1] === layer.id
                            }
                            layerCount={layerOrder.length}
                            onToggle={onToggleLayer}
                            onNameClick={onLayerNameClick}
                            onDownload={onDownloadLayer}
                            onBringToFront={onBringToFront}
                            onOpacityChange={onOpacityChange}
                            isAdmin={isAdmin}
                          />
                        )
                      })}
                      {group.layers.length === 0 && (
                        <p className="text-muted-foreground text-xs">
                          Nenhum layer
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        <div className="flex flex-col gap-1 border-t p-2">
          {!isLoaded || user ? (
            <NavUser standalone />
          ) : (
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/sign-in">
                <LogInIcon data-icon="inline-start" />
                Entrar
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/dashboard">
              <LayoutDashboardIcon data-icon="inline-start" />
              Portal interno
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setInfoOpen(true)}
          >
            <InfoIcon data-icon="inline-start" />
            Informações GeoPortal
          </Button>
        </div>
      </aside>
      {infoDialog}
    </>
  )
}

function LayerRow({
  layer,
  isVisible,
  isLoading,
  error,
  opacity,
  isTop,
  layerCount,
  onToggle,
  onNameClick,
  onDownload,
  onBringToFront,
  onOpacityChange,
  isAdmin,
}: {
  layer: Layer
  isVisible: boolean
  isLoading: boolean
  error?: string
  opacity: number
  isTop: boolean
  layerCount: number
  onToggle: (layer: Layer) => void
  onNameClick: (layer: Layer) => void
  onDownload: (layer: Layer) => void
  onBringToFront: (layerId: string) => void
  onOpacityChange: (layerId: string, value: number) => void
  isAdmin: boolean
}) {
  const canZoom = Boolean(layer.bbox && layer.bbox.length >= 4)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Spinner className="size-3.5" />
        ) : (
          <Switch
            size="sm"
            checked={isVisible}
            disabled={isLoading}
            onCheckedChange={() => onToggle(layer)}
            aria-label={
              isVisible ? `Ocultar ${layer.title}` : `Mostrar ${layer.title}`
            }
          />
        )}
        <button
          type="button"
          onClick={() => onNameClick(layer)}
          title={
            isVisible
              ? canZoom
                ? 'Zoom para o layer'
                : layer.title
              : 'Mostrar layer'
          }
          className="flex min-w-0 flex-1 items-center gap-1 rounded-md px-1 py-0.5 text-left text-sm hover:bg-muted"
        >
          <span className="truncate">{layer.title}</span>
          {error && (
            <span
              className="shrink-0 text-[10px] text-destructive"
              title={error}
            >
              erro
            </span>
          )}
        </button>
        {layer.geojson_storage_path && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Baixar GeoJSON"
            aria-label={`Baixar GeoJSON de ${layer.title}`}
            onClick={() => onDownload(layer)}
          >
            <DownloadIcon />
          </Button>
        )}
        {isAdmin && (
          <Button asChild variant="ghost" size="icon-xs">
            <Link
              href={`/dashboard/layers/${layer.id}`}
              title="Editar layer"
              aria-label={`Editar ${layer.title}`}
            >
              <PencilIcon />
            </Link>
          </Button>
        )}
      </div>

      {isVisible && (
        <div className="flex items-center gap-1.5 pl-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[opacity]}
              onValueChange={values =>
                onOpacityChange(layer.id, values[0] ?? 0)
              }
              className="min-w-0 flex-1"
              aria-label={`Opacidade de ${layer.title}`}
            />
            <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isTop || layerCount < 2}
            onClick={() => onBringToFront(layer.id)}
            title="Trazer para frente"
            aria-label={`Trazer ${layer.title} para frente`}
          >
            <BringToFrontIcon />
          </Button>
        </div>
      )}
    </div>
  )
}

function RailButton({
  title,
  onClick,
  href,
  children,
}: {
  title: string
  onClick?: () => void
  href?: string
  children: ReactNode
}) {
  const button = href ? (
    <Button
      asChild
      variant="ghost"
      size="icon-sm"
      title={title}
      aria-label={title}
    >
      <Link href={href}>{children}</Link>
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {children}
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{title}</TooltipContent>
    </Tooltip>
  )
}

function getGroupIcon(title: string) {
  const normalized = title.toLowerCase()
  if (/planej|urban|zona/.test(normalized)) return Building2Icon
  if (/ambiente|meio|verde|flore/.test(normalized)) return LeafIcon
  if (/servi[cç]o|p[uú]blic/.test(normalized)) return LandmarkIcon
  if (/unidade|pr[eé]dio/.test(normalized)) return HouseIcon
  if (/licenci|documento|habita/.test(normalized)) return FileTextIcon
  return LayersIcon
}

function defaultOpacity(style: LayerStyle) {
  return style.fillOpacity ?? style.strokeOpacity ?? style.circleOpacity ?? 1
}
