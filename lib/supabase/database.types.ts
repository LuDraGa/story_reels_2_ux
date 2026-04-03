export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      heartbeat_log: {
        Row: {
          id: number
          pinged_at: string
        }
        Insert: {
          id?: number
          pinged_at?: string
        }
        Update: {
          id?: number
          pinged_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      heartbeat: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  story_reels: {
    Tables: {
      audio_assets: {
        Row: {
          created_at: string
          duration_sec: number | null
          id: string
          mode: string
          project_id: string
          speaker_id: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          mode: string
          project_id: string
          speaker_id?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          mode?: string
          project_id?: string
          speaker_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      background_assets: {
        Row: {
          created_at: string
          duration_sec: number | null
          id: string
          name: string
          storage_path: string
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          name: string
          storage_path: string
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          name?: string
          storage_path?: string
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          logs: string | null
          progress: number | null
          project_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          logs?: string | null
          progress?: number | null
          project_id?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          logs?: string | null
          progress?: number | null
          project_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      script_versions: {
        Row: {
          created_at: string
          estimated_duration_sec: number | null
          id: string
          project_id: string
          structure_json: Json | null
          text: string
        }
        Insert: {
          created_at?: string
          estimated_duration_sec?: number | null
          id?: string
          project_id: string
          structure_json?: Json | null
          text: string
        }
        Update: {
          created_at?: string
          estimated_duration_sec?: number | null
          id?: string
          project_id?: string
          structure_json?: Json | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      source_items: {
        Row: {
          captured_at: string | null
          community: string | null
          id: string
          original_author: string | null
          platform: string | null
          project_id: string
          raw_text: string | null
          url: string | null
        }
        Insert: {
          captured_at?: string | null
          community?: string | null
          id?: string
          original_author?: string | null
          platform?: string | null
          project_id: string
          raw_text?: string | null
          url?: string | null
        }
        Update: {
          captured_at?: string | null
          community?: string | null
          id?: string
          original_author?: string | null
          platform?: string | null
          project_id?: string
          raw_text?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      video_assets: {
        Row: {
          background_asset_id: string | null
          created_at: string
          id: string
          project_id: string
          render_settings_json: Json | null
          srt_path: string | null
          storage_path: string
        }
        Insert: {
          background_asset_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          render_settings_json?: Json | null
          srt_path?: string | null
          storage_path: string
        }
        Update: {
          background_asset_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          render_settings_json?: Json | null
          srt_path?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_assets_background_asset_id_fkey"
            columns: ["background_asset_id"]
            isOneToOne: false
            referencedRelation: "background_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
  story_reels: {
    Enums: {},
  },
} as const
