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
      ceo_runs: {
        Row: {
          agent_outputs: Json | null
          agents: string[]
          budgets: Json
          completed_at: string | null
          created_at: string
          device_id: string | null
          error: string | null
          events: Json[] | null
          final_output: string | null
          goal: string
          id: string
          mode: string
          model: string
          phase: string
          review_output: string | null
          started_at: string | null
          status: string
          task_plan: Json | null
          tool_permissions: Json
          updated_at: string
        }
        Insert: {
          agent_outputs?: Json | null
          agents?: string[]
          budgets?: Json
          completed_at?: string | null
          created_at?: string
          device_id?: string | null
          error?: string | null
          events?: Json[] | null
          final_output?: string | null
          goal: string
          id?: string
          mode?: string
          model?: string
          phase?: string
          review_output?: string | null
          started_at?: string | null
          status?: string
          task_plan?: Json | null
          tool_permissions?: Json
          updated_at?: string
        }
        Update: {
          agent_outputs?: Json | null
          agents?: string[]
          budgets?: Json
          completed_at?: string | null
          created_at?: string
          device_id?: string | null
          error?: string | null
          events?: Json[] | null
          final_output?: string | null
          goal?: string
          id?: string
          mode?: string
          model?: string
          phase?: string
          review_output?: string | null
          started_at?: string | null
          status?: string
          task_plan?: Json | null
          tool_permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      memory_vault: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source: string | null
          source_url: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      use_case_runs: {
        Row: {
          assigned_agents: string[] | null
          completed_at: string | null
          config: Json | null
          created_at: string
          id: string
          output: string | null
          output_metadata: Json | null
          started_at: string | null
          status: string
          use_case_id: string
        }
        Insert: {
          assigned_agents?: string[] | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          output?: string | null
          output_metadata?: Json | null
          started_at?: string | null
          status?: string
          use_case_id: string
        }
        Update: {
          assigned_agents?: string[] | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          output?: string | null
          output_metadata?: Json | null
          started_at?: string | null
          status?: string
          use_case_id?: string
        }
        Relationships: []
      }
      use_case_schedules: {
        Row: {
          assigned_agents: string[] | null
          config: Json | null
          created_at: string
          cron_expression: string
          enabled: boolean | null
          id: string
          last_run_at: string | null
          next_run_at: string | null
          output_destination: string | null
          updated_at: string
          use_case_id: string
        }
        Insert: {
          assigned_agents?: string[] | null
          config?: Json | null
          created_at?: string
          cron_expression: string
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          output_destination?: string | null
          updated_at?: string
          use_case_id: string
        }
        Update: {
          assigned_agents?: string[] | null
          config?: Json | null
          created_at?: string
          cron_expression?: string
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          output_destination?: string | null
          updated_at?: string
          use_case_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_memory_vault: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          metadata: Json
          similarity: number
          source: string
          source_url: string
          tags: string[]
        }[]
      }
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
