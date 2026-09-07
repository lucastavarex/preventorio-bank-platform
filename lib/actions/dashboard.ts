'use server'

import { getGroupsWithLayers } from '@/lib/actions/layers'
import { isAdminRole } from '@/lib/roles'
import { getRole } from '@/lib/roles.server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Group, Layer } from '@/lib/supabase/types'

const RECENT_LIMIT = 5

export type DashboardGroupSummary = {
  id: string
  title: string
  isPrivate: boolean
  layerCount: number
}

export type DashboardRecentLayer = {
  id: string
  title: string
  groupId: string
  groupTitle: string | null
  isPrivate: boolean
  updatedAt: string
}

export type DashboardIncompleteLayer = {
  id: string
  title: string
}

export type DashboardOverview = {
  isAdmin: boolean
  groupCount: number
  layerCount: number
  publicLayerCount: number
  privateLayerCount: number
  groups: DashboardGroupSummary[]
  recentLayers: DashboardRecentLayer[]
  missingGeojson: DashboardIncompleteLayer[]
  missingDescription: DashboardIncompleteLayer[]
}

function isBlank(value: string | null) {
  return !value || value.trim().length === 0
}

function buildOverview(
  groups: Group[],
  layers: Layer[],
  isAdmin: boolean
): DashboardOverview {
  const groupTitleById = new Map(groups.map(group => [group.id, group.title]))

  const recentLayers = [...layers]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, RECENT_LIMIT)
    .map(layer => ({
      id: layer.id,
      title: layer.title,
      groupId: layer.group_id,
      groupTitle: groupTitleById.get(layer.group_id) ?? null,
      isPrivate: layer.is_private,
      updatedAt: layer.updated_at,
    }))

  return {
    isAdmin,
    groupCount: groups.length,
    layerCount: layers.length,
    publicLayerCount: layers.filter(layer => !layer.is_private).length,
    privateLayerCount: layers.filter(layer => layer.is_private).length,
    groups: groups.map(group => ({
      id: group.id,
      title: group.title,
      isPrivate: group.is_private,
      layerCount: layers.filter(layer => layer.group_id === group.id).length,
    })),
    recentLayers,
    missingGeojson: isAdmin
      ? layers
          .filter(layer => isBlank(layer.geojson_storage_path))
          .map(layer => ({ id: layer.id, title: layer.title }))
      : [],
    missingDescription: isAdmin
      ? layers
          .filter(layer => isBlank(layer.description))
          .map(layer => ({ id: layer.id, title: layer.title }))
      : [],
  }
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const isAdmin = isAdminRole(await getRole())

  if (isAdmin) {
    const supabase = createServiceClient()
    const [groupsResult, layersResult] = await Promise.all([
      supabase.from('groups').select('*').order('sort_order', {
        ascending: true,
      }),
      supabase.from('layers').select('*'),
    ])

    if (groupsResult.error) throw new Error(groupsResult.error.message)
    if (layersResult.error) throw new Error(layersResult.error.message)

    return buildOverview(groupsResult.data, layersResult.data, true)
  }

  const nested = await getGroupsWithLayers()
  const groups = nested.map(({ layers: _layers, ...group }) => group)
  const layers = nested.flatMap(group => group.layers)

  return buildOverview(groups, layers, false)
}
