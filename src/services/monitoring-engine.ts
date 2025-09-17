/**
 * Moteur de Monitoring SocialGuard
 * Orchestration des APIs, scheduling, et traitement des mentions
 */

import { createAdminClient } from '@/lib/supabase';
import { facebookAPI } from './facebook-api';
import { redditAPI } from './reddit-api';
import { youtubeAPI } from './youtube-api';
import { hackerNewsAPI } from './hackernews-api';
import { newsAPI } from './news-api';
import { mastodonAPI } from './mastodon-api';
import { telegramAPI } from './telegram-api';
import { discordAPI } from './discord-api';
import { Mention } from '@/models/types';
import { CircuitBreaker, defaultCircuitConfig } from '@/lib/circuit-breaker';
import { isDemoMode } from './demo-data';

// Métriques détaillées par plateforme (déclarée au niveau module)
interface PlatformMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  lastCallTime: Date;
  rateLimitHit: boolean;
  quotaUsed: number;
  quotaLimit: number;
}

interface MonitoringJob {
  caseId: string;
  keywords: string[];
  platforms: string[];
  interval: number; // minutes
  lastRun: Date;
  isRunning: boolean;
  filters?: {
    languages?: string[];
    excludeLanguages?: string[];
    languageConfidenceThreshold?: number;
    subreddits?: string[];
  };
}

interface MonitoringStats {
  totalMentions: number;
  newMentions: number;
  errorsCount: number;
  lastRun: Date;
  nextRun: Date;
  rateLimit: {
    facebook: unknown;
    reddit: unknown;
  };
}

class MonitoringEngine {
  private jobs: Map<string, MonitoringJob> = new Map();
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  private stats: MonitoringStats = {
    totalMentions: 0,
    newMentions: 0,
    errorsCount: 0,
    lastRun: new Date(),
    nextRun: new Date(),
    rateLimit: {
      facebook: null,
      reddit: null
    }
  };

  private platformMetrics: Map<string, PlatformMetrics> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map([
    ['facebook', new CircuitBreaker(defaultCircuitConfig)],
    ['reddit', new CircuitBreaker(defaultCircuitConfig)],
    ['youtube', new CircuitBreaker(defaultCircuitConfig)],
    ['hackernews', new CircuitBreaker(defaultCircuitConfig)],
    ['newsapi', new CircuitBreaker(defaultCircuitConfig)],
    ['mastodon', new CircuitBreaker(defaultCircuitConfig)],
    ['telegram', new CircuitBreaker(defaultCircuitConfig)],
    ['discord', new CircuitBreaker(defaultCircuitConfig)],
  ]);

  constructor() {
    this.initializeEngine();
  }

  /**
   * Initialise le moteur de monitoring
   */
  private async initializeEngine() {
    if (this.isInitialized) return;

    console.log('🚀 Initialisation du moteur de monitoring SocialGuard');

    try {
      console.log('📋 Initialisation avec Supabase DB');

      // Charger les cas actifs depuis la base de données
      await this.loadActiveCases();
      
      this.isInitialized = true;
      console.log('✅ Moteur de monitoring initialisé avec succès');
      
    } catch {
      console.error('❌ Erreur initialisation moteur de monitoring');
    }
  }

  /**
   * Charge les cas de monitoring actifs depuis la DB
   */
  private async loadActiveCases() {
    try {
      // FORCER lecture depuis vraie DB Supabase
      const supabase = createAdminClient();
      const { data: cases, error } = await supabase
        .from('cases')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error('[ERROR] Chargement cas actifs DB:', error);
        // Continuer avec un cas par défaut si DB échoue
        const fallbackCases = [{
          id: 'fallback-case',
          name: 'Cas de fallback',
          keywords: JSON.stringify(['socialguard', 'monitoring']),
          platforms: JSON.stringify(['reddit']),
          status: 'active'
        }];
        fallbackCases.forEach(caseData => {
          const keywords = JSON.parse(caseData.keywords);
          const platforms = JSON.parse(caseData.platforms);
          this.startMonitoringJob({
            caseId: caseData.id,
            keywords: keywords || [],
            platforms: platforms || [],
            interval: 15, // 15 minutes par défaut
            lastRun: new Date(0),
            isRunning: false,
          });
        });
        return;
      }

      console.log(`📊 ${cases?.length || 0} cas actifs chargés depuis Supabase DB`);

      // Démarrer les jobs pour chaque cas
      cases?.forEach(caseData => {
        const keywords = typeof caseData.keywords === 'string' ? JSON.parse(caseData.keywords) : caseData.keywords;
        const platforms = typeof caseData.platforms === 'string' ? JSON.parse(caseData.platforms) : caseData.platforms;
        const filters = typeof (caseData as { filters?: string | Record<string, unknown> }).filters === 'string'
          ? JSON.parse((caseData as { filters?: string }).filters as string)
          : (caseData as { filters?: Record<string, unknown> }).filters;
        
        this.startMonitoringJob({
          caseId: caseData.id,
          keywords: keywords || [],
          platforms: platforms || [],
          interval: 15, // 15 minutes par défaut
          lastRun: new Date(0),
          isRunning: false,
          filters
        });
      });

    } catch {
      console.error('[ERROR] Erreur chargement cas actifs');
      // Continuer en mode dégradé
    }
  }

  /**
   * Démarre un job de monitoring pour un cas
   */
  startMonitoringJob(job: MonitoringJob) {
    // Arrêter le job existant s'il y en a un
    this.stopMonitoringJob(job.caseId);

    // Sauvegarder le job
    this.jobs.set(job.caseId, job);

    // Démarrer le monitoring avec l'intervalle spécifié
    const intervalMs = job.interval * 60 * 1000;
    
    const intervalId = setInterval(async () => {
      await this.runMonitoringJob(job.caseId);
    }, intervalMs);

    this.intervalIds.set(job.caseId, intervalId);

    console.log(`▶️ Job monitoring démarré pour cas ${job.caseId} (intervalle: ${job.interval}min)`);

    // Lancer immédiatement le premier scan
    this.runMonitoringJob(job.caseId);
  }

  /**
   * Arrête un job de monitoring
   */
  stopMonitoringJob(caseId: string) {
    const intervalId = this.intervalIds.get(caseId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervalIds.delete(caseId);
    }

    const job = this.jobs.get(caseId);
    if (job) {
      job.isRunning = false;
    }

    console.log(`⏹️ Job monitoring arrêté pour cas ${caseId}`);
  }

  /**
   * Exécute un job de monitoring pour un cas spécifique
   */
  private async runMonitoringJob(caseId: string) {
    const job = this.jobs.get(caseId);
    if (!job || job.isRunning) {
      return;
    }

    console.log(`🔍 Démarrage scan monitoring pour cas ${caseId}`);
    
    job.isRunning = true;
    job.lastRun = new Date();

    try {
      let allMentions: Mention[] = [];

        // Scanner les différentes plateformes avec VRAIES APIs
        const scanPromises = job.platforms.map(async platform => {
          switch (platform) {
            case 'facebook':
              return await this.scanFacebook(this.expandFlatKeywords(job.keywords), caseId);
            case 'reddit':
              return await this.scanReddit(this.expandFlatKeywords(job.keywords), caseId, job.filters);
            case 'youtube':
              return await this.scanYouTube(this.expandFlatKeywords(job.keywords), caseId);
            case 'hackernews':
              return await this.scanHackerNews(this.expandFlatKeywords(job.keywords), caseId);
            case 'newsapi':
              return await this.scanNews(this.expandFlatKeywords(job.keywords), caseId, job.filters);
            case 'mastodon':
              return await this.scanMastodon(this.expandFlatKeywords(job.keywords), caseId);
            case 'telegram':
              return await this.scanTelegram(this.expandFlatKeywords(job.keywords), caseId);
            case 'discord':
              return await this.scanDiscord(this.expandFlatKeywords(job.keywords), caseId);
            default:
              console.warn(`Plateforme non supportée: ${platform}`);
              return [];
          }
        });

        const results = await Promise.allSettled(scanPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allMentions.push(...result.value);
          } else {
            console.error(`Erreur scan ${job.platforms[index]}:`, result.reason);
            this.stats.errorsCount++;
          }
        });

      // Filtrage logique (ET/OU/NON) sur le contenu
      if (allMentions.length > 0 && job.keywords && job.keywords.length > 0) {
        try {
          const { AdvancedSearchEngine } = await import('./search/advanced-search');
          const engine = new AdvancedSearchEngine();
          const groups = job.keywords.length === 1
            ? (AdvancedSearchEngine as unknown as { parseQueryToGroups: (q: string) => Array<{ operator: 'ET' | 'OU' | 'NON'; keywords: string[] }> }).parseQueryToGroups(job.keywords[0])
            : [ { operator: 'ET', keywords: job.keywords } ];
          allMentions = allMentions.filter(m => engine.matchesCriteria(
            m.content || '',
            groups as Array<{ operator: 'ET' | 'OU' | 'NON'; keywords: string[] }>
          ));
        } catch {
          console.warn('AdvancedSearchEngine indisponible, pas de filtrage logique');
        }
      }

      // Filtrage par langue si défini
      if (allMentions.length > 0 && (job.filters?.languages?.length || job.filters?.excludeLanguages?.length)) {
        try {
          const { LanguageDetectionService } = await import('./nlp/language-detection');
          const langService = new LanguageDetectionService();
          const allowed = job.filters?.languages || [];
          const excluded = job.filters?.excludeLanguages || [];
          const requireAllowed = allowed.length > 0;
          const minConfidence = job.filters?.languageConfidenceThreshold ?? 0.06; // seuil configurable

          allMentions = allMentions.filter(m => {
            const { language, confidence } = langService.detectLanguageDetailed(m.content || '');

            // Si on exige une langue précise, ne garder que si détectée avec confiance suffisante
            if (requireAllowed) {
              if (confidence < minConfidence) return false; // pas assez de signal
              if (!allowed.includes(language)) return false;
            }

            // Exclusions toujours respectées si détecté
            if (excluded.length > 0 && confidence >= minConfidence && excluded.includes(language)) return false;

            return true;
          });
        } catch {
          console.warn('LanguageDetectionService indisponible, saut du filtrage langue');
        }
      }

      // Traitement et sauvegarde des mentions
      if (allMentions.length > 0) {
        await this.processMentions(allMentions, caseId);
        this.stats.newMentions += allMentions.length;
      }

      this.stats.totalMentions += allMentions.length;
      this.stats.lastRun = new Date();
      
      console.log(`✅ Scan terminé pour cas ${caseId}: ${allMentions.length} nouvelles mentions`);

    } catch {
      console.error(`❌ Erreur scan cas ${caseId}`);
      this.stats.errorsCount++;
    } finally {
      job.isRunning = false;
    }
  }

  /**
   * Aplatit les mots-clés pour l'appel API: ET∪OU (ignore NON), et retire guillemets/signes.
   * Si la requête booléenne est unique (string combinée), on parse et récupère ET∪OU.
   */
  private expandFlatKeywords(keywords: string[]): string[] {
    try {
      // Nettoyage simple des guillemets; le parsing booléen est réalisé plus haut via AdvancedSearchEngine
      return keywords.map(k => k.replace(/^['\"]|['\"]$/g, ''));
    } catch {
      return keywords;
    }
  }

  /**
   * Scanner Facebook pour des mentions
   */
  private async scanFacebook(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const start = Date.now();
      const breaker = this.circuitBreakers.get('facebook')!;
      const mentions = await this.callAPIWithRetry(() => breaker.execute(() => facebookAPI.searchFacebookPosts(keywords, 25)), 'facebook');
      await this.updateMetrics('facebook', true, Date.now() - start);
      return mentions.map(mention => ({
        ...mention,
        case_id: caseId
      }));
    } catch (error) {
      console.error('Erreur scan Facebook:', error);
      await this.updateMetrics('facebook', false, 0);
      return [];
    }
  }

  /**
   * Scanner Reddit pour des mentions
   */
  private async scanReddit(
    keywords: string[],
    caseId: string,
    filters?: { subreddits?: string[] }
  ): Promise<Mention[]> {
    try {
      const subreddits = filters?.subreddits || [];
      const start = Date.now();
      const breaker = this.circuitBreakers.get('reddit')!;
      const mentions = await this.callAPIWithRetry(() => breaker.execute(() => redditAPI.searchPosts(keywords, subreddits, 25)), 'reddit');
      await this.updateMetrics('reddit', true, Date.now() - start);
      return mentions.map(mention => ({
        ...mention,
        case_id: caseId
      }));
    } catch (error) {
      console.error('Erreur scan Reddit:', error);
      await this.updateMetrics('reddit', false, 0);
      return [];
    }
  }

  /**
   * Scanner YouTube
   */
  private async scanYouTube(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const start = Date.now();
      const breaker = this.circuitBreakers.get('youtube')!;
      const mentions = await this.callAPIWithRetry(() => breaker.execute(() => youtubeAPI.search(keywords, 25)), 'youtube');
      await this.updateMetrics('youtube', true, Date.now() - start);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan YouTube:', e);
      await this.updateMetrics('youtube', false, 0);
      return [];
    }
  }

  /**
   * Scanner Hacker News
   */
  private async scanHackerNews(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const start = Date.now();
      const mentions = await this.callAPIWithRetry(() => hackerNewsAPI.search(keywords, 50), 'hackernews');
      await this.updateMetrics('hackernews', true, Date.now() - start);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan HackerNews:', e);
      await this.updateMetrics('hackernews', false, 0);
      return [];
    }
  }

  /**
   * Scanner News API
   */
  private async scanNews(
    keywords: string[],
    caseId: string,
    filters?: { languages?: string[] }
  ): Promise<Mention[]> {
    try {
      const start = Date.now();
      const mentions = await this.callAPIWithRetry(() => newsAPI.search(keywords, filters?.languages || []), 'newsapi');
      await this.updateMetrics('newsapi', true, Date.now() - start);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan NewsAPI:', e);
      await this.updateMetrics('newsapi', false, 0);
      return [];
    }
  }

  /**
   * Scanner Mastodon
   */
  private async scanMastodon(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const start = Date.now();
      const mentions = await this.callAPIWithRetry(() => mastodonAPI.search(keywords, 40), 'mastodon');
      await this.updateMetrics('mastodon', true, Date.now() - start);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan Mastodon:', e);
      await this.updateMetrics('mastodon', false, 0);
      return [];
    }
  }

  /**
   * Scanner Telegram
   */
  private async scanTelegram(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const start = Date.now();
      const mentions = await this.callAPIWithRetry(() => telegramAPI.search(keywords, 100), 'telegram');
      await this.updateMetrics('telegram', true, Date.now() - start);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan Telegram:', e);
      await this.updateMetrics('telegram', false, 0);
      return [];
    }
  }

  /**
   * Scanner Discord (placeholder lecture)
   */
  private async scanDiscord(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const start = Date.now();
      const mentions = await this.callAPIWithRetry(() => discordAPI.search(keywords), 'discord');
      await this.updateMetrics('discord', true, Date.now() - start);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan Discord:', e);
      await this.updateMetrics('discord', false, 0);
      return [];
    }
  }

  /**
   * Traite et sauvegarde les mentions trouvées
   */
  private async processMentions(mentions: Mention[], caseId: string) {
    try {
      console.log(`[DEBUG] Traitement de ${mentions.length} mentions pour cas ${caseId}`);
      
      // FORCER sauvegarde en vraie DB Supabase
      const supabase = createAdminClient();

      // Déduplication : vérifier quelles mentions existent déjà
      const existingIds = mentions.length > 0 ? await this.checkExistingMentions(mentions.map(m => m.external_id)) : [];
      const newMentions = mentions.filter(m => !existingIds.includes(m.external_id));

      if (newMentions.length === 0) {
        console.log('ℹ️ Aucune nouvelle mention après déduplication');
        return;
      }

      // Insérer en vraie DB
      const { data, error } = await supabase
        .from('mentions')
        .insert(newMentions.map(mention => ({
          case_id: caseId,
          platform: mention.platform,
          external_id: mention.external_id,
          content: mention.content,
          author_name: mention.author_name,
          author_handle: mention.author_handle,
          url: mention.url,
          published_at: mention.published_at,
          sentiment_score: mention.sentiment_score,
          urgency_score: mention.urgency_score,
          keywords_matched: JSON.stringify(mention.keywords_matched),
          status: mention.status,
          metadata: JSON.stringify(mention.metadata || {})
        })))
        .select();

      if (error) {
        console.error('[ERROR] Insertion mentions DB failed:', error);
        throw error;
      }

      console.log(`💾 ${data?.length || 0} nouvelles mentions sauvegardées en Supabase DB`);

    } catch {
      console.error('[ERROR] Erreur traitement mentions');
      // Ne pas throw - continuer en mode dégradé
    }
  }

  /**
   * Vérifie quelles mentions existent déjà en base
   */
  private async checkExistingMentions(externalIds: string[]): Promise<string[]> {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('mentions')
        .select('external_id')
        .in('external_id', externalIds);

      if (error) {
        console.warn('[WARN] Vérification déduplication échouée:', error);
        return []; // Continue sans déduplication
      }

      console.log(`[DEBUG] ${data?.length || 0} mentions existantes trouvées sur ${externalIds.length}`);
      return data?.map(row => row.external_id) || [];
    } catch {
      console.error('[ERROR] Erreur vérification mentions existantes');
      return [];
    }
  }

  /**
   * Analyse les mentions pour déclencher des alertes
   */
  private async analyzeForAlerts(mentions: Mention[], caseId: string) {
    try {
      const criticalMentions = mentions.filter(m => 
        m.urgency_score >= 8 || (m.sentiment_score && m.sentiment_score <= -3)
      );

      if (criticalMentions.length === 0) return;

      // Créer des alertes pour les mentions critiques
      const alerts = criticalMentions.map(mention => ({
        case_id: caseId,
        mention_id: mention.id,
        type: mention.sentiment_score && mention.sentiment_score <= -3 ? 'sentiment_drop' : 'keyword_match',
        title: `Mention critique détectée sur ${mention.platform}`,
        description: `Score d'urgence: ${mention.urgency_score}/10. Contenu: "${mention.content.slice(0, 100)}..."`,
        severity: mention.urgency_score >= 9 ? 'critical' : 'high',
        status: 'new',
        notified_users: []
      }));

      if (!isDemoMode()) {
        const supabase = createAdminClient();
        const { error } = await supabase
          .from('alerts')
          .insert(alerts);

        if (error) throw error;
      }

      console.log(`🚨 ${alerts.length} alertes critiques créées`);

    } catch {
      console.error('Erreur création alertes');
    }
  }

  /**
   * Obtient les statistiques du moteur de monitoring
   */
  getStats(): MonitoringStats {
    return {
      ...this.stats,
      nextRun: new Date(Date.now() + 15 * 60 * 1000), // +15min
      rateLimit: {
        facebook: facebookAPI.getRateLimitInfo(),
        reddit: redditAPI.getRateLimitInfo()
      }
    };
  }

  // Gestion d'erreurs robuste avec retry
  private async callAPIWithRetry<T>(
    apiCall: () => Promise<T>,
    platform: string,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall();
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Tentative ${attempt}/${maxRetries} échouée pour ${platform}:`, error);
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`🚫 Échec définitif pour ${platform} après ${maxRetries} tentatives:`, lastError);
    throw lastError!;
  }

  // Analytics temps réel
  private async updateMetrics(platform: string, success: boolean, responseTime: number) {
    const metrics: PlatformMetrics = this.platformMetrics.get(platform) || {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      avgResponseTime: 0,
      lastCallTime: new Date(),
      rateLimitHit: false,
      quotaUsed: 0,
      quotaLimit: 0
    } as PlatformMetrics;

    metrics.totalCalls++;
    metrics.lastCallTime = new Date();
    metrics.avgResponseTime = metrics.avgResponseTime === 0 ? responseTime : (metrics.avgResponseTime + responseTime) / 2;

    if (success) {
      metrics.successfulCalls++;
    } else {
      metrics.failedCalls++;
    }

    this.platformMetrics.set(platform, metrics);
  }

  /**
   * Obtient la liste des jobs actifs
   */
  getActiveJobs(): MonitoringJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Test des connexions aux APIs externes
   */
  async testConnections() {
    const results = {
      facebook: await facebookAPI.testConnection(),
      reddit: await redditAPI.testConnection()
    };

    console.log('🔗 Test connexions APIs:', results);
    return results;
  }

  /**
   * Scan manuel pour un cas spécifique (déclenchement immédiat)
   */
  async triggerManualScan(caseId: string): Promise<{ success: boolean; mentionsFound: number; error?: string }> {
    try {
      await this.runMonitoringJob(caseId);
      
      return {
        success: true,
        mentionsFound: this.stats.newMentions
      };
    } catch (error) {
      return {
        success: false,
        mentionsFound: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Arrête complètement le moteur de monitoring
   */
  shutdown() {
    console.log('⏹️ Arrêt du moteur de monitoring');
    
    // Arrêter tous les jobs
    for (const caseId of this.jobs.keys()) {
      this.stopMonitoringJob(caseId);
    }

    this.jobs.clear();
    this.isInitialized = false;
  }
}

// Instance singleton
export const monitoringEngine = new MonitoringEngine();
export default monitoringEngine;
