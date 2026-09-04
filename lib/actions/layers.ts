'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { computeBBox, parseFeatureCollection } from '@/lib/geojson'
import { requireAdmin } from '@/lib/roles.server'
import {
  createAnonServerClient,
  createServerClient,
  createServiceClient,
} from '@/lib/supabase/server'
import type {
  LayerInsert,
  LayerStyle,
  LayerUpdate,
  LayerWithGroup,
  LegendConfig,
} from '@/lib/supabase/types'

function revalidateLayerPages() {
  revalidatePath('/dashboard/layers')
  revalidatePath('/dashboard/groups', 'layout')
  revalidatePath('/geoportal')
}

export async function getLayers(groupId?: string): Promise<LayerWithGroup[]> {
  await requireAdmin()
  const supabase = createServiceClient()
  const query = supabase
    .from('layers')
    .select('*, groups(title)')
    .order('sort_order', { ascending: true })

  const { data, error } = await (groupId
    ? query.eq('group_id', groupId)
    : query)

  if (error) throw new Error(error.message)
  return data as LayerWithGroup[]
}

export async function getLayersByGroup(groupId: string) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('layers')
    .select('*')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getLayer(id: string): Promise<LayerWithGroup> {
  await requireAdmin()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('layers')
    .select('*, groups(title)')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as LayerWithGroup
}

export async function getGroupsWithLayers() {
  const query = (client: ReturnType<typeof createServerClient>) =>
    client.from('groups').select('*, layers(*)').order('sort_order', {
      ascending: true,
    })

  const authenticated = await query(createServerClient())
  const result =
    authenticated.error && isJwtKeyError(authenticated.error.message)
      ? await query(createAnonServerClient())
      : authenticated

  if (result.error) throw new Error(result.error.message)

  return result.data.map(g => ({
    ...g,
    layers: (g.layers ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
  }))
}

function isJwtKeyError(message: string) {
  return /no suitable key|wrong key type|jwt/i.test(message)
}

async function parseUploadedGeojson(file: File) {
  const text = await file.text()
  const geojson = parseFeatureCollection(text)
  return { text, geojson, bbox: computeBBox(geojson) }
}

export async function createLayer(formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()

  const file = formData.get('geojson') as File | null
  if (!file || file.size === 0) {
    throw new Error('Envie um arquivo GeoJSON.')
  }

  const layerId = crypto.randomUUID()
  const { text, bbox } = await parseUploadedGeojson(file)

  const path = `${layerId}.geojson`
  const { error: uploadError } = await supabase.storage
    .from('geojson')
    .upload(path, text, { contentType: 'application/json', upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const styleRaw = formData.get('style') as string | null
  const legendRaw = formData.get('legend') as string | null

  const payload: LayerInsert = {
    id: layerId,
    group_id: formData.get('group_id') as string,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    notes: (formData.get('notes') as string) || null,
    is_private: formData.get('is_private') === 'on',
    style: styleRaw ? (JSON.parse(styleRaw) as LayerStyle) : {},
    legend: legendRaw ? (JSON.parse(legendRaw) as LegendConfig) : {},
    geojson_storage_path: path,
    bbox,
  }

  const { error } = await supabase.from('layers').insert(payload)
  if (error) throw new Error(error.message)

  revalidateLayerPages()
  redirect('/dashboard/layers')
}

export async function updateLayer(id: string, formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()

  const file = formData.get('geojson') as File | null
  let storagePath: string | undefined
  let bbox: number[] | null | undefined

  if (file && file.size > 0) {
    const { text, bbox: nextBbox } = await parseUploadedGeojson(file)
    const path = `${id}.geojson`
    const { error: uploadError } = await supabase.storage
      .from('geojson')
      .upload(path, text, { contentType: 'application/json', upsert: true })

    if (uploadError) throw new Error(uploadError.message)
    storagePath = path
    bbox = nextBbox
  }

  const styleRaw = formData.get('style') as string | null
  const legendRaw = formData.get('legend') as string | null

  const payload: LayerUpdate = {
    group_id: formData.get('group_id') as string,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    notes: (formData.get('notes') as string) || null,
    is_private: formData.get('is_private') === 'on',
    updated_at: new Date().toISOString(),
    ...(styleRaw && { style: JSON.parse(styleRaw) as LayerStyle }),
    ...(legendRaw && { legend: JSON.parse(legendRaw) as LegendConfig }),
    ...(storagePath && { geojson_storage_path: storagePath }),
    ...(bbox !== undefined && { bbox }),
  }

  const { error } = await supabase.from('layers').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  revalidateLayerPages()
  redirect('/dashboard/layers')
}

export async function deleteLayer(id: string) {
  await requireAdmin()
  const supabase = createServiceClient()

  await supabase.storage.from('geojson').remove([`${id}.geojson`])

  const { error } = await supabase.from('layers').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidateLayerPages()
}
