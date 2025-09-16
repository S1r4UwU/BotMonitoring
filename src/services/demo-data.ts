// Service pour générer des données de démo/test pour le MVP
// Permet de tester le dashboard sans avoir encore configuré les APIs externes

import { Mention, Case, DashboardMetrics } from '@/models/types';

// Données de démo pour les cas
export const demoCases: Case[] = [
  {
    id: 'demo-case-1',
    name: 'Surveillance Marque Principale',
    description: 'Monitoring de la réputation de notre marque sur tous les canaux',
    keywords: ['notre-marque', 'produit-phare', 'service-client'],
    platforms: ['facebook', 'instagram', 'reddit'],
    status: 'active',
    owner_id: 'demo-user',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-case-2',
    name: 'Concurrence - Analyse',
    description: 'Surveillance des mentions de nos concurrents',
    keywords: ['concurrent-a', 'concurrent-b'],
    platforms: ['reddit'],
    status: 'active',
    owner_id: 'demo-user',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// Données de démo pour les mentions
export const demoMentions: Mention[] = [
  {
    id: 'mention-1',
    case_id: 'demo-case-1',
    platform: 'facebook',
    external_id: 'fb_post_123456',
    content: 'Super expérience avec votre service client ! Ils ont résolu mon problème très rapidement. Je recommande vivement !',
    author_name: 'Marie Dupont',
    author_handle: 'marie.dupont',
    author_id: 'fb_user_123',
    url: 'https://facebook.com/post/123456',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    discovered_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    sentiment_score: 4,
    urgency_score: 3,
    keywords_matched: ['service-client'],
    status: 'new',
    metadata: {
      likes_count: 15,
      shares_count: 3,
      comments_count: 2
    },
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mention-2',
    case_id: 'demo-case-1',
    platform: 'instagram',
    external_id: 'ig_post_789012',
    content: 'Déçu de mon dernier achat... La qualité n\'est plus ce qu\'elle était. J\'espère que vous allez améliorer cela.',
    author_name: 'Jean Martin',
    author_handle: 'jean.martin.pro',
    author_id: 'ig_user_789',
    url: 'https://instagram.com/p/789012',
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    discovered_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    sentiment_score: -3,
    urgency_score: 7,
    keywords_matched: ['notre-marque'],
    status: 'new',
    metadata: {
      likes_count: 8,
      comments_count: 5
    },
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mention-3',
    case_id: 'demo-case-2',
    platform: 'reddit',
    external_id: 'reddit_post_345678',
    content: 'Quelqu\'un a déjà testé concurrent-a vs notre-marque ? J\'hésite entre les deux pour mon prochain projet.',
    author_name: 'TechEnthusiast42',
    author_handle: 'TechEnthusiast42',
    author_id: 'reddit_user_345',
    url: 'https://reddit.com/r/technology/comments/345678',
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    discovered_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    sentiment_score: 0,
    urgency_score: 5,
    keywords_matched: ['concurrent-a', 'notre-marque'],
    status: 'processed',
    metadata: {
      upvotes: 12,
      downvotes: 2,
      comments_count: 8
    },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mention-4',
    case_id: 'demo-case-1',
    platform: 'facebook',
    external_id: 'fb_post_901234',
    content: 'Attention à cette marque ! J\'ai eu des problèmes avec leur produit-phare. Service client injoignable !',
    author_name: 'Client Mécontent',
    author_handle: 'client.mecontent',
    author_id: 'fb_user_901',
    url: 'https://facebook.com/post/901234',
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    discovered_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    sentiment_score: -4,
    urgency_score: 9,
    keywords_matched: ['produit-phare', 'service-client'],
    status: 'responded',
    metadata: {
      likes_count: 3,
      shares_count: 1,
      comments_count: 12
    },
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mention-5',
    case_id: 'demo-case-1',
    platform: 'instagram',
    external_id: 'ig_story_567890',
    content: 'Juste reçu mon nouveau produit-phare ! Unboxing en story ! 📦✨ #satisfied',
    author_name: 'Influencer Mode',
    author_handle: 'influencer.mode',
    author_id: 'ig_user_567',
    url: 'https://instagram.com/stories/567890',
    published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    discovered_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    sentiment_score: 3,
    urgency_score: 4,
    keywords_matched: ['produit-phare'],
    status: 'new',
    metadata: {
      views_count: 1250,
      reactions_count: 45
    },
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  }
];

// Générer des métriques de démo basées sur les données ci-dessus
export const generateDemoMetrics = (): DashboardMetrics => {
  const totalMentions = demoMentions.length;
  const newMentions = demoMentions.filter(m => 
    new Date(m.discovered_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  // Distribution du sentiment
  const sentimentDistribution = demoMentions.reduce((acc, mention) => {
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

  // Répartition par plateforme
  const platformBreakdown = demoMentions.reduce((acc, mention) => {
    acc[mention.platform] = (acc[mention.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Autres métriques
  const respondedMentions = demoMentions.filter(m => m.status === 'responded').length;
  const responseRate = totalMentions > 0 ? (respondedMentions / totalMentions) * 100 : 0;
  const activeCases = demoCases.filter(c => c.status === 'active').length;
  const criticalAlerts = demoMentions.filter(m => m.urgency_score >= 8).length;

  return {
    total_mentions: totalMentions,
    new_mentions: newMentions,
    sentiment_distribution: sentimentDistribution,
    platform_breakdown: platformBreakdown,
    response_rate: responseRate,
    avg_response_time: 45, // minutes (valeur de démo)
    active_cases: activeCases,
    critical_alerts: criticalAlerts,
  };
};

// Fonction pour vérifier si on est en mode démo
export const isDemoMode = (): boolean => {
  // DÉSACTIVER le mode démo - toujours retourner false pour utiliser vraies données
  return false;
};

// Service pour mélanger les données réelles et de démo
export class DemoDataService {
  static async getMentions(
    filters?: { platform?: Mention['platform']; status?: Mention['status'] },
    page = 1,
    limit = 20
  ) {
    if (!isDemoMode()) {
      return { data: [], count: 0 } as const;
    }

    let filteredMentions = [...demoMentions];

    if (filters?.platform) {
      filteredMentions = filteredMentions.filter(m => m.platform === filters.platform);
    }

    if (filters?.status) {
      filteredMentions = filteredMentions.filter(m => m.status === filters.status);
    }

    const offset = (page - 1) * limit;
    const paginatedMentions = filteredMentions.slice(offset, offset + limit);

    return {
      data: paginatedMentions,
      count: filteredMentions.length
    } as const;
  }

  static async getMetrics() {
    if (!isDemoMode()) {
      return null;
    }

    return generateDemoMetrics();
  }

  static async getCases() {
    if (!isDemoMode()) {
      return [] as const;
    }

    return demoCases;
  }
}
