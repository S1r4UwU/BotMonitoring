/**
 * Service de stockage local pour fonctionnement sans Supabase
 */

import { Case, Mention, DashboardMetrics } from '@/models/types';

const STORAGE_KEYS = {
  CASES: 'socialguard-cases',
  MENTIONS: 'socialguard-mentions',
  USER: 'socialguard-user'
};

export class LocalStorageService {
  
  // Gestion des cas
  static getCases(): Case[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CASES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static saveCases(cases: Case[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    } catch (error) {
      console.error('Erreur sauvegarde cas:', error);
    }
  }

  static createCase(caseData: Omit<Case, 'id' | 'created_at' | 'updated_at' | 'owner_id'>): Case {
    const newCase: Case = {
      ...caseData,
      id: 'case-' + Date.now(),
      owner_id: 'user-local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const cases = this.getCases();
    cases.push(newCase);
    this.saveCases(cases);
    
    console.log('[INFO] Cas créé localement:', newCase);
    return newCase;
  }

  // Gestion des mentions
  static getMentions(): Mention[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MENTIONS);
      return stored ? JSON.parse(stored) : this.getDefaultMentions();
    } catch {
      return this.getDefaultMentions();
    }
  }

  static saveMentions(mentions: Mention[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MENTIONS, JSON.stringify(mentions));
    } catch (error) {
      console.error('Erreur sauvegarde mentions:', error);
    }
  }

  // Mentions par défaut pour le test
  private static getDefaultMentions(): Mention[] {
    return [
      {
        id: 'mention-local-1',
        case_id: 'case-default',
        platform: 'reddit',
        external_id: 'reddit_123',
        content: 'Test de SocialGuard - cette mention est stockée localement pour démonstration',
        author_name: 'TestUser',
        author_handle: 'testuser',
        author_id: 'test123',
        url: 'https://reddit.com/test/123',
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        discovered_at: new Date().toISOString(),
        sentiment_score: 2,
        urgency_score: 5,
        keywords_matched: ['socialguard', 'test'],
        status: 'new',
        metadata: {
          upvotes: 10,
          comments_count: 3
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'mention-local-2',
        case_id: 'case-default',
        platform: 'facebook',
        external_id: 'fb_456',
        content: 'Application de monitoring intéressante, à surveiller de près...',
        author_name: 'Social Media Manager',
        author_handle: 'smm.expert',
        author_id: 'fb456',
        url: 'https://facebook.com/post/456',
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        discovered_at: new Date().toISOString(),
        sentiment_score: -1,
        urgency_score: 6,
        keywords_matched: ['monitoring'],
        status: 'new',
        metadata: {
          likes_count: 5,
          comments_count: 8
        },
        created_at: new Date().toISOString()
      }
    ];
  }

  // Calcul des métriques
  static calculateMetrics(): DashboardMetrics {
    const mentions = this.getMentions();
    const cases = this.getCases();

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

  // Initialisation avec données par défaut
  static initializeDefaultData(): void {
    const cases = this.getCases();
    const mentions = this.getMentions();

    // Créer un cas par défaut s'il n'y en a pas
    if (cases.length === 0) {
      this.createCase({
        name: 'Surveillance Principale',
        description: 'Monitoring par défaut de votre marque',
        keywords: ['socialguard', 'monitoring', 'test'],
        platforms: ['reddit', 'facebook'],
        status: 'active'
      });
    }

    // Sauvegarder les mentions par défaut si elles n'existent pas
    if (mentions.length === this.getDefaultMentions().length) {
      this.saveMentions(mentions);
    }

    console.log('[INFO] Données locales initialisées');
  }

  // Mise à jour statut mention
  static updateMentionStatus(id: string, status: Mention['status']): void {
    const mentions = this.getMentions();
    const updatedMentions = mentions.map(mention => 
      mention.id === id ? { ...mention, status } : mention
    );
    this.saveMentions(updatedMentions);
    console.log(`[INFO] Mention ${id} mise à jour: ${status}`);
  }

  // Reset des données locales
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('[INFO] Toutes les données locales supprimées');
  }
}
