export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  artmind: {
    Tables: {
      analysis_logs: {
        Row: {
          id: string
          user_id: string | null
          upload_id: string | null
          image_url: string
          analysis_result: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          upload_id?: string | null
          image_url: string
          analysis_result: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          upload_id?: string | null
          image_url?: string
          analysis_result?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'analysis_logs_upload_id_fkey'
            columns: ['upload_id']
            isOneToOne: false
            referencedRelation: 'uploads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'analysis_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      artwork_likes: {
        Row: {
          artwork_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          artwork_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          artwork_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'artwork_likes_artwork_id_fkey'
            columns: ['artwork_id']
            isOneToOne: false
            referencedRelation: 'artworks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'artwork_likes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      artworks: {
        Row: {
          id: string
          user_id: string
          title: string
          style: string
          image_url: string
          image_width: number | null
          image_height: number | null
          is_public: boolean
          status: Database['artmind']['Enums']['artwork_status']
          analysis_result: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          style: string
          image_url: string
          image_width?: number | null
          image_height?: number | null
          is_public?: boolean
          status?: Database['artmind']['Enums']['artwork_status']
          analysis_result?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          style?: string
          image_url?: string
          image_width?: number | null
          image_height?: number | null
          is_public?: boolean
          status?: Database['artmind']['Enums']['artwork_status']
          analysis_result?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'artworks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          role: Database['artmind']['Enums']['user_role']
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          role?: Database['artmind']['Enums']['user_role']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: Database['artmind']['Enums']['user_role']
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          id: string
          user_id: string | null
          temp_path: string
          expires_at: string
          saved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          temp_path: string
          expires_at: string
          saved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          temp_path?: string
          expires_at?: string
          saved?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'uploads_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      artwork_status: 'draft' | 'pending' | 'published' | 'rejected'
      user_role: 'user' | 'moderator' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'artmind'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never
