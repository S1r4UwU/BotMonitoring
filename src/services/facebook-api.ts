/**
 * Service Facebook/Instagram Graph API
 * Budget-friendly : utilise App Token, respect du rate limiting (200 req/heure)
 */

import axios from 'axios';
import { cacheService } from '@/lib/cache';
import { Mention } from '@/models/types';

interface FacebookMention {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  from?: {
    name: string;
    id: string;
  };
  likes?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
  permalink_url?: string;
}

interface FacebookSearchResponse {
  data: FacebookMention[];
  paging?: {
    next?: string;
  };
}

class FacebookAPIService {
  private appId: string;
  private appSecret: string;
  private accessToken: string;
  private baseURL = 'https://graph.facebook.com/v18.0';
  private rateLimitRemaining = 200; // Limite par heure
  private rateLimitResetTime = 0;

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || '';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
    this.accessToken = `${this.appId}|${this.appSecret}`;
    
    if (!this.appId || !this.appSecret) {
      console.warn('Facebook API non configurée : FACEBOOK_APP_ID et FACEBOOK_APP_SECRET manquants');
    }
  }

  /**
   * Vérifie si l'API est configurée
   */
  isConfigured(): boolean {
    return !!(this.appId && this.appSecret);
  }

  /**
   * Vérifie le rate limiting
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset du compteur si une heure s'est écoulée
    if (now > this.rateLimitResetTime) {
      this.rateLimitRemaining = 200;
      this.rateLimitResetTime = now + 60 * 60 * 1000; // +1 heure
    }

    return this.rateLimitRemaining > 0;
  }

  /**
   * Décrémente le compteur de rate limiting
   */
  private decrementRateLimit(): void {
    this.rateLimitRemaining = Math.max(0, this.rateLimitRemaining - 1);
  }

  /**
   * Recherche des mentions par mots-clés sur Facebook
   */
  async searchFacebookPosts(keywords: string[]): Promise<Mention[]> {
    if (!this.isConfigured()) {
      console.warn('Facebook API non configurée, retour de données vides');
      return [];
    }

    const cacheKey = `fb:search:${keywords.join('+')}`;
    try {
      const cached = await cacheService.getAPIResponse<Mention[]>(cacheKey);
      if (cached) return cached;
    } catch {}

    if (!this.checkRateLimit()) {
      console.warn('Rate limit Facebook atteint, attente de reset');
      throw new Error('Rate limit Facebook dépassé. Réessayez dans une heure.');
    }

    try {
      const searchQuery = keywords.join(' OR ');
      
      // Note: Facebook Graph API Search est limitée aux pages publiques
      // Pour un monitoring complet, il faudrait des accès spéciaux
      const response = await axios.get<FacebookSearchResponse>(`${this.baseURL}/search`, {
        params: {
          q: searchQuery,
          type: 'post',
          limit: 25,
          access_token: this.accessToken,
          fields: 'id,message,story,created_time,from{name,id},likes.summary(true),comments.summary(true),shares,permalink_url'
        },
        timeout: 10000
      });

      this.decrementRateLimit();

      const mentions = response.data.data.map(post => this.formatFacebookMention(post, keywords));
      try { await cacheService.cacheAPIResponse(cacheKey, mentions, 600); } catch {}
      
      console.log(`Facebook API: ${mentions.length} mentions trouvées pour [${keywords.join(', ')}]`);
      return mentions;

    } catch (error) {
      console.error('Erreur Facebook API:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          // Rate limit dépassé côté Facebook
          this.rateLimitRemaining = 0;
          throw new Error('Rate limit Facebook API dépassé');
        }
        
        if (error.response?.status === 403) {
          throw new Error('Accès Facebook API refusé - vérifiez vos tokens');
        }
      }
      
      throw new Error(`Erreur Facebook API: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche des mentions sur Instagram (via Facebook Graph API)
   */
  async searchInstagramPosts(): Promise<Mention[]> {
    if (!this.isConfigured()) {
      console.warn('Instagram API non configurée, retour de données vides');
      return [];
    }

    if (!this.checkRateLimit()) {
      console.warn('Rate limit Instagram atteint, attente de reset');
      throw new Error('Rate limit Instagram dépassé. Réessayez dans une heure.');
    }

    try {
      // Instagram Basic Display API ou Instagram Graph API
      // Note: nécessite un Business Account connecté pour monitoring complet
      
      console.warn('Instagram search non implémentée - nécessite Instagram Business Account');
      return [];

    } catch (error) {
      console.error('Erreur Instagram API:', error);
      throw new Error(`Erreur Instagram API: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Formate une mention Facebook au format standard
   */
  private formatFacebookMention(post: FacebookMention, keywords: string[]): Mention {
    const content = post.message || post.story || '';
    const matchedKeywords = keywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    return {
      id: `fb_${post.id}`,
      case_id: '', // sera assigné par le moteur de monitoring
      platform: 'facebook',
      external_id: post.id,
      content,
      author_name: post.from?.name || 'Utilisateur Facebook',
      author_handle: post.from?.name,
      author_id: post.from?.id,
      url: post.permalink_url,
      published_at: post.created_time,
      discovered_at: new Date().toISOString(),
      sentiment_score: null, // sera calculé par le service d'analyse
      urgency_score: this.calculateUrgencyScore(content, matchedKeywords),
      keywords_matched: matchedKeywords,
      status: 'new',
      metadata: {
        likes_count: post.likes?.summary?.total_count || 0,
        comments_count: post.comments?.summary?.total_count || 0,
        shares_count: post.shares?.count || 0,
        platform_data: {
          facebook_id: post.id,
          from_id: post.from?.id
        }
      },
      created_at: new Date().toISOString()
    };
  }

  /**
   * Calcule un score d'urgence basique (1-10)
   */
  private calculateUrgencyScore(content: string, matchedKeywords: string[]): number {
    let score = 5; // score de base

    // Mots-clés critiques augmentent l'urgence
    const criticalWords = ['scandale', 'boycott', 'arnaque', 'problème', 'déçu', 'terrible', 'horrible'];
    const hasCriticalWords = criticalWords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    if (hasCriticalWords) score += 3;
    
    // Nombre de mots-clés matchés
    score += Math.min(matchedKeywords.length, 2);
    
    // Longueur du contenu (plus c'est long, plus c'est détaillé)
    if (content.length > 200) score += 1;
    
    return Math.min(Math.max(score, 1), 10);
  }

  /**
   * Obtient les informations de rate limiting
   */
  getRateLimitInfo() {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: new Date(this.rateLimitResetTime),
      isLimited: this.rateLimitRemaining <= 0
    };
  }

  /**
   * Test de connectivité à l'API Facebook
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Configuration manquante: FACEBOOK_APP_ID et FACEBOOK_APP_SECRET requis'
      };
    }

    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          access_token: this.accessToken
        },
        timeout: 5000
      });

      return {
        success: true,
        message: `Connexion Facebook OK - App ID: ${response.data.id}`
      };

    } catch (error) {
      return {
        success: false,
        message: `Erreur connexion Facebook: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}

// Instance singleton
export const facebookAPI = new FacebookAPIService();
export default facebookAPI;
