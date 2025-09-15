// Types générés automatiquement par Supabase CLI
// Ces types correspondent au schéma de base de données défini

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          case_id: string
          created_at: string
          description: string | null
          id: string
          mention_id: string | null
          notified_users: Json
          resolved_at: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'new' | 'acknowledged' | 'resolved' | 'false_positive'
          title: string
          type: 'sentiment_drop' | 'volume_spike' | 'crisis' | 'keyword_match'
        }
        Insert: {
          case_id: string
          created_at?: string
          description?: string | null
          id?: string
          mention_id?: string | null
          notified_users?: Json
          resolved_at?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'new' | 'acknowledged' | 'resolved' | 'false_positive'
          title: string
          type: 'sentiment_drop' | 'volume_spike' | 'crisis' | 'keyword_match'
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string | null
          id?: string
          mention_id?: string | null
          notified_users?: Json
          resolved_at?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'new' | 'acknowledged' | 'resolved' | 'false_positive'
          title?: string
          type?: 'sentiment_drop' | 'volume_spike' | 'crisis' | 'keyword_match'
        }
        Relationships: [
          {
            foreignKeyName: "alerts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_mention_id_fkey"
            columns: ["mention_id"]
            isOneToOne: false
            referencedRelation: "mentions"
            referencedColumns: ["id"]
          },
        ]
      }
      case_permissions: {
        Row: {
          case_id: string | null
          created_at: string
          id: string
          permission_level: 'owner' | 'editor' | 'viewer'
          user_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          permission_level?: 'owner' | 'editor' | 'viewer'
          user_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          permission_level?: 'owner' | 'editor' | 'viewer'
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_permissions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          keywords: Json
          name: string
          owner_id: string
          platforms: Json
          status: 'active' | 'paused' | 'archived'
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          keywords?: Json
          name: string
          owner_id: string
          platforms?: Json
          status?: 'active' | 'paused' | 'archived'
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          keywords?: Json
          name?: string
          owner_id?: string
          platforms?: Json
          status?: 'active' | 'paused' | 'archived'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          case_id: string | null
          config: Json
          created_at: string
          error_count: number
          id: string
          is_active: boolean
          last_sync: string | null
          platform: string
          rate_limit_reset: string | null
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          config: Json
          created_at?: string
          error_count?: number
          id?: string
          is_active?: boolean
          last_sync?: string | null
          platform: string
          rate_limit_reset?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          config?: Json
          created_at?: string
          error_count?: number
          id?: string
          is_active?: boolean
          last_sync?: string | null
          platform?: string
          rate_limit_reset?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          author_handle: string | null
          author_id: string | null
          author_name: string | null
          case_id: string | null
          content: string
          created_at: string
          discovered_at: string
          external_id: string
          id: string
          keywords_matched: Json
          metadata: Json
          platform: 'facebook' | 'instagram' | 'reddit'
          published_at: string
          sentiment_score: number | null
          status: 'new' | 'processed' | 'responded' | 'ignored'
          urgency_score: number
          url: string | null
        }
        Insert: {
          author_handle?: string | null
          author_id?: string | null
          author_name?: string | null
          case_id?: string | null
          content: string
          created_at?: string
          discovered_at?: string
          external_id: string
          id?: string
          keywords_matched?: Json
          metadata?: Json
          platform: 'facebook' | 'instagram' | 'reddit'
          published_at: string
          sentiment_score?: number | null
          status?: 'new' | 'processed' | 'responded' | 'ignored'
          urgency_score?: number
          url?: string | null
        }
        Update: {
          author_handle?: string | null
          author_id?: string | null
          author_name?: string | null
          case_id?: string | null
          content?: string
          created_at?: string
          discovered_at?: string
          external_id?: string
          id?: string
          keywords_matched?: Json
          metadata?: Json
          platform?: 'facebook' | 'instagram' | 'reddit'
          published_at?: string
          sentiment_score?: number | null
          status?: 'new' | 'processed' | 'responded' | 'ignored'
          urgency_score?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          avg_sentiment: number | null
          case_id: string | null
          created_at: string
          date: string
          id: string
          mention_count: number
          negative_mentions: number
          neutral_mentions: number
          platform: string
          positive_mentions: number
          response_count: number
          top_keywords: Json
        }
        Insert: {
          avg_sentiment?: number | null
          case_id?: string | null
          created_at?: string
          date: string
          id?: string
          mention_count?: number
          negative_mentions?: number
          neutral_mentions?: number
          platform: string
          positive_mentions?: number
          response_count?: number
          top_keywords?: Json
        }
        Update: {
          avg_sentiment?: number | null
          case_id?: string | null
          created_at?: string
          date?: string
          id?: string
          mention_count?: number
          negative_mentions?: number
          neutral_mentions?: number
          platform?: string
          positive_mentions?: number
          response_count?: number
          top_keywords?: Json
        }
        Relationships: [
          {
            foreignKeyName: "metrics_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      response_templates: {
        Row: {
          case_id: string | null
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
          usage_count: number
          variables: Json
        }
        Insert: {
          case_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
          usage_count?: number
          variables?: Json
        }
        Update: {
          case_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
          usage_count?: number
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "response_templates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          case_id: string | null
          content: string
          created_at: string
          generated_by_ai: boolean
          id: string
          mention_id: string | null
          platform_response_id: string | null
          response_type: 'auto' | 'semi_auto' | 'manual'
          reviewed_by_user: string | null
          sent_at: string | null
          status: 'draft' | 'approved' | 'sent' | 'failed'
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          content: string
          created_at?: string
          generated_by_ai?: boolean
          id?: string
          mention_id?: string | null
          platform_response_id?: string | null
          response_type?: 'auto' | 'semi_auto' | 'manual'
          reviewed_by_user?: string | null
          sent_at?: string | null
          status?: 'draft' | 'approved' | 'sent' | 'failed'
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          content?: string
          created_at?: string
          generated_by_ai?: boolean
          id?: string
          mention_id?: string | null
          platform_response_id?: string | null
          response_type?: 'auto' | 'semi_auto' | 'manual'
          reviewed_by_user?: string | null
          sent_at?: string | null
          status?: 'draft' | 'approved' | 'sent' | 'failed'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_mention_id_fkey"
            columns: ["mention_id"]
            isOneToOne: false
            referencedRelation: "mentions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_reviewed_by_user_fkey"
            columns: ["reviewed_by_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
