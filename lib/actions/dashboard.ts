'use server'

import { getGroupsWithLayers } from '@/lib/actions/layers'
import { hasPublicProvenance } from '@/lib/provenance'
import { isAdminRole } from '@/lib/roles'
import { getRole } from '@/lib/roles.server'
import {
  createAnonServerClient,
  createServerClient,
  createServiceClient,
} from '@/lib/supabase/server'
import type { Group, Layer, SavedMap } from '@/lib/supabase/types'

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

export type DashboardRecentMap = {
  id: string
  title: string
  isPrivate: boolean
  layerCount: number
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
  mapCount: number
  groups: DashboardGroupSummary[]
  recentLayers: DashboardRecentLayer[]
  recentMaps: DashboardRecentMap[]
  missingGeojson: DashboardIncompleteLayer[]
  missingProvenance: DashboardIncompleteLayer[]
}

function isBlank(value: string | null) {
  return !value || value.trim().length === 0
}

function isJwtKeyError(message: string) {
  return /no suitable key|wrong key type|jwt/i.test(message)
}

function toRecentMaps(maps: SavedMap[]): DashboardRecentMap[] {
  return [...maps]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, RECENT_LIMIT)
    .map(map => ({
      id: map.id,
      title: map.title,
      isPrivate: map.is_private,
      layerCount: map.layers.length,
      updatedAt: map.updated_at,
    }))
}

function buildOverview(
  groups: Group[],
  layers: Layer[],
  maps: SavedMap[],
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
    mapCount: maps.length,
    groups: groups.map(group => ({
      id: group.id,
      title: group.title,
      isPrivate: group.is_private,
      layerCount: layers.filter(layer => layer.group_id === group.id).length,
    })),
    recentLayers,
    recentMaps: toRecentMaps(maps),
    missingGeojson: isAdmin
      ? layers
          .filter(layer => isBlank(layer.geojson_storage_path))
          .map(layer => ({ id: layer.id, title: layer.title }))
      : [],
    missingProvenance: isAdmin
      ? layers
          .filter(layer => !hasPublicProvenance(layer.provenance))
          .map(layer => ({ id: layer.id, title: layer.title }))
      : [],
  }
}

async function getPublicMaps(): Promise<SavedMap[]> {
  const query = (
    client:
      | ReturnType<typeof createServerClient>
      | ReturnType<typeof createAnonServerClient>
  ) =>
    client
      .from('maps')
      .select('*')
      .eq('is_private', false)
      .order('updated_at', { ascending: false })

  const authenticated = await query(createServerClient())
  const result =
    authenticated.error && isJwtKeyError(authenticated.error.message)
      ? await query(createAnonServerClient())
      : authenticated

  if (result.error) throw new Error(result.error.message)
  return (result.data ?? []) as SavedMap[]
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const isAdmin = isAdminRole(await getRole())

  if (isAdmin) {
    const supabase = createServiceClient()
    const [groupsResult, layersResult, mapsResult] = await Promise.all([
      supabase.from('groups').select('*').order('sort_order', {
        ascending: true,
      }),
      supabase.from('layers').select('*'),
      supabase.from('maps').select('*').order('updated_at', {
        ascending: false,
      }),
    ])

    if (groupsResult.error) throw new Error(groupsResult.error.message)
    if (layersResult.error) throw new Error(layersResult.error.message)
    if (mapsResult.error) throw new Error(mapsResult.error.message)

    return buildOverview(
      groupsResult.data,
      layersResult.data,
      mapsResult.data as SavedMap[],
      true
    )
  }

  const [nested, maps] = await Promise.all([
    getGroupsWithLayers(),
    getPublicMaps(),
  ])
  const groups = nested.map(({ layers: _layers, ...group }) => group)
  const layers = nested.flatMap(group => group.layers)

  return buildOverview(groups, layers, maps, false)
}
