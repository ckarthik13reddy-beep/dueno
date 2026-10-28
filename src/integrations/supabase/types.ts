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
      ai_events: {
        Row: {
          block_reason: string | null
          blocked: boolean
          created_at: string
          detail: Json | null
          id: string
          invoice_id: string | null
          kind: string
          model: string | null
          user_id: string | null
        }
        Insert: {
          block_reason?: string | null
          blocked?: boolean
          created_at?: string
          detail?: Json | null
          id?: string
          invoice_id?: string | null
          kind: string
          model?: string | null
          user_id?: string | null
        }
        Update: {
          block_reason?: string | null
          blocked?: boolean
          created_at?: string
          detail?: Json | null
          id?: string
          invoice_id?: string | null
          kind?: string
          model?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_gateway_state: {
        Row: {
          id: string
          message: string | null
          paused: boolean
          status: number | null
          updated_at: string
        }
        Insert: {
          id: string
          message?: string | null
          paused?: boolean
          status?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          message?: string | null
          paused?: boolean
          status?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      automation_locks: {
        Row: {
          expires_at: string
          key: string
          owner: string
        }
        Insert: {
          expires_at: string
          key: string
          owner: string
        }
        Update: {
          expires_at?: string
          key?: string
          owner?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      cron_tokens: {
        Row: {
          created_at: string
          id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          token_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          token_hash?: string
        }
        Relationships: []
      }
      follow_up_schedules: {
        Row: {
          active: boolean
          attempts: number
          created_at: string
          id: string
          invoice_id: string
          last_sent_at: string | null
          next_send_at: string
          stage: Database["public"]["Enums"]["followup_stage"]
          user_id: string
        }
        Insert: {
          active?: boolean
          attempts?: number
          created_at?: string
          id?: string
          invoice_id: string
          last_sent_at?: string | null
          next_send_at: string
          stage?: Database["public"]["Enums"]["followup_stage"]
          user_id: string
        }
        Update: {
          active?: boolean
          attempts?: number
          created_at?: string
          id?: string
          invoice_id?: string
          last_sent_at?: string | null
          next_send_at?: string
          stage?: Database["public"]["Enums"]["followup_stage"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_schedules_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          client_id: string
          created_at: string
          currency: string
          description: string | null
          due_date: string
          file_path: string | null
          id: string
          paid_at: string | null
          payment_link_url: string | null
          preferred_channel: Database["public"]["Enums"]["msg_channel"] | null
          public_token: string
          receipt_path: string | null
          reference: string | null
          source: Database["public"]["Enums"]["invoice_source"]
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id: string | null
          stripe_payment_link_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          client_id: string
          created_at?: string
          currency?: string
          description?: string | null
          due_date: string
          file_path?: string | null
          id?: string
          paid_at?: string | null
          payment_link_url?: string | null
          preferred_channel?: Database["public"]["Enums"]["msg_channel"] | null
          public_token?: string
          receipt_path?: string | null
          reference?: string | null
          source?: Database["public"]["Enums"]["invoice_source"]
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          client_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string
          file_path?: string | null
          id?: string
          paid_at?: string | null
          payment_link_url?: string | null
          preferred_channel?: Database["public"]["Enums"]["msg_channel"] | null
          public_token?: string
          receipt_path?: string | null
          reference?: string | null
          source?: Database["public"]["Enums"]["invoice_source"]
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          stage: Database["public"]["Enums"]["followup_stage"]
          template_key: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          stage: Database["public"]["Enums"]["followup_stage"]
          template_key: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          stage?: Database["public"]["Enums"]["followup_stage"]
          template_key?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_path: string | null
          body: string
          channel: Database["public"]["Enums"]["msg_channel"]
          client_id: string
          created_at: string
          direction: Database["public"]["Enums"]["msg_direction"]
          id: string
          invoice_id: string
          provider_message_id: string | null
          template_key: string | null
          user_id: string
        }
        Insert: {
          attachment_path?: string | null
          body: string
          channel: Database["public"]["Enums"]["msg_channel"]
          client_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["msg_direction"]
          id?: string
          invoice_id: string
          provider_message_id?: string | null
          template_key?: string | null
          user_id: string
        }
        Update: {
          attachment_path?: string | null
          body?: string
          channel?: Database["public"]["Enums"]["msg_channel"]
          client_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["msg_direction"]
          id?: string
          invoice_id?: string
          provider_message_id?: string | null
          template_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          invoice_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          invoice_id?: string | null
          payload: Json
          processed_at?: string | null
          provider?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          invoice_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          contact_details: string | null
          created_at: string
          digest_enabled: boolean
          email: string | null
          id: string
          logo_path: string | null
          onboarding_complete: boolean
          receipt_fields: Json
          receipt_template_complete: boolean
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          contact_details?: string | null
          created_at?: string
          digest_enabled?: boolean
          email?: string | null
          id?: string
          logo_path?: string | null
          onboarding_complete?: boolean
          receipt_fields?: Json
          receipt_template_complete?: boolean
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          contact_details?: string | null
          created_at?: string
          digest_enabled?: boolean
          email?: string | null
          id?: string
          logo_path?: string | null
          onboarding_complete?: boolean
          receipt_fields?: Json
          receipt_template_complete?: boolean
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          id: string
          subject: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          id?: string
          subject: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          id?: string
          subject?: string
          window_start?: string
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
      acquire_automation_lock: {
        Args: { lock_key: string; lock_owner: string }
        Returns: boolean
      }
      consume_rate_limit: {
        Args: {
          p_action: string
          p_limit: number
          p_subject: string
          p_window_seconds: number
        }
        Returns: boolean
      }
      create_owned_invoice: { Args: { p_input: Json }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      followup_stage: "first" | "followup_1" | "followup_2" | "final"
      invoice_source: "manual" | "excel_upload"
      invoice_status:
        | "pending"
        | "active"
        | "overdue"
        | "pending_manual_confirmation"
        | "paid"
        | "cancelled"
      msg_channel: "whatsapp" | "email" | "system"
      msg_direction: "outbound" | "inbound" | "system"
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
      app_role: ["admin", "user"],
      followup_stage: ["first", "followup_1", "followup_2", "final"],
      invoice_source: ["manual", "excel_upload"],
      invoice_status: [
        "pending",
        "active",
        "overdue",
        "pending_manual_confirmation",
        "paid",
        "cancelled",
      ],
      msg_channel: ["whatsapp", "email", "system"],
      msg_direction: ["outbound", "inbound", "system"],
    },
  },
} as const
