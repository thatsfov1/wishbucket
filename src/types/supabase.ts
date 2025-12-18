// Типи для Supabase Database
// Генеруються автоматично, але можна створити вручну

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: number;
          telegram_data: Json;
          birthday: string | null;
          referral_code: string;
          referrals: number;
          premium_status: 'free' | 'premium';
          premium_expires_at: string | null;
          bonus_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: number;
          telegram_data: Json;
          birthday?: string | null;
          referral_code?: string;
          referrals?: number;
          premium_status?: 'free' | 'premium';
          premium_expires_at?: string | null;
          bonus_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: number;
          telegram_data?: Json;
          birthday?: string | null;
          referral_code?: string;
          referrals?: number;
          premium_status?: 'free' | 'premium';
          premium_expires_at?: string | null;
          bonus_points?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: number;
          name: string;
          description: string | null;
          image_url: string | null;
          event_date: string | null;
          is_public: boolean;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: number;
          name: string;
          description?: string | null;
          image_url?: string | null;
          event_date?: string | null;
          is_public?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: number;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          event_date?: string | null;
          is_public?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          name: string;
          description: string | null;
          url: string;
          original_url: string;
          affiliate_url: string | null;
          image_url: string | null;
          price: number | null;
          currency: string;
          priority: 'low' | 'medium' | 'high';
          status: 'available' | 'reserved' | 'purchased';
          reserved_by: number | null;
          purchased_by: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          name: string;
          description?: string | null;
          url: string;
          original_url: string;
          affiliate_url?: string | null;
          image_url?: string | null;
          price?: number | null;
          currency?: string;
          priority?: 'low' | 'medium' | 'high';
          status?: 'available' | 'reserved' | 'purchased';
          reserved_by?: number | null;
          purchased_by?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wishlist_id?: string;
          name?: string;
          description?: string | null;
          url?: string;
          original_url?: string;
          affiliate_url?: string | null;
          image_url?: string | null;
          price?: number | null;
          currency?: string;
          priority?: 'low' | 'medium' | 'high';
          status?: 'available' | 'reserved' | 'purchased';
          reserved_by?: number | null;
          purchased_by?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: number;
          friend_id: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: number;
          friend_id: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: number;
          friend_id?: number;
          created_at?: string;
        };
      };
      crowdfunding: {
        Row: {
          id: string;
          item_id: string;
          target_amount: number;
          current_amount: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          target_amount: number;
          current_amount?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          target_amount?: number;
          current_amount?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      crowdfunding_contributors: {
        Row: {
          id: string;
          crowdfunding_id: string;
          user_id: number;
          amount: number;
          contributed_at: string;
        };
        Insert: {
          id?: string;
          crowdfunding_id: string;
          user_id: number;
          amount: number;
          contributed_at?: string;
        };
        Update: {
          id?: string;
          crowdfunding_id?: string;
          user_id?: number;
          amount?: number;
          contributed_at?: string;
        };
      };
      secret_santa: {
        Row: {
          id: string;
          organizer_id: number;
          name: string;
          description: string | null;
          budget: number | null;
          exchange_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: number;
          name: string;
          description?: string | null;
          budget?: number | null;
          exchange_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: number;
          name?: string;
          description?: string | null;
          budget?: number | null;
          exchange_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      secret_santa_participants: {
        Row: {
          id: string;
          secret_santa_id: string;
          user_id: number;
          wishlist_id: string | null;
          assigned_to: number | null;
          has_drawn: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          secret_santa_id: string;
          user_id: number;
          wishlist_id?: string | null;
          assigned_to?: number | null;
          has_drawn?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          secret_santa_id?: string;
          user_id?: number;
          wishlist_id?: string | null;
          assigned_to?: number | null;
          has_drawn?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: number;
          type: string;
          title: string;
          message: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: number;
          type: string;
          title: string;
          message: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: number;
          type?: string;
          title?: string;
          message?: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: number;
          referred_user_id: number;
          bonus_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: number;
          referred_user_id: number;
          bonus_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: number;
          referred_user_id?: number;
          bonus_earned?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

