'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { hasGraduatedClassify } from '@/lib/classify'
import type { ClassifyClass, Layer } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

type GeoportalLegendProps = {
  layers: Layer[]
  hiddenClasses: Record<string, Set<number>>
  onToggleClass: (layerId: string, classIndex: number) => void
}

export function GeoportalLegend({
  layers,
  hiddenClasses,
  onToggleClass,
}: GeoportalLegendProps) {
  const layersWithLegend = layers.filter(
    l =>
      hasGraduatedClassify(l.style) ||
      (l.legend?.items && l.legend.items.length > 0)
  )

  if (layersWithLegend.length === 0) return null

  return (
    <Collapsible
      defaultOpen
      className="group/legend absolute right-3 top-42 z-10 w-56 rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between px-3 py-2 font-semibold"
        >
          Legenda
          <ChevronDownIcon className="group-data-[state=closed]/legend:hidden" />
          <ChevronUpIcon className="hidden group-data-[state=closed]/legend:inline" />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="flex max-h-[calc(100vh-220px)] flex-col gap-3 overflow-y-auto px-3 pb-3">
        {layersWithLegend.map(layer => (
          <div key={layer.id} className="flex flex-col gap-1">
            <p className="font-medium text-xs">{layer.title}</p>
            <div className="flex flex-col gap-1">
              {hasGraduatedClassify(layer.style)
                ? layer.style.classify.classes.map((cls, i) => {
                    const hidden = isClassHidden(
                      layer.id,
                      i,
                      cls,
                      hiddenClasses
                    )
                    return (
                      <Button
                        key={`${cls.min}-${cls.max}-${i}`}
                        type="button"
                        variant="ghost"
                        className={cn(
                          'h-auto w-full justify-start gap-2 px-0 py-0.5 text-xs',
                          hidden && 'opacity-40'
                        )}
                        onClick={() => onToggleClass(layer.id, i)}
                        title={hidden ? 'Mostrar classe' : 'Ocultar classe'}
                      >
                        <LegendSwatch
                          color={cls.color}
                          type={layer.style.type ?? 'fill'}
                        />
                        <span className={cn(hidden && 'line-through')}>
                          {cls.label}
                        </span>
                      </Button>
                    )
                  })
                : layer.legend.items!.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <LegendSwatch color={item.color} type={item.type} />
                      <span>{item.label}</span>
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function isClassHidden(
  layerId: string,
  index: number,
  cls: ClassifyClass,
  hiddenClasses: Record<string, Set<number>>
) {
  const session = hiddenClasses[layerId]
  if (session) return session.has(index)
  return cls.visible === false
}

function LegendSwatch({
  color,
  type,
}: {
  color: string
  type?: 'fill' | 'line' | 'circle'
}) {
  if (type === 'circle') {
    return (
      <span
        className="inline-block size-3 rounded-full"
        style={{ backgroundColor: color }}
      />
    )
  }

  if (type === 'line') {
    return (
      <span
        className="inline-block h-0.5 w-4"
        style={{ backgroundColor: color }}
      />
    )
  }

  return (
    <span
      className="inline-block size-3 rounded-sm"
      style={{ backgroundColor: color, opacity: 0.7 }}
    />
  )
}
