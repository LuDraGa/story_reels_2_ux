// This file will be generated from Supabase once schema is created
// For now, placeholder types

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
      projects: {
        Row: {
          id: string
          user_id: string | null
          title: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          status?: string
          created_at?: string
        }
      }
      source_items: {
        Row: {
          id: string
          project_id: string
          raw_text: string
          platform: string | null
          url: string | null
          community: string | null
          original_author: string | null
          captured_at: string
        }
        Insert: {
          id?: string
          project_id: string
          raw_text: string
          platform?: string | null
          url?: string | null
          community?: string | null
          original_author?: string | null
          captured_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          raw_text?: string
          platform?: string | null
          url?: string | null
          community?: string | null
          original_author?: string | null
          captured_at?: string
        }
      }
      script_versions: {
        Row: {
          id: string
          project_id: string
          text: string
          structure_json: Json | null
          estimated_duration_sec: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          text: string
          structure_json?: Json | null
          estimated_duration_sec?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          text?: string
          structure_json?: Json | null
          estimated_duration_sec?: number | null
          created_at?: string
        }
      }
      audio_assets: {
        Row: {
          id: string
          project_id: string
          mode: string
          speaker_id: string | null
          storage_path: string
          duration_sec: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          mode: string
          speaker_id?: string | null
          storage_path: string
          duration_sec?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          mode?: string
          speaker_id?: string | null
          storage_path?: string
          duration_sec?: number | null
          created_at?: string
        }
      }
      video_assets: {
        Row: {
          id: string
          project_id: string
          background_asset_id: string | null
          storage_path: string
          srt_path: string | null
          render_settings_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          background_asset_id?: string | null
          storage_path: string
          srt_path?: string | null
          render_settings_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          background_asset_id?: string | null
          storage_path?: string
          srt_path?: string | null
          render_settings_json?: Json | null
          created_at?: string
        }
      }
      background_assets: {
        Row: {
          id: string
          user_id: string | null
          name: string
          tags: string[]
          storage_path: string
          duration_sec: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          tags?: string[]
          storage_path: string
          duration_sec?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          tags?: string[]
          storage_path?: string
          duration_sec?: number | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          project_id: string | null
          type: string
          status: string
          progress: number
          error: string | null
          logs: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          type: string
          status?: string
          progress?: number
          error?: string | null
          logs?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          type?: string
          status?: string
          progress?: number
          error?: string | null
          logs?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
