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
          group_id: string
          title: string
          description: string | null
          notes: string | null
          is_private: boolean
          style: LayerStyle
          legend: LegendConfig
          geojson_storage_path: string | null
          bbox: number[] | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          description?: string | null
          notes?: string | null
          is_private?: boolean
          style?: LayerStyle
          legend?: LegendConfig
          geojson_storage_path?: string | null
          bbox?: number[] | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          description?: string | null
          notes?: string | null
          is_private?: boolean
          style?: LayerStyle
          legend?: LegendConfig
          geojson_storage_path?: string | null
          bbox?: number[] | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'layers_group_id_fkey'
            columns: ['group_id']
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
        ]
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

export type GraduatedClassify = {
  property: string
  palette?: string
  classes: ClassifyClass[]
}

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
  classify?: GraduatedClassify
}

export type LegendConfig = {
  items?: LegendItem[]
}

export type LegendItem = {
  label: string
  color: string
  type?: 'fill' | 'line' | 'circle'
}

export type Group = Database['public']['Tables']['groups']['Row']
export type Layer = Database['public']['Tables']['layers']['Row']
export type LayerWithGroup = Layer & {
  groups: Pick<Group, 'title'> | null
}
export type GroupInsert = Database['public']['Tables']['groups']['Insert']
export type LayerInsert = Database['public']['Tables']['layers']['Insert']
export type GroupUpdate = Database['public']['Tables']['groups']['Update']
export type LayerUpdate = Database['public']['Tables']['layers']['Update']
