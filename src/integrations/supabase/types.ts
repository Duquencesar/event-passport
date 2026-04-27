export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      checkins: {
        Row: {
          access_type: string;
          checked_in_at: string;
          date: string;
          event_id: string | null;
          event_name: string | null;
          id: string;
          luma_guest_id: string | null;
          period: string;
          person_id: string;
          source: string;
        };
        Insert: {
          access_type: string;
          checked_in_at?: string;
          date?: string;
          event_id?: string | null;
          event_name?: string | null;
          id?: string;
          luma_guest_id?: string | null;
          period: string;
          person_id: string;
          source?: string;
        };
        Update: {
          access_type?: string;
          checked_in_at?: string;
          date?: string;
          event_id?: string | null;
          event_name?: string | null;
          id?: string;
          luma_guest_id?: string | null;
          period?: string;
          person_id?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checkins_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people_safe";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          location: string | null;
          luma_event_id: string | null;
          name: string;
          organizer: string | null;
          time: string | null;
          url: string | null;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          location?: string | null;
          luma_event_id?: string | null;
          name: string;
          organizer?: string | null;
          time?: string | null;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          location?: string | null;
          luma_event_id?: string | null;
          name?: string;
          organizer?: string | null;
          time?: string | null;
          url?: string | null;
        };
        Relationships: [];
      };
      house_access_grants: {
        Row: {
          access_end: string;
          access_start: string;
          created_at: string;
          credential_type: string;
          credential_value: string | null;
          event_id: string | null;
          grant_scope: string;
          house_user_id: string;
          id: string;
          payload: Json;
          person_id: string;
          source: string;
          source_ref: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          access_end: string;
          access_start: string;
          created_at?: string;
          credential_type: string;
          credential_value?: string | null;
          event_id?: string | null;
          grant_scope: string;
          house_user_id: string;
          id?: string;
          payload?: Json;
          person_id: string;
          source: string;
          source_ref: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          access_end?: string;
          access_start?: string;
          created_at?: string;
          credential_type?: string;
          credential_value?: string | null;
          event_id?: string | null;
          grant_scope?: string;
          house_user_id?: string;
          id?: string;
          payload?: Json;
          person_id?: string;
          source?: string;
          source_ref?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "house_access_grants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "house_access_grants_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "house_access_grants_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people_safe";
            referencedColumns: ["id"];
          },
        ];
      };
      house_access_logs_raw: {
        Row: {
          created_at: string;
          credential_type: string;
          credential_value: string | null;
          decision: string;
          device_id: string | null;
          door_id: string | null;
          grant_id: string | null;
          house_event_id: string;
          house_user_id: string | null;
          id: string;
          occurred_at: string;
          person_id: string | null;
          processed_at: string | null;
          provided_event_id: string | null;
          provided_event_name: string | null;
          raw_payload: Json;
          resolution_status: string;
          resolution_strategy: string | null;
          resolved_event_id: string | null;
          resolved_event_name: string | null;
          reason: string | null;
        };
        Insert: {
          created_at?: string;
          credential_type?: string;
          credential_value?: string | null;
          decision: string;
          device_id?: string | null;
          door_id?: string | null;
          grant_id?: string | null;
          house_event_id: string;
          house_user_id?: string | null;
          id?: string;
          occurred_at: string;
          person_id?: string | null;
          processed_at?: string | null;
          provided_event_id?: string | null;
          provided_event_name?: string | null;
          raw_payload?: Json;
          resolution_status?: string;
          resolution_strategy?: string | null;
          resolved_event_id?: string | null;
          resolved_event_name?: string | null;
          reason?: string | null;
        };
        Update: {
          created_at?: string;
          credential_type?: string;
          credential_value?: string | null;
          decision?: string;
          device_id?: string | null;
          door_id?: string | null;
          grant_id?: string | null;
          house_event_id?: string;
          house_user_id?: string | null;
          id?: string;
          occurred_at?: string;
          person_id?: string | null;
          processed_at?: string | null;
          provided_event_id?: string | null;
          provided_event_name?: string | null;
          raw_payload?: Json;
          resolution_status?: string;
          resolution_strategy?: string | null;
          resolved_event_id?: string | null;
          resolved_event_name?: string | null;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "house_access_logs_raw_grant_id_fkey";
            columns: ["grant_id"];
            isOneToOne: false;
            referencedRelation: "house_access_grants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "house_access_logs_raw_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "house_access_logs_raw_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people_safe";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "house_access_logs_raw_resolved_event_id_fkey";
            columns: ["resolved_event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      house_devices: {
        Row: {
          created_at: string;
          device_id: string;
          id: string;
          label: string | null;
          last_seen_at: string;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          device_id: string;
          id?: string;
          label?: string | null;
          last_seen_at?: string;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          device_id?: string;
          id?: string;
          label?: string | null;
          last_seen_at?: string;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      house_sync_state: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      house_user_map: {
        Row: {
          created_at: string;
          credential_type: string;
          house_user_id: string;
          id: string;
          is_active: boolean;
          is_resident: boolean;
          notes: string | null;
          person_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          credential_type?: string;
          house_user_id: string;
          id?: string;
          is_active?: boolean;
          is_resident?: boolean;
          notes?: string | null;
          person_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          credential_type?: string;
          house_user_id?: string;
          id?: string;
          is_active?: boolean;
          is_resident?: boolean;
          notes?: string | null;
          person_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "house_user_map_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "house_user_map_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people_safe";
            referencedColumns: ["id"];
          },
        ];
      };
      luma_webhook_events: {
        Row: {
          delivery_status: string;
          error_message: string | null;
          event_type: string | null;
          id: string;
          luma_event_id: string | null;
          payload: Json;
          processed_at: string | null;
          provider: string;
          received_at: string;
          request_headers: Json;
          result: Json;
          sync_mode: string;
        };
        Insert: {
          delivery_status?: string;
          error_message?: string | null;
          event_type?: string | null;
          id?: string;
          luma_event_id?: string | null;
          payload?: Json;
          processed_at?: string | null;
          provider?: string;
          received_at?: string;
          request_headers?: Json;
          result?: Json;
          sync_mode?: string;
        };
        Update: {
          delivery_status?: string;
          error_message?: string | null;
          event_type?: string | null;
          id?: string;
          luma_event_id?: string | null;
          payload?: Json;
          processed_at?: string | null;
          provider?: string;
          received_at?: string;
          request_headers?: Json;
          result?: Json;
          sync_mode?: string;
        };
        Relationships: [];
      };
      people: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          tag: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          tag?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          tag?: string | null;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          day_pass_date: string | null;
          event_id: string | null;
          event_name: string;
          id: string;
          imported_at: string;
          luma_guest_id: string | null;
          person_id: string;
          source: string;
          ticket_type: string;
          week_pass_start_date: string | null;
        };
        Insert: {
          day_pass_date?: string | null;
          event_id?: string | null;
          event_name: string;
          id?: string;
          imported_at?: string;
          luma_guest_id?: string | null;
          person_id: string;
          source?: string;
          ticket_type: string;
          week_pass_start_date?: string | null;
        };
        Update: {
          day_pass_date?: string | null;
          event_id?: string | null;
          event_name?: string;
          id?: string;
          imported_at?: string;
          luma_guest_id?: string | null;
          person_id?: string;
          source?: string;
          ticket_type?: string;
          week_pass_start_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people_safe";
            referencedColumns: ["id"];
          },
        ];
      };
      telegram_bot_state: {
        Row: {
          id: number;
          update_offset: number;
          updated_at: string;
        };
        Insert: {
          id: number;
          update_offset?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          update_offset?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      telegram_messages: {
        Row: {
          chat_id: number;
          created_at: string;
          raw_update: Json;
          text: string | null;
          update_id: number;
        };
        Insert: {
          chat_id: number;
          created_at?: string;
          raw_update: Json;
          text?: string | null;
          update_id: number;
        };
        Update: {
          chat_id?: number;
          created_at?: string;
          raw_update?: Json;
          text?: string | null;
          update_id?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      people_safe: {
        Row: {
          created_at: string | null;
          id: string | null;
          name: string | null;
          tag: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string | null;
          name?: string | null;
          tag?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          name?: string | null;
          tag?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      process_house_access_events: {
        Args: {
          input_events: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
