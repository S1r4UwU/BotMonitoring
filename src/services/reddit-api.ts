/**
 * Service Reddit API
 * Budget-friendly : utilise l'API Reddit gratuite (100 req/minute)
 */

import axios from 'axios';
import { Mention } from '@/models/types';

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    created_utc: number;
    score: number;
    num_comments: number;
    ups: number;
    permalink: string;
    subreddit: string;
    url: string;
  };
}

interface RedditSearchResponse {
  data: {
    children: RedditPost[];
    after?: string;
  };
}

class RedditAPIService {
  private clientId: string;
  private clientSecret: string;
  private userAgent: string;
  private accessToken: string = '';
  private tokenExpiresAt = 0;
  private baseURL = 'https://www.reddit.com';
  private oauthURL = 'https://oauth.reddit.com';
  private rateLimitRemaining = 100; // Limite par minute
  private rateLimitResetTime = 0;

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    this.userAgent = process.env.REDDIT_USER_AGENT || 'SocialGuard/1.0 by SocialGuard';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Reddit API non configurée : REDDIT_CLIENT_ID et REDDIT_CLIENT_SECRET manquants');
    }
  }

  /**
   * Vérifie si l'API est configurée
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Vérifie le rate limiting
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset du compteur si une minute s'est écoulée
    if (now > this.rateLimitResetTime) {
      this.rateLimitRemaining = 100;
      this.rateLimitResetTime = now + 60 * 1000; // +1 minute
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
   * Authentification OAuth2 pour obtenir un access token
   */
  private async authenticate(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Reddit API non configurée');
    }

    const now = Date.now();
    
    // Token encore valide
    if (this.accessToken && now < this.tokenExpiresAt) {
      return;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(`${this.baseURL}/api/v1/access_token`, 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.userAgent
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = now + (response.data.expires_in - 60) * 1000; // -60s de sécurité
      
      console.log('Reddit API: Authentification réussie');

    } catch (error) {
      console.error('Erreur authentification Reddit:', error);
      throw new Error('Échec authentification Reddit API');
    }
  }

  /**
   * Recherche des mentions par mots-clés sur Reddit
   */
  async searchPosts(keywords: string[], subreddits: string[] = [], limit = 25): Promise<Mention[]> {
    if (!this.isConfigured()) {
      console.warn('Reddit API non configurée, retour de données vides');
      return [];
    }

    if (!this.checkRateLimit()) {
      console.warn('Rate limit Reddit atteint, attente de reset');
      throw new Error('Rate limit Reddit dépassé. Réessayez dans une minute.');
    }

    try {
      await this.authenticate();

      const searchQuery = keywords.join(' OR ');
      let searchURL = '/search.json';
      
      // Recherche dans des subreddits spécifiques ou globale
      const subredditParam = subreddits.length > 0 ? subreddits.join('+') : 'all';
      
      const params = {
        q: searchQuery,
        sort: 'new',
        limit,
        t: 'week', // posts de la semaine
        restrict_sr: subreddits.length > 0 ? 'true' : 'false',
        type: 'link,self' // posts et self-posts
      };

      const response = await axios.get<RedditSearchResponse>(`${this.oauthURL}/r/${subredditParam}${searchURL}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.userAgent
        },
        params,
        timeout: 10000
      });

      this.decrementRateLimit();

      const mentions = response.data.data.children.map(post => this.formatRedditMention(post, keywords));
      
      console.log(`Reddit API: ${mentions.length} mentions trouvées pour [${keywords.join(', ')}]`);
      return mentions;

    } catch (error) {
      console.error('Erreur Reddit API:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          this.rateLimitRemaining = 0;
          throw new Error('Rate limit Reddit API dépassé');
        }
        
        if (error.response?.status === 401) {
          // Token expiré, forcer une nouvelle authentification
          this.accessToken = '';
          this.tokenExpiresAt = 0;
          throw new Error('Token Reddit expiré - nouvelle authentification requise');
        }
      }
      
      throw new Error(`Erreur Reddit API: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche dans un subreddit spécifique
   */
  async searchInSubreddit(subreddit: string, keywords: string[], limit = 25): Promise<Mention[]> {
    return this.searchPosts(keywords, [subreddit], limit);
  }

  /**
   * Obtient les posts tendances d'un subreddit (sans mots-clés spécifiques)
   */
  async getTrendingPosts(subreddit: string, limit = 10): Promise<Mention[]> {
    if (!this.isConfigured()) {
      console.warn('Reddit API non configurée, retour de données vides');
      return [];
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit Reddit dépassé');
    }

    try {
      await this.authenticate();

      const response = await axios.get<RedditSearchResponse>(`${this.oauthURL}/r/${subreddit}/hot.json`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.userAgent
        },
        params: { limit },
        timeout: 10000
      });

      this.decrementRateLimit();

      const mentions = response.data.data.children.map(post => 
        this.formatRedditMention(post, []) // pas de keywords spécifiques
      );
      
      return mentions;

    } catch (error) {
      console.error('Erreur Reddit trending posts:', error);
      throw new Error(`Erreur Reddit trending: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Formate une mention Reddit au format standard
   */
  private formatRedditMention(post: RedditPost, keywords: string[]): Mention {
    const content = post.data.title + (post.data.selftext ? `\n\n${post.data.selftext}` : '');
    const matchedKeywords = keywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    return {
      id: `reddit_${post.data.id}`,
      case_id: '', // sera assigné par le moteur de monitoring
      platform: 'reddit',
      external_id: post.data.id,
      content: content.slice(0, 2000), // limiter la taille
      author_name: post.data.author,
      author_handle: post.data.author,
      author_id: post.data.author,
      url: `https://www.reddit.com${post.data.permalink}`,
      published_at: new Date(post.data.created_utc * 1000).toISOString(),
      discovered_at: new Date().toISOString(),
      sentiment_score: null,
      urgency_score: this.calculateUrgencyScore(content, matchedKeywords, post.data.score),
      keywords_matched: matchedKeywords,
      status: 'new',
      metadata: {
        upvotes: post.data.ups,
        score: post.data.score,
        comments_count: post.data.num_comments,
        subreddit: post.data.subreddit,
        platform_data: {
          reddit_id: post.data.id,
          subreddit: post.data.subreddit,
          is_self: post.data.url.includes('reddit.com')
        }
      },
      created_at: new Date().toISOString()
    };
  }

  /**
   * Calcule un score d'urgence basé sur le contenu et les métriques Reddit
   */
  private calculateUrgencyScore(content: string, matchedKeywords: string[], score: number): number {
    let urgency = 5; // score de base

    // Score Reddit (upvotes - downvotes)
    if (score > 100) urgency += 2;
    else if (score > 50) urgency += 1;
    else if (score < 0) urgency += 2; // posts controversés

    // Mots-clés critiques
    const criticalWords = ['scam', 'boycott', 'terrible', 'worst', 'fraud', 'problem'];
    const hasCriticalWords = criticalWords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    if (hasCriticalWords) urgency += 2;
    
    // Nombre de mots-clés matchés
    urgency += Math.min(matchedKeywords.length, 2);
    
    return Math.min(Math.max(urgency, 1), 10);
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
   * Test de connectivité à l'API Reddit
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Configuration manquante: REDDIT_CLIENT_ID et REDDIT_CLIENT_SECRET requis'
      };
    }

    try {
      await this.authenticate();
      
      // Test avec une requête simple
      const response = await axios.get(`${this.oauthURL}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.userAgent
        },
        timeout: 5000
      });

      return {
        success: true,
        message: 'Connexion Reddit OK'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erreur connexion Reddit: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}

// Instance singleton
export const redditAPI = new RedditAPIService();
export default redditAPI;
