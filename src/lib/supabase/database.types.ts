// Written by hand from supabase/migrations so the app typechecks without a running database.
// Replace with the generated file once a Supabase stack is available: `npm run db:types`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      invitations: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          template_id: string;
          event_type: string;
          max_party_size: number;
          content: Json;
          status: string;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          slug: string;
          template_id: string;
          event_type?: string;
          max_party_size?: number;
          content?: Json;
          status?: string;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          slug?: string;
          template_id?: string;
          event_type?: string;
          max_party_size?: number;
          content?: Json;
          status?: string;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          invitation_id: string;
          first_name: string;
          last_name: string;
          attending: boolean;
          party_size: number | null;
          edit_token_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          first_name: string;
          last_name?: string;
          attending: boolean;
          party_size?: number | null;
          edit_token_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          first_name?: string;
          last_name?: string;
          attending?: boolean;
          party_size?: number | null;
          edit_token_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "invitations";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          invitation_id: string | null;
          provider: string;
          provider_payment_id: string | null;
          amount: number;
          currency: string;
          status: string;
          ref_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invitation_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          ref_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          ref_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "invitations";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          event_id: string;
          received_at: string;
          event_type: string | null;
          provider_payment_id: string | null;
          outcome: string | null;
        };
        Insert: {
          event_id: string;
          received_at?: string;
          event_type?: string | null;
          provider_payment_id?: string | null;
          outcome?: string | null;
        };
        Update: {
          event_id?: string;
          received_at?: string;
          event_type?: string | null;
          provider_payment_id?: string | null;
          outcome?: string | null;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: { key: string; window_start: string; count: number };
        Insert: { key: string; window_start: string; count?: number };
        Update: { key?: string; window_start?: string; count?: number };
        Relationships: [];
      };
      onboarding: {
        Row: { user_id: string; answers: Json; skipped: boolean; completed_at: string; updated_at: string };
        Insert: { user_id?: string; answers?: Json; skipped?: boolean; completed_at?: string; updated_at?: string };
        Update: { user_id?: string; answers?: Json; skipped?: boolean; completed_at?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      hit_rate_limit: {
        Args: { p_key: string; p_window_start: string };
        Returns: number;
      };
      apply_payment_event: {
        Args: {
          p_event_id: string;
          p_event_type: string;
          p_kind: string;
          p_order_id: string | null;
          p_invitation_id: string | null;
          p_payment_id: string | null;
          p_amount: number | null;
          p_tax: number | null;
          p_currency: string | null;
          p_partial: boolean | null;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
