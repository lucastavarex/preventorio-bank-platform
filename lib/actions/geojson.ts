'use server'

import { canReadPrivate } from '@/lib/roles.server'
import { GEOJSON_SIGNED_URL_TTL_SECONDS } from '@/lib/storage'
import { createServiceClient } from '@/lib/supabase/server'

export async function getLayerGeojsonAccess(layerId: string) {
  if (!layerId) {
    throw new Error('Layer inválido.')
  }

  const supabase = createServiceClient()
  const { data: layer, error } = await supabase
    .from('layers')
    .select('id, is_private, geojson_storage_path')
    .eq('id', layerId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!layer?.geojson_storage_path) {
    throw new Error('Layer não encontrado.')
  }

  if (layer.is_private && !(await canReadPrivate())) {
    throw new Error('Acesso negado.')
  }

  const { data, error: signError } = await supabase.storage
    .from('geojson')
    .createSignedUrl(layer.geojson_storage_path, GEOJSON_SIGNED_URL_TTL_SECONDS)

  if (signError || !data?.signedUrl) {
    throw new Error(signError?.message ?? 'Falha ao assinar o GeoJSON.')
  }

  return { url: data.signedUrl }
}
