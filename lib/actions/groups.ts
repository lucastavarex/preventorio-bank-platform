'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/roles.server'
import { createServiceClient } from '@/lib/supabase/server'
import type { GroupInsert, GroupUpdate } from '@/lib/supabase/types'

function revalidateGroupPages() {
  revalidatePath('/dashboard/groups')
  revalidatePath('/dashboard/layers')
  revalidatePath('/geoportal')
}

export async function getGroups() {
  await requireAdmin()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getGroup(id: string) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createGroup(formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()

  const payload: GroupInsert = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    notes: (formData.get('notes') as string) || null,
    is_private: formData.get('is_private') === 'on',
  }

  const { error } = await supabase.from('groups').insert(payload)
  if (error) throw new Error(error.message)

  revalidateGroupPages()
  redirect('/dashboard/groups')
}

export async function updateGroup(id: string, formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()

  const payload: GroupUpdate = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    notes: (formData.get('notes') as string) || null,
    is_private: formData.get('is_private') === 'on',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('groups').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  revalidateGroupPages()
  redirect('/dashboard/groups')
}

export async function deleteGroup(id: string) {
  await requireAdmin()
  const supabase = createServiceClient()

  const { data: layers, error: layersError } = await supabase
    .from('layers')
    .select('geojson_storage_path')
    .eq('group_id', id)

  if (layersError) throw new Error(layersError.message)

  const storagePaths = (layers ?? [])
    .map(layer => layer.geojson_storage_path)
    .filter((path): path is string => Boolean(path))

  if (storagePaths.length > 0) {
    await supabase.storage.from('geojson').remove(storagePaths)
  }

  const { error } = await supabase.from('groups').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidateGroupPages()
}
