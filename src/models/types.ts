// Types TypeScript pour le système de monitoring
// Conçus pour correspondre au schéma Supabase

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  name: string;
  description?: string;
  keywords: string[]; // Mots-clés à surveiller
  platforms: Platform[]; // Plateformes surveillées
  status: 'active' | 'paused' | 'archived';
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CasePermission {
  id: string;
  case_id: string;
  user_id: string;
  permission_level: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

export interface Mention {
  id: string;
  case_id: string;
  platform: Platform;
  external_id: string; // ID de la mention sur la plateforme
  content: string;
  author_name?: string;
  author_handle?: string;
  author_id?: string;
  url?: string;
  published_at: string;
  discovered_at: string;
  sentiment_score?: number; // -5 à +5
  urgency_score: number; // 1 à 10
  keywords_matched: string[];
  status: 'new' | 'processed' | 'responded' | 'ignored';
  metadata: Record<string, unknown>; // Données supplémentaires
  created_at: string;
}

export interface Response {
  id: string;
  mention_id: string;
  case_id: string;
  response_type: 'auto' | 'semi_auto' | 'manual';
  content: string;
  status: 'draft' | 'approved' | 'sent' | 'failed';
  sent_at?: string;
  platform_response_id?: string;
  generated_by_ai: boolean;
  reviewed_by_user?: string;
  created_at: string;
  updated_at: string;
}

export interface ResponseTemplate {
  id: string;
  case_id: string;
  name: string;
  content: string;
  category?: 'positive' | 'negative' | 'neutral' | 'crisis';
  variables: string[]; // Variables à remplacer
  usage_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  case_id: string;
  mention_id?: string;
  type: 'sentiment_drop' | 'volume_spike' | 'crisis' | 'keyword_match';
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'acknowledged' | 'resolved' | 'false_positive';
  notified_users: string[];
  created_at: string;
  resolved_at?: string;
}

export interface Integration {
  id: string;
  case_id: string;
  platform: Platform;
  config: Record<string, unknown>; // Configuration spécifique
  is_active: boolean;
  last_sync?: string;
  rate_limit_reset?: string;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;
  case_id: string;
  date: string;
  platform: Platform;
  mention_count: number;
  positive_mentions: number;
  negative_mentions: number;
  neutral_mentions: number;
  response_count: number;
  avg_sentiment?: number;
  top_keywords: string[];
  created_at: string;
}

// Types utilitaires
export type Platform =
  | 'facebook'
  | 'instagram'
  | 'reddit'
  | 'youtube'
  | 'hackernews'
  | 'newsapi'
  | 'mastodon'
  | 'telegram'
  | 'discord';

export interface CreateCaseRequest {
  name: string;
  description?: string;
  keywords: string[];
  platforms: Platform[];
}

export interface UpdateCaseRequest {
  name?: string;
  description?: string;
  keywords?: string[];
  platforms?: Platform[];
  status?: Case['status'];
}

export interface CreateResponseRequest {
  mention_id: string;
  content: string;
  response_type: Response['response_type'];
}

export interface AIAnalysisRequest {
  content: string;
  context?: string;
  keywords: string[];
}

export interface AIAnalysisResponse {
  sentiment_score: number; // -5 à +5
  urgency_score: number; // 1 à 10
  summary: string;
  recommendation: string;
  detected_topics: string[];
  requires_human_review: boolean;
}

export interface AIResponseGenerationRequest {
  mention: Mention;
  template_category?: ResponseTemplate['category'];
  brand_guidelines?: string;
  max_length?: number;
}

export interface AIResponseGenerationResponse {
  generated_response: string;
  confidence_score: number;
  requires_review: boolean;
  alternative_responses?: string[];
}

// Types pour les métriques et analytics
export interface DashboardMetrics {
  total_mentions: number;
  new_mentions: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  platform_breakdown: Record<Platform, number>;
  response_rate: number;
  avg_response_time: number;
  active_cases: number;
  critical_alerts: number;
}

export interface TrendData {
  date: string;
  mentions: number;
  sentiment: number;
  responses: number;
}

// Types pour les configurations
export interface FacebookConfig {
  app_id: string;
  access_token: string;
  page_ids?: string[];
  webhook_secret?: string;
}

export interface InstagramConfig {
  access_token: string;
  business_account_id: string;
}

export interface RedditConfig {
  client_id: string;
  client_secret: string;
  user_agent: string;
  subreddits?: string[];
}

export interface PlatformConfig {
  facebook?: FacebookConfig;
  instagram?: InstagramConfig;
  reddit?: RedditConfig;
}

// Types pour la pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Types pour les filtres
export interface MentionFilters {
  case_id?: string;
  platform?: Platform;
  status?: Mention['status'];
  sentiment_min?: number;
  sentiment_max?: number;
  urgency_min?: number;
  urgency_max?: number;
  date_from?: string;
  date_to?: string;
  keywords?: string[];
}

export interface AlertFilters {
  case_id?: string;
  type?: Alert['type'];
  severity?: Alert['severity'];
  status?: Alert['status'];
  date_from?: string;
  date_to?: string;
}

// Types d'erreur
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}
