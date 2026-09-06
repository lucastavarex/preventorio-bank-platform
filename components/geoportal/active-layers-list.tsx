'use client'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVerticalIcon } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import type { Layer } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

type ActiveLayersListProps = {
  layers: Layer[]
  onReorder: (nextOrder: string[]) => void
  renderItem: (layer: Layer, dragHandle: ReactNode) => ReactNode
}

export function ActiveLayersList({
  layers,
  onReorder,
  renderItem,
}: ActiveLayersListProps) {
  const displayLayers = useMemo(() => [...layers].reverse(), [layers])
  const displayIds = useMemo(
    () => displayLayers.map(layer => layer.id),
    [displayLayers]
  )
  const canSort = displayLayers.length >= 2

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayIds.indexOf(String(active.id))
    const newIndex = displayIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const nextDisplay = arrayMove(displayLayers, oldIndex, newIndex)
    onReorder(nextDisplay.map(layer => layer.id).reverse())
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={displayIds}
        strategy={verticalListSortingStrategy}
        disabled={!canSort}
      >
        <div className="flex flex-col gap-2">
          {displayLayers.map(layer => (
            <SortableActiveLayer
              key={layer.id}
              id={layer.id}
              title={layer.title}
              canSort={canSort}
            >
              {dragHandle => renderItem(layer, dragHandle)}
            </SortableActiveLayer>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableActiveLayer({
  id,
  title,
  canSort,
  children,
}: {
  id: string
  title: string
  canSort: boolean
  children: (dragHandle: ReactNode) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !canSort })

  const dragHandle = canSort ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="cursor-grab touch-none active:cursor-grabbing"
      title="Arrastar para reordenar"
      aria-label={`Reordenar ${title}`}
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon />
    </Button>
  ) : null

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && 'relative bg-background opacity-80')}
    >
      {children(dragHandle)}
    </div>
  )
}
