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
      availability_windows: {
        Row: {
          created_at: string
          ends_at: string
          expires_at: string | null
          id: string
          last_confirmed_at: string
          note: string
          recurrence: string
          starts_at: string
          timezone: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          expires_at?: string | null
          id?: string
          last_confirmed_at?: string
          note?: string
          recurrence?: string
          starts_at: string
          timezone?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          expires_at?: string | null
          id?: string
          last_confirmed_at?: string
          note?: string
          recurrence?: string
          starts_at?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      connection_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          context_place: string
          context_title: string
          context_when: string
          created_at: string
          direction: string
          id: string
          need_id: string
          note: string
          recipient_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          context_place?: string
          context_title?: string
          context_when?: string
          created_at?: string
          direction?: string
          id?: string
          need_id: string
          note?: string
          recipient_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          context_place?: string
          context_title?: string
          context_when?: string
          created_at?: string
          direction?: string
          id?: string
          need_id?: string
          note?: string
          recipient_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          id: string
          note: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          resolution: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subject_id: string
          subject_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          resolution?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subject_id: string
          subject_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          resolution?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subject_id?: string
          subject_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contribution_preferences: {
        Row: {
          contribution: string
          created_at: string
          id: string
          note: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          contribution: string
          created_at?: string
          id?: string
          note?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          contribution?: string
          created_at?: string
          id?: string
          note?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      hour_offers: {
        Row: {
          created_at: string
          detail: string
          direction: string
          id: string
          minutes: number
          neighbourhood: string
          place_id: string | null
          skills: string[]
          status: string
          title: string
          updated_at: string
          user_id: string
          when_text: string
        }
        Insert: {
          created_at?: string
          detail?: string
          direction?: string
          id?: string
          minutes?: number
          neighbourhood?: string
          place_id?: string | null
          skills?: string[]
          status?: string
          title: string
          updated_at?: string
          user_id: string
          when_text?: string
        }
        Update: {
          created_at?: string
          detail?: string
          direction?: string
          id?: string
          minutes?: number
          neighbourhood?: string
          place_id?: string | null
          skills?: string[]
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          when_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "hour_offers_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_places: {
        Row: {
          arrives_at: string | null
          created_at: string
          departs_at: string | null
          id: string
          journey_id: string
          place_id: string
          position: number
          updated_at: string
        }
        Insert: {
          arrives_at?: string | null
          created_at?: string
          departs_at?: string | null
          id?: string
          journey_id: string
          place_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          arrives_at?: string | null
          created_at?: string
          departs_at?: string | null
          id?: string
          journey_id?: string
          place_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_places_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          created_at: string
          ends_at: string | null
          expires_at: string | null
          id: string
          last_confirmed_at: string
          opportunity_opt_in: boolean
          owner_id: string
          starts_at: string | null
          status: string
          timezone: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          expires_at?: string | null
          id?: string
          last_confirmed_at?: string
          opportunity_opt_in?: boolean
          owner_id: string
          starts_at?: string | null
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          expires_at?: string | null
          id?: string
          last_confirmed_at?: string
          opportunity_opt_in?: boolean
          owner_id?: string
          starts_at?: string | null
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      listing_photos: {
        Row: {
          alt_text: string
          created_at: string
          credit: string
          id: string
          image_url: string
          listing_id: string
          position: number
          source_url: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          credit?: string
          id?: string
          image_url: string
          listing_id: string
          position?: number
          source_url: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          credit?: string
          id?: string
          image_url?: string
          listing_id?: string
          position?: number
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accessibility: string | null
          band: string
          booking_state: string
          booking_url: string
          cancellation: string
          contact_note: string | null
          cost: number
          created_at: string
          creator_id: string | null
          currency: string
          data_quality: string
          demonstration: boolean
          details: string[]
          ends_at: string | null
          give: string | null
          id: string
          imported_at: string | null
          kind: string
          last_checked_at: string | null
          lat: number | null
          layer: string
          lng: number | null
          minutes: number
          neighbourhood: string
          organisation: string
          organiser: string
          origin: string
          outdoors: boolean
          people_needed: number | null
          place: string
          place_id: string | null
          provider_note: string
          qualification_note: string
          recurrence: string
          service_category: string | null
          skills: string[]
          social: string
          starts_at: string | null
          status: string
          summary: string
          ticket_url: string
          timezone: string
          title: string
          updated_at: string
          when_text: string
          x: number
          y: number
        }
        Insert: {
          accessibility?: string | null
          band?: string
          booking_state?: string
          booking_url?: string
          cancellation?: string
          contact_note?: string | null
          cost?: number
          created_at?: string
          creator_id?: string | null
          currency?: string
          data_quality?: string
          demonstration?: boolean
          details?: string[]
          ends_at?: string | null
          give?: string | null
          id?: string
          imported_at?: string | null
          kind: string
          last_checked_at?: string | null
          lat?: number | null
          layer: string
          lng?: number | null
          minutes?: number
          neighbourhood?: string
          organisation?: string
          organiser?: string
          origin?: string
          outdoors?: boolean
          people_needed?: number | null
          place?: string
          place_id?: string | null
          provider_note?: string
          qualification_note?: string
          recurrence?: string
          service_category?: string | null
          skills?: string[]
          social?: string
          starts_at?: string | null
          status?: string
          summary?: string
          ticket_url?: string
          timezone?: string
          title: string
          updated_at?: string
          when_text?: string
          x?: number
          y?: number
        }
        Update: {
          accessibility?: string | null
          band?: string
          booking_state?: string
          booking_url?: string
          cancellation?: string
          contact_note?: string | null
          cost?: number
          created_at?: string
          creator_id?: string | null
          currency?: string
          data_quality?: string
          demonstration?: boolean
          details?: string[]
          ends_at?: string | null
          give?: string | null
          id?: string
          imported_at?: string | null
          kind?: string
          last_checked_at?: string | null
          lat?: number | null
          layer?: string
          lng?: number | null
          minutes?: number
          neighbourhood?: string
          organisation?: string
          organiser?: string
          origin?: string
          outdoors?: boolean
          people_needed?: number | null
          place?: string
          place_id?: string | null
          provider_note?: string
          qualification_note?: string
          recurrence?: string
          service_category?: string | null
          skills?: string[]
          social?: string
          starts_at?: string | null
          status?: string
          summary?: string
          ticket_url?: string
          timezone?: string
          title?: string
          updated_at?: string
          when_text?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      needs: {
        Row: {
          budget: number | null
          budget_max: number | null
          category: string
          contact_preference: string
          created_at: string
          creator_id: string
          currency: string
          description: string
          duration_minutes: number | null
          ends_at: string | null
          expires_at: string | null
          flexibility: string
          id: string
          intent: string
          last_confirmed_at: string
          lat: number | null
          lng: number | null
          payment_model: string
          payment_type: string
          place_id: string | null
          place_text: string
          preferred_experience: string
          recurring: boolean
          required_qualifications: string[]
          required_roles: string[]
          required_skills: string[]
          starts_at: string | null
          status: string
          timezone: string
          title: string
          updated_at: string
          urgency: string
          visibility: string
        }
        Insert: {
          budget?: number | null
          budget_max?: number | null
          category: string
          contact_preference?: string
          created_at?: string
          creator_id: string
          currency?: string
          description?: string
          duration_minutes?: number | null
          ends_at?: string | null
          expires_at?: string | null
          flexibility?: string
          id?: string
          intent?: string
          last_confirmed_at?: string
          lat?: number | null
          lng?: number | null
          payment_model?: string
          payment_type?: string
          place_id?: string | null
          place_text?: string
          preferred_experience?: string
          recurring?: boolean
          required_qualifications?: string[]
          required_roles?: string[]
          required_skills?: string[]
          starts_at?: string | null
          status?: string
          timezone?: string
          title: string
          updated_at?: string
          urgency?: string
          visibility?: string
        }
        Update: {
          budget?: number | null
          budget_max?: number | null
          category?: string
          contact_preference?: string
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string
          duration_minutes?: number | null
          ends_at?: string | null
          expires_at?: string | null
          flexibility?: string
          id?: string
          intent?: string
          last_confirmed_at?: string
          lat?: number | null
          lng?: number | null
          payment_model?: string
          payment_type?: string
          place_id?: string | null
          place_text?: string
          preferred_experience?: string
          recurring?: boolean
          required_qualifications?: string[]
          required_roles?: string[]
          required_skills?: string[]
          starts_at?: string | null
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
          urgency?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "needs_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_preferences: {
        Row: {
          created_at: string
          earning_preference: string
          id: string
          note: string
          preference: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          earning_preference?: string
          id?: string
          note?: string
          preference: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          earning_preference?: string
          id?: string
          note?: string
          preference?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      person_capabilities: {
        Row: {
          created_at: string
          ended_on: string | null
          evidence: string
          expires_on: string | null
          id: string
          issuing_body: string
          kind: string
          label: string
          last_confirmed_at: string
          level: string
          obtained_on: string | null
          organisation: string
          started_on: string | null
          updated_at: string
          user_id: string
          verification: string
          visibility: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          ended_on?: string | null
          evidence?: string
          expires_on?: string | null
          id?: string
          issuing_body?: string
          kind: string
          label: string
          last_confirmed_at?: string
          level?: string
          obtained_on?: string | null
          organisation?: string
          started_on?: string | null
          updated_at?: string
          user_id: string
          verification?: string
          visibility?: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          ended_on?: string | null
          evidence?: string
          expires_on?: string | null
          id?: string
          issuing_body?: string
          kind?: string
          label?: string
          last_confirmed_at?: string
          level?: string
          obtained_on?: string | null
          organisation?: string
          started_on?: string | null
          updated_at?: string
          user_id?: string
          verification?: string
          visibility?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      places: {
        Row: {
          blurb: string
          country_code: string
          created_at: string
          currency: string
          id: string
          kind: string
          lat: number | null
          lng: number | null
          name: string
          parent_id: string | null
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          blurb?: string
          country_code?: string
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          name: string
          parent_id?: string | null
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          blurb?: string
          country_code?: string
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          name?: string
          parent_id?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "places_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
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
          place_id: string | null
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
          place_id?: string | null
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
          place_id?: string | null
          updated_at?: string
          wants_to_learn?: string[]
          would_love_to?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
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
      service_areas: {
        Row: {
          created_at: string
          id: string
          note: string
          place_id: string
          radius_km: number
          relation: string
          travel_willingness: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          place_id: string
          radius_km?: number
          relation?: string
          travel_willingness?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          place_id?: string
          radius_km?: number
          relation?: string
          travel_willingness?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      source_records: {
        Row: {
          created_at: string
          external_id: string
          first_imported_at: string
          id: string
          last_seen_at: string
          listing_id: string | null
          payload_hash: string
          source_id: string
          source_state: string
          source_updated_at: string | null
          source_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id: string
          first_imported_at?: string
          id?: string
          last_seen_at?: string
          listing_id?: string | null
          payload_hash?: string
          source_id: string
          source_state?: string
          source_updated_at?: string | null
          source_url?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string
          first_imported_at?: string
          id?: string
          last_seen_at?: string
          listing_id?: string | null
          payload_hash?: string
          source_id?: string
          source_state?: string
          source_updated_at?: string | null
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_records_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          access_method: string
          attribution: string
          consecutive_failures: number
          created_at: string
          enabled: boolean
          homepage_url: string
          id: string
          kind: string
          last_error_category: string
          last_failure_at: string | null
          last_outcome: string
          last_run_at: string | null
          last_success_at: string | null
          name: string
          place_ids: string[]
          refresh_minutes: number
          status: string
          store_images: boolean
          terms_url: string
          updated_at: string
        }
        Insert: {
          access_method: string
          attribution?: string
          consecutive_failures?: number
          created_at?: string
          enabled?: boolean
          homepage_url?: string
          id?: string
          kind: string
          last_error_category?: string
          last_failure_at?: string | null
          last_outcome?: string
          last_run_at?: string | null
          last_success_at?: string | null
          name: string
          place_ids?: string[]
          refresh_minutes?: number
          status?: string
          store_images?: boolean
          terms_url?: string
          updated_at?: string
        }
        Update: {
          access_method?: string
          attribution?: string
          consecutive_failures?: number
          created_at?: string
          enabled?: boolean
          homepage_url?: string
          id?: string
          kind?: string
          last_error_category?: string
          last_failure_at?: string | null
          last_outcome?: string
          last_run_at?: string | null
          last_success_at?: string | null
          name?: string
          place_ids?: string[]
          refresh_minutes?: number
          status?: string
          store_images?: boolean
          terms_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_safety_reviewer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
