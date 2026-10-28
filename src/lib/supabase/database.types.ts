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
          content?: Json;
          status?: string;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          id: string;
          invitation_id: string;
          name: string;
          token: string;
          max_party_size: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          name: string;
          token?: string;
          max_party_size?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          name?: string;
          token?: string;
          max_party_size?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guests_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "invitations";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvps: {
        Row: {
          guest_id: string;
          attending: boolean;
          party_size: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          guest_id: string;
          attending: boolean;
          party_size: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          guest_id?: string;
          attending?: boolean;
          party_size?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvps_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: true;
            referencedRelation: "guests";
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
        Row: { event_id: string; received_at: string };
        Insert: { event_id: string; received_at?: string };
        Update: { event_id?: string; received_at?: string };
        Relationships: [];
      };
      rate_limits: {
        Row: { key: string; window_start: string; count: number };
        Insert: { key: string; window_start: string; count?: number };
        Update: { key?: string; window_start?: string; count?: number };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      hit_rate_limit: {
        Args: { p_key: string; p_window_start: string };
        Returns: number;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
