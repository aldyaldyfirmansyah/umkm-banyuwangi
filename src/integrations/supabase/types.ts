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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          link: string | null
          sort_order: number
          status: boolean
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          link?: string | null
          sort_order?: number
          status?: boolean
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          link?: string | null
          sort_order?: number
          status?: boolean
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          image: string | null
          images: string[]
          is_featured: boolean
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          price: number
          product_name: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          umkm_id: string
          updated_at: string
          views: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image?: string | null
          images?: string[]
          is_featured?: boolean
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          price?: number
          product_name: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          umkm_id: string
          updated_at?: string
          views?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image?: string | null
          images?: string[]
          is_featured?: boolean
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          price?: number
          product_name?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          umkm_id?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_umkm_id_fkey"
            columns: ["umkm_id"]
            isOneToOne: false
            referencedRelation: "umkm"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about: string | null
          address: string | null
          email: string | null
          facebook: string | null
          id: number
          instagram: string | null
          phone: string | null
          site_name: string
          tagline: string | null
          tiktok: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          email?: string | null
          facebook?: string | null
          id?: number
          instagram?: string | null
          phone?: string | null
          site_name?: string
          tagline?: string | null
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          email?: string | null
          facebook?: string | null
          id?: number
          instagram?: string | null
          phone?: string | null
          site_name?: string
          tagline?: string | null
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      umkm: {
        Row: {
          address: string | null
          business_name: string
          category_id: string | null
          city: string
          created_at: string
          description: string | null
          district_id: string | null
          facebook: string | null
          full_address: string | null
          id: string
          instagram: string | null
          is_active: boolean
          is_suspended: boolean
          latitude: number | null
          logo: string | null
          longitude: number | null
          opening_hours: string | null
          owner_id: string | null
          owner_name: string
          rejection_reason: string | null
          tiktok: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          village: string | null
          whatsapp: string
        }
        Insert: {
          address?: string | null
          business_name: string
          category_id?: string | null
          city?: string
          created_at?: string
          description?: string | null
          district_id?: string | null
          facebook?: string | null
          full_address?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_suspended?: boolean
          latitude?: number | null
          logo?: string | null
          longitude?: number | null
          opening_hours?: string | null
          owner_id?: string | null
          owner_name?: string
          rejection_reason?: string | null
          tiktok?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          village?: string | null
          whatsapp?: string
        }
        Update: {
          address?: string | null
          business_name?: string
          category_id?: string | null
          city?: string
          created_at?: string
          description?: string | null
          district_id?: string | null
          facebook?: string | null
          full_address?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_suspended?: boolean
          latitude?: number | null
          logo?: string | null
          longitude?: number | null
          opening_hours?: string | null
          owner_id?: string | null
          owner_name?: string
          rejection_reason?: string | null
          tiktok?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          village?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "umkm_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "umkm_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
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
      increment_product_view: {
        Args: { _product_id: string }
        Returns: undefined
      }
      owns_umkm: { Args: { _umkm_id: string }; Returns: boolean }
      umkm_is_public: { Args: { _umkm_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "umkm" | "user"
      moderation_status: "pending" | "approved" | "hidden"
      product_status: "active" | "inactive"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "umkm", "user"],
      moderation_status: ["pending", "approved", "hidden"],
      product_status: ["active", "inactive"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
