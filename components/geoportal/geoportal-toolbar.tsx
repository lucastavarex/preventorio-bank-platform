'use client'

import {
  Columns2Icon,
  CrosshairIcon,
  LayersIcon,
  MaximizeIcon,
  MinimizeIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react'
import type * as maplibregl from 'maplibre-gl'
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

type GeoportalToolbarProps = {
  getMap: () => maplibregl.Map | undefined
  fullscreenTargetRef: RefObject<HTMLElement | null>
  onOpenSidebar: () => void
  canCompare: boolean
  compareMode: boolean
  onEnterCompare: () => void
  onExitCompare: () => void
}

export function GeoportalToolbar({
  getMap,
  fullscreenTargetRef,
  onOpenSidebar,
  canCompare,
  compareMode,
  onEnterCompare,
  onExitCompare,
}: GeoportalToolbarProps) {
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
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
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
  children,
}: {
  title: string
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="rounded-full shadow-md"
          disabled={disabled}
          title={title}
          aria-label={title}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{title}</TooltipContent>
    </Tooltip>
  )
}
