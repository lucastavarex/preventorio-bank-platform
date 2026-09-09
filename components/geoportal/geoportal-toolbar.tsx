'use client'

import { useAuth } from '@clerk/nextjs'
import {
  Columns2Icon,
  CrosshairIcon,
  ImageIcon,
  LayersIcon,
  MaximizeIcon,
  MinimizeIcon,
  MinusIcon,
  PlusIcon,
  SaveIcon,
  Share2Icon,
  XIcon,
} from 'lucide-react'
import type * as maplibregl from 'maplibre-gl'
import Link from 'next/link'
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CLERK_ORG_ROLES } from '@/lib/roles'
import { SITE_NAME } from '@/lib/site'
import { cn } from '@/lib/utils'

type GeoportalToolbarProps = {
  getMap: () => maplibregl.Map | undefined
  fullscreenTargetRef: RefObject<HTMLElement | null>
  onOpenSidebar: () => void
  canCompare: boolean
  compareMode: boolean
  onEnterCompare: () => void
  onExitCompare: () => void
  onExportPng: () => void
  onPrepareShare?: () => void
  saveMapHref: string
  hidden?: boolean
}

export function GeoportalToolbar({
  getMap,
  fullscreenTargetRef,
  onOpenSidebar,
  canCompare,
  compareMode,
  onEnterCompare,
  onExitCompare,
  onExportPng,
  onPrepareShare,
  saveMapHref,
  hidden,
}: GeoportalToolbarProps) {
  const { has, isLoaded } = useAuth()
  const isAdmin = isLoaded && (has?.({ role: CLERK_ORG_ROLES.admin }) ?? false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const zoomIn = () => getMap()?.zoomIn({ duration: 300 })
  const zoomOut = () => getMap()?.zoomOut({ duration: 300 })

  const toggleFullscreen = useCallback(async () => {
    const target = fullscreenTargetRef.current
    if (!target) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }
      await target.requestFullscreen()
    } catch {
      toast.error('Não foi possível alterar a tela cheia')
    }
  }, [fullscreenTargetRef])

  const shareView = useCallback(async () => {
    onPrepareShare?.()
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: SITE_NAME, url })
        return
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link da vista copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }, [onPrepareShare])

  const locateUser = useCallback(() => {
    const map = getMap()
    if (!map) return
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada neste navegador')
      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        map.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: Math.max(map.getZoom(), 16),
          duration: 1000,
        })
      },
      () => {
        toast.error('Não foi possível obter a localização')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [getMap])

  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-20 flex flex-col gap-1.5 rounded-full bg-background/80 px-2 py-4 shadow-md backdrop-blur-sm transition-opacity duration-200',
        hidden && 'max-md:pointer-events-none max-md:opacity-0'
      )}
    >
      <ToolbarButton title="Aproximar" onClick={zoomIn}>
        <PlusIcon />
      </ToolbarButton>
      <ToolbarButton title="Afastar" onClick={zoomOut}>
        <MinusIcon />
      </ToolbarButton>
      <ToolbarButton
        title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        onClick={toggleFullscreen}
      >
        {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
      </ToolbarButton>
      <ToolbarButton title="Localizar usuário" onClick={locateUser}>
        <CrosshairIcon />
      </ToolbarButton>
      <ToolbarButton title="Exportar PNG" onClick={onExportPng}>
        <ImageIcon />
      </ToolbarButton>
      <ToolbarButton title="Compartilhar vista" onClick={shareView}>
        <Share2Icon />
      </ToolbarButton>
      {isAdmin && (
        <ToolbarButton title="Salvar como mapa" href={saveMapHref}>
          <SaveIcon />
        </ToolbarButton>
      )}
      <ToolbarButton title="Controle do mapa" onClick={onOpenSidebar}>
        <LayersIcon />
      </ToolbarButton>
      <ToolbarButton
        title={
          compareMode
            ? 'Sair da comparação'
            : canCompare
              ? 'Comparar os 2 layers visíveis'
              : 'Ative exatamente 2 layers para comparar'
        }
        disabled={!compareMode && !canCompare}
        onClick={compareMode ? onExitCompare : onEnterCompare}
      >
        {compareMode ? <XIcon /> : <Columns2Icon />}
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  title,
  disabled,
  onClick,
  href,
  children,
}: {
  title: string
  disabled?: boolean
  onClick?: () => void
  href?: string
  children: ReactNode
}) {
  const button = href ? (
    <Button
      asChild
      size="icon"
      className="rounded-full shadow-md"
      title={title}
      aria-label={title}
    >
      <Link href={href}>{children}</Link>
    </Button>
  ) : (
    <Button
      type="button"
      size="icon"
      className="rounded-full shadow-md"
      disabled={disabled}
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
      <TooltipContent side="left">{title}</TooltipContent>
    </Tooltip>
  )
}
