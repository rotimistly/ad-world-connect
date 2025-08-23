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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          ad_format: string
          ad_preview: string | null
          body_text: string
          business_id: string | null
          call_to_action: string | null
          clicks: number | null
          created_at: string
          distance_km: number
          expires_at: string | null
          fixed_price_expires_at: string | null
          headline: string
          id: string
          is_fixed_price: boolean | null
          messages: number | null
          paid: boolean | null
          performance_tips: string[] | null
          price_paid: number | null
          published_at: string | null
          region: string | null
          target_keywords: string[] | null
          views: number | null
        }
        Insert: {
          ad_format: string
          ad_preview?: string | null
          body_text: string
          business_id?: string | null
          call_to_action?: string | null
          clicks?: number | null
          created_at?: string
          distance_km?: number
          expires_at?: string | null
          fixed_price_expires_at?: string | null
          headline: string
          id?: string
          is_fixed_price?: boolean | null
          messages?: number | null
          paid?: boolean | null
          performance_tips?: string[] | null
          price_paid?: number | null
          published_at?: string | null
          region?: string | null
          target_keywords?: string[] | null
          views?: number | null
        }
        Update: {
          ad_format?: string
          ad_preview?: string | null
          body_text?: string
          business_id?: string | null
          call_to_action?: string | null
          clicks?: number | null
          created_at?: string
          distance_km?: number
          expires_at?: string | null
          fixed_price_expires_at?: string | null
          headline?: string
          id?: string
          is_fixed_price?: boolean | null
          messages?: number | null
          paid?: boolean | null
          performance_tips?: string[] | null
          price_paid?: number | null
          published_at?: string | null
          region?: string | null
          target_keywords?: string[] | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_published: boolean
          priority: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          priority?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          priority?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          budget_preference: string | null
          business_description: string | null
          business_name: string
          created_at: string
          email: string | null
          facebook_handle: string | null
          id: string
          instagram_handle: string | null
          linkedin_handle: string | null
          other_contact_info: string | null
          phone_number: string | null
          target_audience: string | null
          target_keywords: string[] | null
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string
          user_id: string | null
          website_url: string | null
          whatsapp_link: string | null
          whatsapp_number: string | null
        }
        Insert: {
          budget_preference?: string | null
          business_description?: string | null
          business_name: string
          created_at?: string
          email?: string | null
          facebook_handle?: string | null
          id?: string
          instagram_handle?: string | null
          linkedin_handle?: string | null
          other_contact_info?: string | null
          phone_number?: string | null
          target_audience?: string | null
          target_keywords?: string[] | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
          whatsapp_link?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          budget_preference?: string | null
          business_description?: string | null
          business_name?: string
          created_at?: string
          email?: string | null
          facebook_handle?: string | null
          id?: string
          instagram_handle?: string | null
          linkedin_handle?: string | null
          other_contact_info?: string | null
          phone_number?: string | null
          target_audience?: string | null
          target_keywords?: string[] | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
          whatsapp_link?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          message: string
          platform: string
          sender_email: string
          sender_name: string
          sender_phone: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          message: string
          platform: string
          sender_email: string
          sender_name: string
          sender_phone?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          message?: string
          platform?: string
          sender_email?: string
          sender_name?: string
          sender_phone?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          ad_id: string
          amount: number
          created_at: string
          currency: string | null
          id: string
          payment_method: string | null
          paystack_access_code: string | null
          paystack_reference: string | null
          region: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id: string
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          payment_method?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          region: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          payment_method?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          region?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_stats: {
        Row: {
          paid_ads: number | null
          total_ads: number | null
          total_businesses: number | null
          total_messages: number | null
          total_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_ad_price: {
        Args: { distance_km: number; is_fixed_price?: boolean }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      track_ad_engagement: {
        Args: { p_ad_id: string; p_engagement_type: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
