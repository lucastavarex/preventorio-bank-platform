'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canReadPrivate, requireAdmin } from '@/lib/roles.server'
import {
  createAnonServerClient,
  createServerClient,
  createServiceClient,
} from '@/lib/supabase/server'
import type {
  MapInsert,
  MapUpdate,
  SavedMap,
  SavedMapCamera,
  SavedMapLayer,
} from '@/lib/supabase/types'

function revalidateMapPages() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/maps')
  revalidatePath('/geoportal')
}

function parseJsonField<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== 'string' || raw.length === 0) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function parseMapPayload(formData: FormData) {
  const layers = parseJsonField<SavedMapLayer[]>(formData.get('layers'), [])
  const camera = parseJsonField<SavedMapCamera>(formData.get('camera'), {})

  return {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    notes: (formData.get('notes') as string) || null,
    is_private: formData.get('is_private') === 'on',
    basemap_id: (formData.get('basemap_id') as string) || 'streets',
    camera,
    layers: layers.filter(layer => Boolean(layer.id)),
  }
}

function isJwtKeyError(message: string) {
  return /no suitable key|wrong key type|jwt/i.test(message)
}

export async function getMaps(): Promise<SavedMap[]> {
  await requireAdmin()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as SavedMap[]
}

export async function getMap(id: string): Promise<SavedMap> {
  await requireAdmin()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as SavedMap
}

export async function getMapForViewer(id: string): Promise<SavedMap | null> {
  const privileged = await canReadPrivate()
  const query = (
    client:
      | ReturnType<typeof createServerClient>
      | ReturnType<typeof createServiceClient>
      | ReturnType<typeof createAnonServerClient>
  ) => client.from('maps').select('*').eq('id', id).maybeSingle()

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
  const map = result.data as SavedMap | null
  if (!map) return null
  if (map.is_private && !privileged) return null
  return map
}

export async function createMap(formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()
  const payload: MapInsert = parseMapPayload(formData)

  const { error } = await supabase.from('maps').insert(payload)
  if (error) throw new Error(error.message)

  revalidateMapPages()
  redirect('/dashboard/maps')
}

export async function updateMap(id: string, formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()
  const parsed = parseMapPayload(formData)
  const payload: MapUpdate = {
    ...parsed,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('maps').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  revalidateMapPages()
  redirect('/dashboard/maps')
}

export async function deleteMap(id: string) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase.from('maps').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidateMapPages()
}
