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
      appointments: {
        Row: {
          barber_id: string
          cancelled_at: string | null
          client_id: string
          code: string
          created_at: string
          ends_at: string
          id: string
          notes: string
          price: number
          reschedule_requested: boolean
          service_id: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          barber_id: string
          cancelled_at?: string | null
          client_id: string
          code?: string
          created_at?: string
          ends_at: string
          id?: string
          notes?: string
          price?: number
          reschedule_requested?: boolean
          service_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          barber_id?: string
          cancelled_at?: string | null
          client_id?: string
          code?: string
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string
          price?: number
          reschedule_requested?: boolean
          service_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_services: {
        Row: {
          barber_id: string
          service_id: string
        }
        Insert: {
          barber_id: string
          service_id: string
        }
        Update: {
          barber_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_services_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          active: boolean
          bio: string
          created_at: string
          id: string
          name: string
          phone: string
          photo_url: string | null
          specialty: string
        }
        Insert: {
          active?: boolean
          bio?: string
          created_at?: string
          id?: string
          name: string
          phone?: string
          photo_url?: string | null
          specialty?: string
        }
        Update: {
          active?: boolean
          bio?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          photo_url?: string | null
          specialty?: string
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          barber_id: string | null
          created_at: string
          date: string
          end_time: string | null
          id: string
          reason: string
          start_time: string | null
        }
        Insert: {
          barber_id?: string | null
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          reason?: string
          start_time?: string | null
        }
        Update: {
          barber_id?: string | null
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          reason?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
          spent_at: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description: string
          id?: string
          spent_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          spent_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string
          paid_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string
          paid_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          duration_min: number
          icon: string
          id: string
          image_url: string | null
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          duration_min?: number
          icon?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          duration_min?: number
          icon?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string
          buffer_min: number
          cancel_min_hours: number
          close_time: string
          default_duration_min: number
          email: string
          id: number
          instagram: string
          lunch_end: string | null
          lunch_start: string | null
          max_days_ahead: number
          min_advance_hours: number
          open_days: number[]
          open_time: string
          phone: string
          shop_name: string
          slot_interval_min: number
          updated_at: string
        }
        Insert: {
          address?: string
          buffer_min?: number
          cancel_min_hours?: number
          close_time?: string
          default_duration_min?: number
          email?: string
          id?: number
          instagram?: string
          lunch_end?: string | null
          lunch_start?: string | null
          max_days_ahead?: number
          min_advance_hours?: number
          open_days?: number[]
          open_time?: string
          phone?: string
          shop_name?: string
          slot_interval_min?: number
          updated_at?: string
        }
        Update: {
          address?: string
          buffer_min?: number
          cancel_min_hours?: number
          close_time?: string
          default_duration_min?: number
          email?: string
          id?: number
          instagram?: string
          lunch_end?: string | null
          lunch_start?: string | null
          max_days_ahead?: number
          min_advance_hours?: number
          open_days?: number[]
          open_time?: string
          phone?: string
          shop_name?: string
          slot_interval_min?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          barber_id: string
          end_time: string
          id: string
          start_time: string
          weekday: number
        }
        Insert: {
          barber_id: string
          end_time: string
          id?: string
          start_time: string
          weekday: number
        }
        Update: {
          barber_id?: string
          end_time?: string
          id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "staff"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      payment_method: "pix" | "cash" | "credit" | "debit"
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
      app_role: ["admin", "staff"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      payment_method: ["pix", "cash", "credit", "debit"],
    },
  },
} as const
