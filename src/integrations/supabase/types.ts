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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      listings: {
        Row: {
          accessibility: string | null
          band: string
          contact_note: string | null
          cost: number
          created_at: string
          creator_id: string
          currency: string
          data_quality: string
          details: string[]
          give: string | null
          id: string
          kind: string
          layer: string
          minutes: number
          neighbourhood: string
          outdoors: boolean
          people_needed: number | null
          place: string
          skills: string[]
          social: string
          status: string
          summary: string
          title: string
          updated_at: string
          when_text: string
          x: number
          y: number
        }
        Insert: {
          accessibility?: string | null
          band?: string
          contact_note?: string | null
          cost?: number
          created_at?: string
          creator_id: string
          currency?: string
          data_quality?: string
          details?: string[]
          give?: string | null
          id?: string
          kind: string
          layer: string
          minutes?: number
          neighbourhood?: string
          outdoors?: boolean
          people_needed?: number | null
          place?: string
          skills?: string[]
          social?: string
          status?: string
          summary?: string
          title: string
          updated_at?: string
          when_text?: string
          x?: number
          y?: number
        }
        Update: {
          accessibility?: string | null
          band?: string
          contact_note?: string | null
          cost?: number
          created_at?: string
          creator_id?: string
          currency?: string
          data_quality?: string
          details?: string[]
          give?: string | null
          id?: string
          kind?: string
          layer?: string
          minutes?: number
          neighbourhood?: string
          outdoors?: boolean
          people_needed?: number | null
          place?: string
          skills?: string[]
          social?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          when_text?: string
          x?: number
          y?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          can_offer: string[]
          can_teach: string[]
          created_at: string
          discoverable: boolean
          display_name: string
          id: string
          interests: string[]
          intro: string
          languages: string[]
          location: string
          photo_url: string | null
          updated_at: string
          wants_to_learn: string[]
          would_love_to: string[]
        }
        Insert: {
          can_offer?: string[]
          can_teach?: string[]
          created_at?: string
          discoverable?: boolean
          display_name?: string
          id: string
          interests?: string[]
          intro?: string
          languages?: string[]
          location?: string
          photo_url?: string | null
          updated_at?: string
          wants_to_learn?: string[]
          would_love_to?: string[]
        }
        Update: {
          can_offer?: string[]
          can_teach?: string[]
          created_at?: string
          discoverable?: boolean
          display_name?: string
          id?: string
          interests?: string[]
          intro?: string
          languages?: string[]
          location?: string
          photo_url?: string | null
          updated_at?: string
          wants_to_learn?: string[]
          would_love_to?: string[]
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          category: string
          created_at: string
          id: string
          note: string | null
          ref: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          ref: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          ref?: string
          user_id?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
