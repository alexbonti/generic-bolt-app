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
          role: 'user' | 'admin'
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'user' | 'admin'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'user' | 'admin'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      news: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
         video_url: string | null
         video_type: 'youtube' | 'upload' | null
         video_file_url: string | null
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
         video_url?: string | null
         video_type?: 'youtube' | 'upload' | null
         video_file_url?: string | null
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
         video_url?: string | null
         video_type?: 'youtube' | 'upload' | null
         video_file_url?: string | null
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: 'new' | 'in_progress' | 'resolved' | 'closed'
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'new' | 'in_progress' | 'resolved' | 'closed'
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'new' | 'in_progress' | 'resolved' | 'closed'
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      ticket_attachments: {
        Row: {
          id: string
          ticket_id: string
          file_url: string
          file_name: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          file_url: string
          file_name: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          file_url?: string
          file_name?: string
          created_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          name: string
          subject: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      sent_emails: {
        Row: {
          id: string
          template_id: string | null
          user_id: string
          subject: string
          content: string
          status: 'pending' | 'sent' | 'failed'
          sent_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          user_id: string
          subject: string
          content: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          user_id?: string
          subject?: string
          content?: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string
        }
      }
    }
  }
}
