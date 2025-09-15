/**
 * Scheduler de Monitoring avec node-cron
 * Budget-friendly : scheduling local sans services externes
 */

import * as cron from 'node-cron';
import { monitoringEngine } from './monitoring-engine';
import { emailAlerts } from './email-alerts';
import { sentimentAnalysis } from './sentiment-analysis';

interface SchedulerConfig {
  monitoringInterval: string; // format cron
  alertsInterval: string;
  digestInterval: string; // digest quotidien
  budgetCheckInterval: string;
}

class MonitoringScheduler {
  private config: SchedulerConfig = {
    monitoringInterval: '*/15 * * * *', // Toutes les 15 minutes
    alertsInterval: '*/5 * * * *',      // Toutes les 5 minutes pour les alertes
    digestInterval: '0 8 * * *',        // 8h du matin pour le digest
    budgetCheckInterval: '0 * * * *'     // Toutes les heures pour vérifier le budget
  };

  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Démarre tous les schedulers
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler déjà en cours');
      return;
    }

    console.log('🕐 Démarrage du scheduler de monitoring...');

    // Task 1: Monitoring automatique des mentions
    const monitoringTask = cron.schedule(
      this.config.monitoringInterval,
      this.runPeriodicMonitoring.bind(this),
      { scheduled: false }
    );

    // Task 2: Traitement des alertes email
    const alertsTask = cron.schedule(
      this.config.alertsInterval,
      this.processEmailAlerts.bind(this),
      { scheduled: false }
    );

    // Task 3: Envoi du digest quotidien
    const digestTask = cron.schedule(
      this.config.digestInterval,
      this.sendDailyDigest.bind(this),
      { scheduled: false }
    );

    // Task 4: Vérification budget IA
    const budgetTask = cron.schedule(
      this.config.budgetCheckInterval,
      this.checkBudgetLimits.bind(this),
      { scheduled: false }
    );

    // Sauvegarder les tâches
    this.tasks.set('monitoring', monitoringTask);
    this.tasks.set('alerts', alertsTask);
    this.tasks.set('digest', digestTask);
    this.tasks.set('budget', budgetTask);

    // Démarrer toutes les tâches
    this.tasks.forEach(task => task.start());
    
    this.isRunning = true;
    console.log('✅ Scheduler démarré avec succès');
  }

  /**
   * Arrête tous les schedulers
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler déjà arrêté');
      return;
    }

    console.log('🛑 Arrêt du scheduler de monitoring...');

    // Arrêter toutes les tâches
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`⏹️ Task ${name} arrêtée`);
    });

    this.tasks.clear();
    this.isRunning = false;
    
    console.log('✅ Scheduler arrêté');
  }

  /**
   * Monitoring périodique automatique
   */
  private async runPeriodicMonitoring() {
    try {
      console.log('🔍 Démarrage monitoring automatique...');

      // En mode démo, ne pas faire de monitoring réel
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        console.log('📋 Mode démo : monitoring automatique ignoré');
        return;
      }

      // Obtenir les stats actuelles
      const stats = monitoringEngine.getStats();
      
      // Vérifier les rate limits avant de scanner
      if (stats.rateLimit.facebook.isLimited && stats.rateLimit.reddit.isLimited) {
        console.log('⏸️ Tous les rate limits épuisés, report du monitoring');
        return;
      }

      // Note: Le monitoring engine gère déjà le scheduling par cas
      // Cette task sert de backup et de monitoring global
      console.log('✅ Monitoring automatique terminé');

    } catch (error) {
      console.error('❌ Erreur monitoring automatique:', error);
    }
  }

  /**
   * Traitement des alertes email en attente
   */
  private async processEmailAlerts() {
    try {
      console.log('📧 Traitement alertes email...');

      const alertsProcessed = await emailAlerts.processOutstandingAlerts();
      
      if (alertsProcessed > 0) {
        console.log(`📩 ${alertsProcessed} alertes email envoyées`);
      }

    } catch (error) {
      console.error('❌ Erreur traitement alertes email:', error);
    }
  }

  /**
   * Envoi du digest quotidien
   */
  private async sendDailyDigest() {
    try {
      console.log('📊 Préparation digest quotidien...');

      // En mode démo, ne pas envoyer de vrais emails
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        console.log('📋 Mode démo : digest quotidien simulé');
        return;
      }

      // TODO: Implémenter l'envoi du digest quotidien
      // - Récupérer tous les utilisateurs actifs
      // - Calculer les métriques des dernières 24h
      // - Envoyer le digest personnalisé

      console.log('✅ Digest quotidien traité');

    } catch (error) {
      console.error('❌ Erreur envoi digest quotidien:', error);
    }
  }

  /**
   * Vérification des limites de budget IA
   */
  private async checkBudgetLimits() {
    try {
      const usage = sentimentAnalysis.getUsageStats();
      
      // Alerter si budget > 80%
      if (usage.usagePercent > 80) {
        console.log(`💰 Alerte budget IA: ${usage.usagePercent.toFixed(1)}% utilisé`);
        
        // TODO: Envoyer une alerte email aux admins
      }

      // Log du status budget pour monitoring
      if (usage.usagePercent > 0) {
        console.log(`💸 Budget IA: ${(usage.monthlyUsage/100).toFixed(2)}€/${(usage.maxBudget/100)}€`);
      }

    } catch (error) {
      console.error('❌ Erreur vérification budget:', error);
    }
  }

  /**
   * Met à jour la configuration du scheduler
   */
  updateConfig(newConfig: Partial<SchedulerConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Redémarrer avec la nouvelle config
    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log('⚙️ Configuration scheduler mise à jour');
  }

  /**
   * Obtient le statut du scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.tasks.keys()),
      config: this.config,
      nextRuns: {
        monitoring: this.getNextRun(this.config.monitoringInterval),
        alerts: this.getNextRun(this.config.alertsInterval),
        digest: this.getNextRun(this.config.digestInterval),
        budget: this.getNextRun(this.config.budgetCheckInterval)
      }
    };
  }

  /**
   * Calcule la prochaine exécution d'une tâche cron
   */
  private getNextRun(cronExpression: string): Date {
    // Parser l'expression cron et calculer la prochaine exécution
    // Pour simplifier, on retourne une estimation
    const now = new Date();
    
    if (cronExpression.includes('*/15')) {
      return new Date(now.getTime() + 15 * 60 * 1000); // +15 minutes
    } else if (cronExpression.includes('*/5')) {
      return new Date(now.getTime() + 5 * 60 * 1000);  // +5 minutes
    } else if (cronExpression.includes('0 8')) {
      const tomorrow8am = new Date(now);
      tomorrow8am.setDate(tomorrow8am.getDate() + 1);
      tomorrow8am.setHours(8, 0, 0, 0);
      return tomorrow8am;
    } else {
      return new Date(now.getTime() + 60 * 60 * 1000); // +1 heure par défaut
    }
  }

  /**
   * Force l'exécution immédiate d'une tâche
   */
  async triggerTask(taskName: 'monitoring' | 'alerts' | 'digest' | 'budget') {
    console.log(`🎯 Déclenchement manuel de la tâche: ${taskName}`);

    switch (taskName) {
      case 'monitoring':
        await this.runPeriodicMonitoring();
        break;
      case 'alerts':
        await this.processEmailAlerts();
        break;
      case 'digest':
        await this.sendDailyDigest();
        break;
      case 'budget':
        await this.checkBudgetLimits();
        break;
      default:
        throw new Error(`Tâche inconnue: ${taskName}`);
    }
  }
}

// Instance singleton
export const monitoringScheduler = new MonitoringScheduler();

// Auto-start en production
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
  monitoringScheduler.start();
}

export default monitoringScheduler;
