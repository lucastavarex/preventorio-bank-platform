import bbox from '@turf/bbox'

export function parseFeatureCollection(
  text: string
): GeoJSON.FeatureCollection {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Arquivo GeoJSON inválido.')
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as { type?: string }).type !== 'FeatureCollection' ||
    !Array.isArray((parsed as { features?: unknown }).features)
  ) {
    throw new Error('O arquivo precisa ser um GeoJSON FeatureCollection.')
  }

  return parsed as GeoJSON.FeatureCollection
}

export function computeBBox(
  geojson: GeoJSON.FeatureCollection
): number[] | null {
  if (geojson.features.length === 0) return null
  const box = bbox(geojson)
  if (!box.every(Number.isFinite)) return null
  return box
}
