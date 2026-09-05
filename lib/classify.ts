import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import type {
  ClassifyClass,
  GraduatedClassify,
  LayerStyle,
  LegendConfig,
} from '@/lib/supabase/types'

const DEFAULT_LABELS = ['No data', 'Low', 'Concern', 'Medium', 'High']

export const DEFAULT_PALETTE_ID = 'oranges'

export type ClassifyPalette = {
  id: string
  label: string
  stops: string[]
}

export const CLASSIFY_PALETTES: ClassifyPalette[] = [
  {
    id: 'oranges',
    label: 'Laranja',
    stops: [
      '#fff7ec',
      '#fee6ce',
      '#fdd0a2',
      '#fdae6b',
      '#fd8d3c',
      '#f16913',
      '#d94801',
      '#a63603',
      '#7f2704',
    ],
  },
  {
    id: 'ylorbr',
    label: 'Amarelo–marrom',
    stops: [
      '#ffffe5',
      '#fff7bc',
      '#fee391',
      '#fec44f',
      '#fe9929',
      '#ec7014',
      '#cc4c02',
      '#993404',
      '#662506',
    ],
  },
  {
    id: 'blues',
    label: 'Azul',
    stops: [
      '#f7fbff',
      '#deebf7',
      '#c6dbef',
      '#9ecae1',
      '#6baed6',
      '#4292c6',
      '#2171b5',
      '#08519c',
      '#08306b',
    ],
  },
  {
    id: 'reds',
    label: 'Vermelho',
    stops: [
      '#fff5f0',
      '#fee0d2',
      '#fcbba1',
      '#fc9272',
      '#fb6a4a',
      '#ef3b2c',
      '#cb181d',
      '#a50f15',
      '#67000d',
    ],
  },
  {
    id: 'greens',
    label: 'Verde',
    stops: [
      '#f7fcf5',
      '#e5f5e0',
      '#c7e9c0',
      '#a1d99b',
      '#74c476',
      '#41ab5d',
      '#238b45',
      '#006d2c',
      '#00441b',
    ],
  },
  {
    id: 'purples',
    label: 'Roxo',
    stops: [
      '#fcfbfd',
      '#efedf5',
      '#dadaeb',
      '#bcbddc',
      '#9e9ac8',
      '#807dba',
      '#6a51a3',
      '#54278f',
      '#3f007d',
    ],
  },
  {
    id: 'greys',
    label: 'Cinza',
    stops: [
      '#ffffff',
      '#f0f0f0',
      '#d9d9d9',
      '#bdbdbd',
      '#969696',
      '#737373',
      '#525252',
      '#252525',
      '#000000',
    ],
  },
  {
    id: 'ylgnbu',
    label: 'Amarelo–azul',
    stops: [
      '#ffffd9',
      '#edf8b1',
      '#c7e9b4',
      '#7fcdbb',
      '#41b6c4',
      '#1d91c0',
      '#225ea8',
      '#253494',
      '#081d58',
    ],
  },
  {
    id: 'viridis',
    label: 'Viridis',
    stops: [
      '#440154',
      '#482777',
      '#3f4a8a',
      '#31678e',
      '#26838f',
      '#1f9d8a',
      '#6cce5a',
      '#b6de2b',
      '#fde725',
    ],
  },
]

export function getPalette(id: string | undefined): ClassifyPalette {
  return (
    CLASSIFY_PALETTES.find(palette => palette.id === id) ?? CLASSIFY_PALETTES[0]
  )
}

export function normalizeHex(input: string): string | null {
  let value = input.trim().toLowerCase()
  if (value.startsWith('#')) value = value.slice(1)
  if (/^[0-9a-f]{3}$/.test(value)) {
    value = value
      .split('')
      .map(char => char + char)
      .join('')
  }
  if (!/^[0-9a-f]{6}$/.test(value)) return null
  return `#${value}`
}

export function sampleRamp(stops: string[], count: number): string[] {
  const n = Math.max(1, Math.round(count))
  if (stops.length === 0) return Array.from({ length: n }, () => '#808080')
  if (n === 1) return [stops[0]]
  if (n === stops.length) return [...stops]

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const pos = t * (stops.length - 1)
    const index = Math.min(stops.length - 2, Math.floor(pos))
    return interpolateHex(stops[index], stops[index + 1], pos - index)
  })
}

export function recolorClasses(
  classes: ClassifyClass[],
  paletteId: string
): ClassifyClass[] {
  const colors = sampleRamp(getPalette(paletteId).stops, classes.length)
  return classes.map((cls, i) => ({ ...cls, color: colors[i] }))
}

export function hasGraduatedClassify(
  style: LayerStyle | undefined
): style is LayerStyle & { classify: GraduatedClassify } {
  return Boolean(style?.classify?.property && style.classify.classes.length > 0)
}

export function numericFieldNames(
  data: GeoJSON.FeatureCollection | null
): string[] {
  if (!data || data.features.length === 0) return []

  const counts = new Map<string, number>()
  const sample = data.features.slice(0, 200)

  for (const feature of sample) {
    const props = feature.properties ?? {}
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key]) => key)
}

export function fieldExtent(
  data: GeoJSON.FeatureCollection,
  property: string
): { min: number; max: number } | null {
  let min = Infinity
  let max = -Infinity

  for (const feature of data.features) {
    const value = feature.properties?.[property]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    if (value < min) min = value
    if (value > max) max = value
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return { min, max }
}

export function interpolateHex(start: string, end: string, t: number): string {
  const a = hexToRgb(start)
  const b = hexToRgb(end)
  if (!a || !b) return start
  const clamp = Math.min(1, Math.max(0, t))
  return rgbToHex(
    Math.round(a[0] + (b[0] - a[0]) * clamp),
    Math.round(a[1] + (b[1] - a[1]) * clamp),
    Math.round(a[2] + (b[2] - a[2]) * clamp)
  )
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const n = Number.parseInt(normalized.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

export function equalIntervalClasses(
  min: number,
  max: number,
  count: number,
  paletteId = DEFAULT_PALETTE_ID
): ClassifyClass[] {
  const n = Math.max(1, Math.min(12, Math.round(count)))
  const span = max - min
  const step = span === 0 ? 0 : span / n
  const colors = sampleRamp(getPalette(paletteId).stops, n)

  return Array.from({ length: n }, (_, i) => {
    const classMin = min + step * i
    const classMax = i === n - 1 ? max : min + step * (i + 1)
    return {
      min: roundBreak(classMin),
      max: roundBreak(classMax),
      color: colors[i],
      label:
        DEFAULT_LABELS[i] && n === DEFAULT_LABELS.length
          ? DEFAULT_LABELS[i]
          : `${roundBreak(classMin)} – ${roundBreak(classMax)}`,
      visible: true,
    }
  })
}

function roundBreak(value: number): number {
  return Number(value.toFixed(6))
}

export function legendFromClassify(
  classify: GraduatedClassify | undefined,
  type: LayerStyle['type']
): LegendConfig {
  if (!classify?.classes.length) return { items: [] }
  return {
    items: classify.classes.map(cls => ({
      label: cls.label,
      color: cls.color,
      type: type ?? 'fill',
    })),
  }
}

function propertyExpr(property: string): ExpressionSpecification {
  return ['to-number', ['get', property]]
}

function classCondition(
  property: string,
  cls: ClassifyClass,
  isLast: boolean
): ExpressionSpecification {
  const value = propertyExpr(property)
  if (isLast) {
    return ['all', ['>=', value, cls.min], ['<=', value, cls.max]]
  }
  return ['all', ['>=', value, cls.min], ['<', value, cls.max]]
}

export function classifyColorExpression(
  classify: GraduatedClassify,
  fallback: string
): ExpressionSpecification | string {
  if (classify.classes.length === 0) return fallback

  const expr: unknown[] = ['case']
  classify.classes.forEach((cls, i) => {
    expr.push(
      classCondition(classify.property, cls, i === classify.classes.length - 1)
    )
    expr.push(cls.color)
  })
  expr.push(fallback)
  return expr as ExpressionSpecification
}

export function classifyFilter(
  classify: GraduatedClassify
): FilterSpecification | undefined {
  const visible = classify.classes
    .map((cls, i) => ({ cls, i }))
    .filter(({ cls }) => cls.visible !== false)

  if (visible.length === 0) {
    return ['==', 1, 0]
  }

  if (visible.length === classify.classes.length) {
    return undefined
  }

  return [
    'any',
    ...visible.map(({ cls, i }) =>
      classCondition(classify.property, cls, i === classify.classes.length - 1)
    ),
  ] as FilterSpecification
}

export function applyHiddenClasses(
  classify: GraduatedClassify,
  hiddenIndexes?: Set<number>
): GraduatedClassify {
  if (!hiddenIndexes) return classify
  return {
    ...classify,
    classes: classify.classes.map((cls, i) => ({
      ...cls,
      visible: !hiddenIndexes.has(i),
    })),
  }
}
