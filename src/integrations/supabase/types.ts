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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      analysis_history: {
        Row: {
          confidence_percentage: number | null
          created_at: string
          eeg_data: Json
          id: string
          module_type: string
          notes: string | null
          recommendations: string[] | null
          results: Json
          signal_quality_score: number | null
          subject_details: Json | null
          subject_name: string
          user_id: string
        }
        Insert: {
          confidence_percentage?: number | null
          created_at?: string
          eeg_data: Json
          id?: string
          module_type: string
          notes?: string | null
          recommendations?: string[] | null
          results: Json
          signal_quality_score?: number | null
          subject_details?: Json | null
          subject_name: string
          user_id: string
        }
        Update: {
          confidence_percentage?: number | null
          created_at?: string
          eeg_data?: Json
          id?: string
          module_type?: string
          notes?: string | null
          recommendations?: string[] | null
          results?: Json
          signal_quality_score?: number | null
          subject_details?: Json | null
          subject_name?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_history: {
        Row: {
          created_at: string
          energy_level: number
          focus_level: number
          id: string
          mood: string
          mood_score: number
          notes: string | null
          source: string | null
          stress_level: number
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level?: number
          focus_level?: number
          id?: string
          mood: string
          mood_score?: number
          notes?: string | null
          source?: string | null
          stress_level?: number
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number
          focus_level?: number
          id?: string
          mood?: string
          mood_score?: number
          notes?: string | null
          source?: string | null
          stress_level?: number
          user_id?: string
        }
        Relationships: []
      }
      multimodal_sessions: {
        Row: {
          burnout_risk: string | null
          created_at: string
          eeg_data: Json | null
          explainability: Json | null
          facial_confidence: number | null
          facial_details: Json | null
          facial_emotion: string | null
          fusion_result: Json | null
          id: string
          mental_state: string | null
          mental_state_scores: Json | null
          neurosphere_score: number | null
          recommendations: string[] | null
          session_type: string
          user_id: string
          voice_emotion: string | null
          voice_features: Json | null
          voice_stress_score: number | null
        }
        Insert: {
          burnout_risk?: string | null
          created_at?: string
          eeg_data?: Json | null
          explainability?: Json | null
          facial_confidence?: number | null
          facial_details?: Json | null
          facial_emotion?: string | null
          fusion_result?: Json | null
          id?: string
          mental_state?: string | null
          mental_state_scores?: Json | null
          neurosphere_score?: number | null
          recommendations?: string[] | null
          session_type?: string
          user_id: string
          voice_emotion?: string | null
          voice_features?: Json | null
          voice_stress_score?: number | null
        }
        Update: {
          burnout_risk?: string | null
          created_at?: string
          eeg_data?: Json | null
          explainability?: Json | null
          facial_confidence?: number | null
          facial_details?: Json | null
          facial_emotion?: string | null
          fusion_result?: Json | null
          id?: string
          mental_state?: string | null
          mental_state_scores?: Json | null
          neurosphere_score?: number | null
          recommendations?: string[] | null
          session_type?: string
          user_id?: string
          voice_emotion?: string | null
          voice_features?: Json | null
          voice_stress_score?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
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
} as const
