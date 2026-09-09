export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          title: string
          description: string | null
          notes: string | null
          is_private: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          notes?: string | null
          is_private?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          notes?: string | null
          is_private?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      layers: {
        Row: {
          id: string
          title: string
          description: string | null
          notes: string | null
          is_private: boolean
          style: LayerStyle
          legend: LegendConfig
          provenance: LayerProvenance
          popup: LayerPopupConfig
          geojson_storage_path: string | null
          bbox: number[] | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          notes?: string | null
          is_private?: boolean
          style?: LayerStyle
          legend?: LegendConfig
          provenance?: LayerProvenance
          popup?: LayerPopupConfig
          geojson_storage_path?: string | null
          bbox?: number[] | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          notes?: string | null
          is_private?: boolean
          style?: LayerStyle
          legend?: LegendConfig
          provenance?: LayerProvenance
          popup?: LayerPopupConfig
          geojson_storage_path?: string | null
          bbox?: number[] | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      layer_groups: {
        Row: {
          layer_id: string
          group_id: string
        }
        Insert: {
          layer_id: string
          group_id: string
        }
        Update: {
          layer_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'layer_groups_layer_id_fkey'
            columns: ['layer_id']
            referencedRelation: 'layers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'layer_groups_group_id_fkey'
            columns: ['group_id']
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
        ]
      }
      maps: {
        Row: {
          id: string
          title: string
          description: string | null
          notes: string | null
          is_private: boolean
          basemap_id: string
          camera: SavedMapCamera
          layers: SavedMapLayer[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          notes?: string | null
          is_private?: boolean
          basemap_id?: string
          camera?: SavedMapCamera
          layers?: SavedMapLayer[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          notes?: string | null
          is_private?: boolean
          basemap_id?: string
          camera?: SavedMapCamera
          layers?: SavedMapLayer[]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type ClassifyClass = {
  min: number
  max: number
  color: string
  label: string
  visible?: boolean
}

export type CategoricalClass = {
  value: string
  color: string
  label: string
  visible?: boolean
}

export type GraduatedClassify = {
  mode?: 'graduated'
  property: string
  palette?: string
  classes: ClassifyClass[]
}

export type CategoricalClassify = {
  mode: 'categorical'
  property: string
  palette?: string
  classes: CategoricalClass[]
}

export type LayerClassify = GraduatedClassify | CategoricalClassify

export type LayerStyle = {
  type?: 'fill' | 'line' | 'circle'
  fillColor?: string
  fillOpacity?: number
  strokeColor?: string
  strokeWidth?: number
  strokeOpacity?: number
  circleRadius?: number
  circleColor?: string
  circleOpacity?: number
  classify?: LayerClassify
}

export type LegendConfig = {
  items?: LegendItem[]
}

export type LegendItem = {
  label: string
  color: string
  type?: 'fill' | 'line' | 'circle'
}

export type ProvenanceSource = 'osm' | 'kobo' | 'workshop' | 'qgis' | 'other'
export type ProvenanceTheme =
  | 'physical_vulnerability'
  | 'risk_perception'
  | 'infrastructure'
  | 'overlay'
  | 'other'
export type ProvenanceHazard =
  | 'landslide'
  | 'rockfall'
  | 'hydrological'
  | 'none'
export type ParticipationLevel = 'low' | 'medium' | 'high'

export type LayerProvenance = {
  source?: ProvenanceSource
  sourceDetail?: string
  period?: string
  producers?: string
  theme?: ProvenanceTheme
  hazard?: ProvenanceHazard
  participationLevel?: ParticipationLevel
  license?: string
  usageRestriction?: string
}

export type LayerPopupField = {
  key: string
  label?: string
}

export type LayerPopupConfig = {
  fields?: LayerPopupField[]
  imageField?: string
}

export type SavedMapLayer = {
  id: string
  opacity?: number
}

export type SavedMapCamera = {
  longitude?: number
  latitude?: number
  zoom?: number
  bearing?: number
  pitch?: number
}

export type Group = Database['public']['Tables']['groups']['Row']
export type Layer = Database['public']['Tables']['layers']['Row']
export type SavedMap = Database['public']['Tables']['maps']['Row']
export type LayerGroupRef = Pick<Group, 'id' | 'title'>
export type LayerWithGroups = Layer & {
  groups: LayerGroupRef[]
}
export type GroupInsert = Database['public']['Tables']['groups']['Insert']
export type LayerInsert = Database['public']['Tables']['layers']['Insert']
export type LayerGroupInsert =
  Database['public']['Tables']['layer_groups']['Insert']
export type MapInsert = Database['public']['Tables']['maps']['Insert']
export type GroupUpdate = Database['public']['Tables']['groups']['Update']
export type LayerUpdate = Database['public']['Tables']['layers']['Update']
export type MapUpdate = Database['public']['Tables']['maps']['Update']
