'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getProvenanceVocabularies } from '@/lib/actions/vocabularies'
import { computeBBox, parseFeatureCollection } from '@/lib/geojson'
import { normalizeProvenance } from '@/lib/provenance'
import { canReadPrivate, requireAdmin } from '@/lib/roles.server'
import {
  createAnonServerClient,
  createServerClient,
  createServiceClient,
} from '@/lib/supabase/server'
import type {
  Group,
  Layer,
  LayerGroupInsert,
  LayerInsert,
  LayerPopupConfig,
  LayerProvenance,
  LayerStyle,
  LayerUpdate,
  LayerWithGroups,
  LegendConfig,
} from '@/lib/supabase/types'

const LAYER_WITH_GROUPS_SELECT = '*, groups(id, title)'

type GroupWithLayersRow = Group & { layers: Layer[] | null }

function revalidateLayerPages() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/layers')
  revalidatePath('/dashboard/groups', 'layout')
  revalidatePath('/geoportal')
}

export async function getLayers(groupId?: string): Promise<LayerWithGroups[]> {
  await requireAdmin()
  const supabase = createServiceClient()

  // Filtering happens on the join table instead of an inner join on `groups`,
  // so each layer still carries every group it belongs to.
  let layerIds: string[] | undefined
  if (groupId) {
    const { data, error } = await supabase
      .from('layer_groups')
      .select('layer_id')
      .eq('group_id', groupId)

    if (error) throw new Error(error.message)
    layerIds = (data ?? []).map(row => row.layer_id)
    if (layerIds.length === 0) return []
  }

  const query = supabase
    .from('layers')
    .select(LAYER_WITH_GROUPS_SELECT)
    .order('sort_order', { ascending: true })

  const { data, error } = await (layerIds ? query.in('id', layerIds) : query)

  if (error) throw new Error(error.message)
  return data as LayerWithGroups[]
}

export async function getLayer(id: string): Promise<LayerWithGroups> {
  await requireAdmin()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('layers')
    .select(LAYER_WITH_GROUPS_SELECT)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as LayerWithGroups
}

export async function getGroupsWithLayers() {
  const privileged = await canReadPrivate()

  const query = (
    client:
      | ReturnType<typeof createServerClient>
      | ReturnType<typeof createServiceClient>
      | ReturnType<typeof createAnonServerClient>
  ) =>
    client.from('groups').select('*, layers(*)').order('sort_order', {
      ascending: true,
    })

  // Org roles come from Clerk (canReadPrivate). Session JWT often lacks
  // user_role for Supabase RLS, so privileged members bypass RLS via service
  // client.
  let result
  if (privileged) {
    result = await query(createServiceClient())
  } else {
    const authenticated = await query(createServerClient())
    result =
      authenticated.error && isJwtKeyError(authenticated.error.message)
        ? await query(createAnonServerClient())
        : authenticated
  }

  if (result.error) throw new Error(result.error.message)

  // supabase-js cannot infer the many-to-many embed through layer_groups, so
  // the shape PostgREST returns is declared here.
  const rows = (result.data ?? []) as unknown as GroupWithLayersRow[]

  return rows.map(g => ({
    ...g,
    layers: (g.layers ?? [])
      .map(layer => ({
        ...layer,
        provenance: layer.provenance ?? {},
        popup: layer.popup ?? {},
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  }))
}

function isJwtKeyError(message: string) {
  return /no suitable key|wrong key type|jwt/i.test(message)
}

function parseJsonField<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== 'string' || raw.length === 0) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function parseProvenanceField(raw: FormDataEntryValue | null) {
  const parsed = parseJsonField<LayerProvenance>(raw, {})
  return normalizeProvenance(parsed, await getProvenanceVocabularies())
}

async function parseUploadedGeojson(file: File) {
  const text = await file.text()
  const geojson = parseFeatureCollection(text)
  return { text, geojson, bbox: computeBBox(geojson) }
}

function parseGroupIds(formData: FormData) {
  const groupIds = [
    ...new Set(
      formData
        .getAll('group_ids')
        .filter((value): value is string => typeof value === 'string')
        .filter(value => value.length > 0)
    ),
  ]

  if (groupIds.length === 0) {
    throw new Error('Selecione ao menos um grupo.')
  }

  return groupIds
}

async function setLayerGroups(
  supabase: ReturnType<typeof createServiceClient>,
  layerId: string,
  groupIds: string[]
) {
  const { error: deleteError } = await supabase
    .from('layer_groups')
    .delete()
    .eq('layer_id', layerId)

  if (deleteError) throw new Error(deleteError.message)

  const rows: LayerGroupInsert[] = groupIds.map(groupId => ({
    layer_id: layerId,
    group_id: groupId,
  }))

  const { error } = await supabase.from('layer_groups').insert(rows)
  if (error) throw new Error(error.message)
}

export async function createLayer(formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()

  const file = formData.get('geojson') as File | null
  if (!file || file.size === 0) {
    throw new Error('Envie um arquivo GeoJSON.')
  }

  const groupIds = parseGroupIds(formData)
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
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    notes: (formData.get('notes') as string) || null,
    is_private: formData.get('is_private') === 'on',
    style: styleRaw ? (JSON.parse(styleRaw) as LayerStyle) : {},
    legend: legendRaw ? (JSON.parse(legendRaw) as LegendConfig) : {},
    provenance: await parseProvenanceField(formData.get('provenance')),
    popup: parseJsonField<LayerPopupConfig>(formData.get('popup'), {}),
    geojson_storage_path: path,
    bbox,
  }

  const { error } = await supabase.from('layers').insert(payload)
  if (error) throw new Error(error.message)

  await setLayerGroups(supabase, layerId, groupIds)

  revalidateLayerPages()
  redirect('/dashboard/layers')
}

export async function updateLayer(id: string, formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()

  const groupIds = parseGroupIds(formData)
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
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    notes: (formData.get('notes') as string) || null,
    is_private: formData.get('is_private') === 'on',
    provenance: await parseProvenanceField(formData.get('provenance')),
    popup: parseJsonField<LayerPopupConfig>(formData.get('popup'), {}),
    updated_at: new Date().toISOString(),
    ...(styleRaw && { style: JSON.parse(styleRaw) as LayerStyle }),
    ...(legendRaw && { legend: JSON.parse(legendRaw) as LegendConfig }),
    ...(storagePath && { geojson_storage_path: storagePath }),
    ...(bbox !== undefined && { bbox }),
  }

  const { error } = await supabase.from('layers').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  await setLayerGroups(supabase, id, groupIds)

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
