export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          status: 'online' | 'offline' | 'away'
          last_seen: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          status?: 'online' | 'offline' | 'away'
          last_seen?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          status?: 'online' | 'offline' | 'away'
          last_seen?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          name: string | null
          is_group: boolean
          created_by: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_by: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_by?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_participants: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          joined_at: string
          last_read_at: string | null
          role: 'admin' | 'member'
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          joined_at?: string
          last_read_at?: string | null
          role?: 'admin' | 'member'
        }
        Update: {
          id?: string
          chat_id?: string
          user_id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: 'admin' | 'member'
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'file' | 'system'
          file_url: string | null
          file_name: string | null
          file_size: number | null
          reply_to_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          reply_to_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          reply_to_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          read_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}