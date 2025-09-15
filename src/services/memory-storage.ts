/**
 * Service de stockage en mémoire pour fonctionnement sans Supabase
 * Alternative à localStorage qui fonctionne côté serveur
 */

import { Case, Mention, DashboardMetrics } from '@/models/types';

// Stockage global en mémoire (persistant durant la session serveur)
let casesStore: Case[] = [];
let mentionsStore: Mention[] = [];

export class MemoryStorageService {
  
  // Initialiser avec des données par défaut
  static initialize(): void {
    if (casesStore.length === 0) {
      casesStore = [
        {
          id: 'default-case-1',
          name: 'Surveillance Principale',
          description: 'Monitoring par défaut de votre marque',
          keywords: ['socialguard', 'monitoring', 'test'],
          platforms: ['reddit', 'facebook'],
          status: 'active',
          owner_id: 'user-standalone',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }

    if (mentionsStore.length === 0) {
      mentionsStore = [
        {
          id: 'mention-memory-1',
          case_id: 'default-case-1',
          platform: 'reddit',
          external_id: 'reddit_memory_1',
          content: 'Quelqu\'un connaît SocialGuard ? Ça a l\'air intéressant pour le monitoring des réseaux sociaux.',
          author_name: 'TechUser42',
          author_handle: 'techuser42',
          author_id: 'reddit_user_42',
          url: 'https://reddit.com/r/technology/comments/memory_1',
          published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          discovered_at: new Date().toISOString(),
          sentiment_score: 1,
          urgency_score: 5,
          keywords_matched: ['socialguard', 'monitoring'],
          status: 'new',
          metadata: {
            upvotes: 15,
            comments_count: 4,
            platform_data: { subreddit: 'technology' }
          },
          created_at: new Date().toISOString()
        },
        {
          id: 'mention-memory-2',
          case_id: 'default-case-1', 
          platform: 'facebook',
          external_id: 'fb_memory_2',
          content: 'Test de monitoring avec SocialGuard - les résultats sont encourageants pour la détection.',
          author_name: 'Digital Marketing Pro',
          author_handle: 'dm.pro.2024',
          author_id: 'fb_user_pro',
          url: 'https://facebook.com/post/memory_2',
          published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          discovered_at: new Date().toISOString(),
          sentiment_score: 2,
          urgency_score: 4,
          keywords_matched: ['socialguard', 'monitoring', 'test'],
          status: 'new',
          metadata: {
            likes_count: 8,
            comments_count: 2,
            shares_count: 1
          },
          created_at: new Date().toISOString()
        }
      ];
    }

    console.log('[INFO] Memory storage initialisé:', {
      cases: casesStore.length,
      mentions: mentionsStore.length
    });
  }

  // Gestion des cas
  static getCases(): Case[] {
    this.initialize();
    return [...casesStore];
  }

  static createCase(caseData: Omit<Case, 'id' | 'created_at' | 'updated_at' | 'owner_id'>): Case {
    this.initialize();
    
    const newCase: Case = {
      ...caseData,
      id: 'case-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      owner_id: 'user-standalone',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    casesStore.push(newCase);
    console.log('[INFO] Cas créé en mémoire:', newCase);
    return newCase;
  }

  static updateCase(id: string, updates: Partial<Case>): Case | null {
    this.initialize();
    
    const index = casesStore.findIndex(c => c.id === id);
    if (index === -1) return null;

    casesStore[index] = {
      ...casesStore[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    console.log('[INFO] Cas mis à jour:', id);
    return casesStore[index];
  }

  static deleteCase(id: string): boolean {
    this.initialize();
    
    const index = casesStore.findIndex(c => c.id === id);
    if (index === -1) return false;

    casesStore.splice(index, 1);
    
    // Supprimer aussi les mentions liées
    mentionsStore = mentionsStore.filter(m => m.case_id !== id);
    
    console.log('[INFO] Cas supprimé:', id);
    return true;
  }

  // Gestion des mentions
  static getMentions(): Mention[] {
    this.initialize();
    return [...mentionsStore];
  }

  static createMention(mentionData: Omit<Mention, 'id' | 'created_at' | 'discovered_at'>): Mention {
    this.initialize();
    
    const newMention: Mention = {
      ...mentionData,
      id: 'mention-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      discovered_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    mentionsStore.push(newMention);
    console.log('[INFO] Mention créée en mémoire:', newMention.id);
    return newMention;
  }

  static updateMentionStatus(id: string, status: Mention['status']): void {
    this.initialize();
    
    const index = mentionsStore.findIndex(m => m.id === id);
    if (index !== -1) {
      mentionsStore[index] = {
        ...mentionsStore[index],
        status
      };
      console.log('[INFO] Statut mention mis à jour:', id, '->', status);
    }
  }

  // Calcul des métriques RÉELLES
  static calculateMetrics(): DashboardMetrics {
    this.initialize();
    
    const mentions = mentionsStore;
    const cases = casesStore;

    const totalMentions = mentions.length;
    const newMentions = mentions.filter(m => 
      new Date(m.discovered_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    const sentimentDistribution = mentions.reduce((acc, mention) => {
      if (mention.sentiment_score === null) return acc;
      
      if (mention.sentiment_score > 1) {
        acc.positive++;
      } else if (mention.sentiment_score < -1) {
        acc.negative++;
      } else {
        acc.neutral++;
      }
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const platformBreakdown = mentions.reduce((acc, mention) => {
      acc[mention.platform] = (acc[mention.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const respondedMentions = mentions.filter(m => m.status === 'responded').length;
    const responseRate = totalMentions > 0 ? (respondedMentions / totalMentions) * 100 : 0;
    const activeCases = cases.filter(c => c.status === 'active').length;
    const criticalAlerts = mentions.filter(m => m.urgency_score >= 8).length;

    return {
      total_mentions: totalMentions,
      new_mentions: newMentions,
      sentiment_distribution: sentimentDistribution,
      platform_breakdown: platformBreakdown,
      response_rate: responseRate,
      avg_response_time: 45,
      active_cases: activeCases,
      critical_alerts: criticalAlerts,
    };
  }

  // Ajouter des mentions depuis APIs externes
  static addMentionsFromAPI(mentions: Mention[]): number {
    this.initialize();
    
    let addedCount = 0;
    
    mentions.forEach(mention => {
      // Éviter les doublons
      const exists = mentionsStore.some(m => m.external_id === mention.external_id);
      if (!exists) {
        mentionsStore.push({
          ...mention,
          id: 'mention-api-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          discovered_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
        addedCount++;
      }
    });

    console.log(`[INFO] ${addedCount} nouvelles mentions ajoutées depuis API`);
    return addedCount;
  }

  // Debug : obtenir toutes les données
  static getDebugInfo() {
    this.initialize();
    
    return {
      cases: casesStore,
      mentions: mentionsStore,
      stats: this.calculateMetrics(),
      lastUpdate: new Date().toISOString()
    };
  }

  // Reset complet
  static clearAll(): void {
    casesStore = [];
    mentionsStore = [];
    console.log('[INFO] Stockage mémoire vidé');
  }
}
