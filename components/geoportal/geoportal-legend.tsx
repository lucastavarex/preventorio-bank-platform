'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
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
  const [collapsed, setCollapsed] = useState(false)

  const layersWithLegend = layers.filter(
    l =>
      hasGraduatedClassify(l.style) ||
      (l.legend?.items && l.legend.items.length > 0)
  )

  if (layersWithLegend.length === 0) return null

  return (
    <div className="absolute right-4 bottom-8 z-10 w-56 rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 font-semibold text-sm"
        onClick={() => setCollapsed(prev => !prev)}
      >
        Legenda
        {collapsed ? (
          <ChevronUpIcon className="size-4" />
        ) : (
          <ChevronDownIcon className="size-4" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-3 px-3 pb-3">
          {layersWithLegend.map(layer => (
              <div key={layer.id}>
                <p className="mb-1 font-medium text-xs">{layer.title}</p>
                <div className="space-y-1">
                  {hasGraduatedClassify(layer.style)
                    ? layer.style.classify.classes.map((cls, i) => {
                        const hidden = isClassHidden(
                          layer.id,
                          i,
                          cls,
                          hiddenClasses
                        )
                        return (
                          <button
                            key={`${cls.min}-${cls.max}-${i}`}
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-2 text-left text-xs',
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
                          </button>
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
        </div>
      )}
    </div>
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
      <span className="inline-block h-0.5 w-4" style={{ backgroundColor: color }} />
    )
  }

  return (
    <span
      className="inline-block size-3 rounded-sm"
      style={{ backgroundColor: color, opacity: 0.7 }}
    />
  )
}
