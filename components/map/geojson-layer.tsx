'use client'

import { useMemo } from 'react'
import { Layer as MapLayer, Source } from 'react-map-gl/maplibre'
import {
  applyHiddenClasses,
  classifyColorExpression,
  classifyFilter,
  hasGraduatedClassify,
} from '@/lib/classify'
import type { LayerStyle } from '@/lib/supabase/types'

type GeoJSONLayerProps = {
  id: string
  data: GeoJSON.FeatureCollection
  style: LayerStyle
  visible?: boolean
  beforeId?: string
  hiddenClassIndexes?: Set<number>
}

export function GeoJSONLayer({
  id,
  data,
  style,
  visible = true,
  beforeId,
  hiddenClassIndexes,
}: GeoJSONLayerProps) {
  const layerType = style.type ?? detectGeometryType(data)

  const classify = useMemo(() => {
    if (!hasGraduatedClassify(style)) return undefined
    return applyHiddenClasses(style.classify, hiddenClassIndexes)
  }, [style, hiddenClassIndexes])

  const filter = classify ? classifyFilter(classify) : undefined
  const layerFilter = filter ?? (['all'] as const)

  const paintProps = useMemo(() => {
    switch (layerType) {
      case 'fill': {
        const fallback = style.fillColor ?? '#3b82f6'
        return {
          'fill-color': classify
            ? classifyColorExpression(classify, fallback)
            : fallback,
          'fill-opacity': style.fillOpacity ?? 1,
        }
      }
      case 'line': {
        const fallback = style.strokeColor ?? '#000000'
        return {
          'line-color': classify
            ? classifyColorExpression(classify, fallback)
            : fallback,
          'line-width': style.strokeWidth ?? 2,
          'line-opacity': style.strokeOpacity ?? 1,
        }
      }
      case 'circle': {
        const fallback = style.circleColor ?? '#3b82f6'
        return {
          'circle-color': classify
            ? classifyColorExpression(classify, fallback)
            : fallback,
          'circle-radius': style.circleRadius ?? 6,
          'circle-opacity': style.circleOpacity ?? 1,
        }
      }
      default:
        return { 'fill-color': '#3b82f6', 'fill-opacity': 1 }
    }
  }, [layerType, style, classify])

  const outlinePaint =
    layerType === 'fill'
      ? {
          'line-color': style.strokeColor ?? '#000000',
          'line-width': style.strokeWidth ?? 1,
          'line-opacity': style.strokeOpacity ?? 1,
        }
      : null

  return (
    <Source id={id} type="geojson" data={data}>
      <MapLayer
        key={`${id}-${layerType}`}
        id={id}
        type={layerType}
        paint={paintProps as Record<string, unknown>}
        filter={layerFilter}
        layout={{ visibility: visible ? 'visible' : 'none' }}
        beforeId={beforeId}
      />
      {outlinePaint && (
        <MapLayer
          id={`${id}-outline`}
          type="line"
          paint={outlinePaint}
          filter={layerFilter}
          layout={{ visibility: visible ? 'visible' : 'none' }}
          beforeId={beforeId}
        />
      )}
    </Source>
  )
}

function detectGeometryType(
  data: GeoJSON.FeatureCollection
): 'fill' | 'line' | 'circle' {
  const first = data.features[0]
  if (!first) return 'fill'

  const geomType = first.geometry.type
  if (geomType === 'Point' || geomType === 'MultiPoint') return 'circle'
  if (geomType === 'LineString' || geomType === 'MultiLineString') return 'line'
  return 'fill'
}
