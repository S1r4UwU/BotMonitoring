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
import { Mention, Case } from '@/models/types';
import { isDemoMode, DemoDataService } from './demo-data';

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
    facebook: any;
    reddit: any;
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
      
    } catch (error) {
      console.error('❌ Erreur initialisation moteur de monitoring:', error);
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
        cases = [{
          id: 'fallback-case',
          name: 'Cas de fallback',
          keywords: JSON.stringify(['socialguard', 'monitoring']),
          platforms: JSON.stringify(['reddit']),
          status: 'active'
        }];
      }

      console.log(`📊 ${cases?.length || 0} cas actifs chargés depuis Supabase DB`);

      // Démarrer les jobs pour chaque cas
      cases?.forEach(caseData => {
        const keywords = typeof caseData.keywords === 'string' ? JSON.parse(caseData.keywords) : caseData.keywords;
        const platforms = typeof caseData.platforms === 'string' ? JSON.parse(caseData.platforms) : caseData.platforms;
        const filters = typeof (caseData as any).filters === 'string' ? JSON.parse((caseData as any).filters) : (caseData as any).filters;
        
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

    } catch (error) {
      console.error('[ERROR] Erreur chargement cas actifs:', error);
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
            ? (AdvancedSearchEngine as any).parseQueryToGroups(job.keywords[0])
            : [ { operator: 'ET', keywords: job.keywords } ];
          allMentions = allMentions.filter(m => engine.matchesCriteria(m.content || '', groups as any));
        } catch (e) {
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
        } catch (e) {
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

    } catch (error) {
      console.error(`❌ Erreur scan cas ${caseId}:`, error);
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
      if (keywords.length === 1) {
        const { AdvancedSearchEngine } = require('./search/advanced-search');
        const groups = AdvancedSearchEngine.parseQueryToGroups(keywords[0]);
        const et = (groups.find((g: any) => g.operator === 'ET')?.keywords || []);
        const ou = (groups.find((g: any) => g.operator === 'OU')?.keywords || []);
        const flat = Array.from(new Set([...et, ...ou]));
        return flat.length > 0 ? flat : keywords;
      }
      return keywords.map(k => k.replace(/^["']|["']$/g, ''));
    } catch {
      return keywords;
    }
  }

  /**
   * Scanner Facebook pour des mentions
   */
  private async scanFacebook(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const mentions = await facebookAPI.searchFacebookPosts(keywords, 25);
      return mentions.map(mention => ({
        ...mention,
        case_id: caseId
      }));
    } catch (error) {
      console.error('Erreur scan Facebook:', error);
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
      const mentions = await redditAPI.searchPosts(keywords, subreddits, 25);
      return mentions.map(mention => ({
        ...mention,
        case_id: caseId
      }));
    } catch (error) {
      console.error('Erreur scan Reddit:', error);
      return [];
    }
  }

  /**
   * Scanner YouTube
   */
  private async scanYouTube(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const mentions = await youtubeAPI.search(keywords, 25);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan YouTube:', e);
      return [];
    }
  }

  /**
   * Scanner Hacker News
   */
  private async scanHackerNews(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const mentions = await hackerNewsAPI.search(keywords, 50);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan HackerNews:', e);
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
      const mentions = await newsAPI.search(keywords, filters?.languages || []);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan NewsAPI:', e);
      return [];
    }
  }

  /**
   * Scanner Mastodon
   */
  private async scanMastodon(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const mentions = await mastodonAPI.search(keywords, 40);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan Mastodon:', e);
      return [];
    }
  }

  /**
   * Scanner Telegram
   */
  private async scanTelegram(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const mentions = await telegramAPI.search(keywords, 100);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan Telegram:', e);
      return [];
    }
  }

  /**
   * Scanner Discord (placeholder lecture)
   */
  private async scanDiscord(keywords: string[], caseId: string): Promise<Mention[]> {
    try {
      const mentions = await discordAPI.search(keywords);
      return mentions.map(m => ({ ...m, case_id: caseId }));
    } catch (e) {
      console.error('Erreur scan Discord:', e);
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

    } catch (error) {
      console.error('[ERROR] Erreur traitement mentions:', error);
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
    } catch (error) {
      console.error('[ERROR] Erreur vérification mentions existantes:', error);
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

    } catch (error) {
      console.error('Erreur création alertes:', error);
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
