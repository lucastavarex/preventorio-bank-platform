'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'
import type * as maplibregl from 'maplibre-gl'
import { Button } from '@/components/ui/button'

type MapZoomControlsProps = {
  getMap: () => maplibregl.Map | undefined
}

export function MapZoomControls({ getMap }: MapZoomControlsProps) {
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="shadow-md"
        title="Aproximar"
        aria-label="Aproximar"
        onClick={() => getMap()?.zoomIn({ duration: 300 })}
      >
        <PlusIcon />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="shadow-md"
        title="Afastar"
        aria-label="Afastar"
        onClick={() => getMap()?.zoomOut({ duration: 300 })}
      >
        <MinusIcon />
      </Button>
    </div>
  )
}
