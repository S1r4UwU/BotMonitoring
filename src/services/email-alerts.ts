/**
 * Service d'Alertes Email avec Resend API
 * Budget-friendly : 3000 emails/mois gratuits + excellent délivrabilité
 */

import { Resend } from 'resend';
import { Alert } from '@/models/types';
import { createAdminClient } from '@/lib/supabase';

interface EmailAlert {
  to: string[];
  subject: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
}

class EmailAlertsService {
  private resend: Resend | null = null;
  private monthlyEmailCount = 0;
  private maxMonthlyEmails = 3000; // Resend Free limit (3000 emails/mois)
  private emailResetDate: Date;
  private fromEmail = 'alerts@socialguard.dev';
  private fromName = 'SocialGuard Monitoring';

  constructor() {
    const resendApiKey = process.env.RESEND_API_KEY || '';
    
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
    } else {
      console.warn('Email alerts non configuré : RESEND_API_KEY manquant dans .env.local');
    }
    
    this.emailResetDate = this.getNextMonthStart();
  }

  /**
   * Vérifie si le service email est configuré
   */
  isConfigured(): boolean {
    return !!this.resend;
  }

  /**
   * Vérifie si on peut envoyer des emails (quota disponible)
   */
  private canSendEmail(): boolean {
    this.checkQuotaReset();
    return this.monthlyEmailCount < this.maxMonthlyEmails;
  }

  /**
   * Reset du quota mensuel
   */
  private checkQuotaReset(): void {
    const now = new Date();
    if (now >= this.emailResetDate) {
      this.monthlyEmailCount = 0;
      this.emailResetDate = this.getNextMonthStart();
      console.log('📧 Quota email mensuel réinitialisé');
    }
  }

  /**
   * Obtient le début du mois prochain
   */
  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Envoie une alerte email via Resend API
   */
  private async sendEmail(alert: EmailAlert): Promise<boolean> {
    if (!this.isConfigured() || !this.resend) {
      console.warn('Service email non configuré');
      return false;
    }

    if (!this.canSendEmail()) {
      console.warn('Quota email mensuel dépassé');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: alert.to,
        subject: alert.subject,
        text: alert.body,
        html: this.generateHTMLEmail(alert.subject, alert.body, alert.priority),
        headers: {
          'X-Priority': alert.priority === 'high' ? '1' : '3',
          'X-SocialGuard-Type': 'monitoring-alert'
        }
      });

      if (error) {
        console.error('Erreur Resend API:', error);
        return false;
      }

      if (data?.id) {
        this.monthlyEmailCount += alert.to.length;
        console.log(`📧 Email envoyé via Resend (ID: ${data.id}) à ${alert.to.length} destinataire(s)`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Erreur envoi email Resend:', error);
      return false;
    }
  }

  /**
   * Envoie une alerte pour une mention critique
   */
  async sendCriticalMentionAlert(
    alert: Alert, 
    mentionContent: string, 
    caseOwnerEmail: string
  ): Promise<boolean> {
    const emailAlert: EmailAlert = {
      to: [caseOwnerEmail],
      subject: `🚨 ${alert.title} - SocialGuard`,
      body: this.generateCriticalMentionText(alert, mentionContent),
      priority: alert.severity === 'critical' ? 'high' : 'normal'
    };

    return await this.sendEmail(emailAlert);
  }

  /**
   * Envoie un digest quotidien des mentions
   */
  async sendDailyDigest(
    userEmail: string, 
    mentionsCount: number, 
    alertsCount: number,
    topKeywords: string[]
  ): Promise<boolean> {
    const emailAlert: EmailAlert = {
      to: [userEmail],
      subject: `📊 Résumé quotidien SocialGuard - ${mentionsCount} mentions`,
      body: this.generateDailyDigestText(mentionsCount, alertsCount, topKeywords),
      priority: 'low'
    };

    return await this.sendEmail(emailAlert);
  }

  /**
   * Envoie une alerte de pic de volume
   */
  async sendVolumeSpike(
    userEmail: string,
    currentVolume: number,
    previousVolume: number,
    platform: string
  ): Promise<boolean> {
    const increase = Math.round(((currentVolume - previousVolume) / previousVolume) * 100);
    
    const emailAlert: EmailAlert = {
      to: [userEmail],
      subject: `📈 Pic de mentions détecté (+${increase}%) - SocialGuard`,
      body: `Alerte volume détectée sur ${platform}:\n\n` +
             `Volume actuel: ${currentVolume} mentions\n` +
             `Volume précédent: ${previousVolume} mentions\n` +
             `Augmentation: +${increase}%\n\n` +
             `Consultez votre dashboard pour plus de détails.`,
      priority: 'normal'
    };

    return await this.sendEmail(emailAlert);
  }

  /**
   * Génère le contenu texte pour alerte critique
   */
  private generateCriticalMentionText(alert: Alert, mentionContent: string): string {
    return `Nouvelle alerte critique détectée:

TYPE: ${alert.type}
SÉVÉRITÉ: ${alert.severity.toUpperCase()}
DESCRIPTION: ${alert.description}

CONTENU DE LA MENTION:
"${mentionContent.slice(0, 300)}${mentionContent.length > 300 ? '...' : ''}"

ACTION RECOMMANDÉE:
Consultez votre dashboard SocialGuard pour analyser cette mention et prendre les mesures appropriées.

---
SocialGuard - Monitoring des réseaux sociaux
Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mentions`;
  }

  /**
   * Génère le contenu texte pour digest quotidien
   */
  private generateDailyDigestText(
    mentionsCount: number, 
    alertsCount: number, 
    topKeywords: string[]
  ): string {
    return `Résumé quotidien de votre monitoring:

📊 STATISTIQUES:
- ${mentionsCount} nouvelles mentions
- ${alertsCount} alertes générées
- Mots-clés principaux: ${topKeywords.join(', ')}

${alertsCount > 0 ? '⚠️ Des alertes nécessitent votre attention.' : '✅ Aucune alerte critique aujourd\'hui.'}

Consultez votre dashboard pour le détail complet:
${process.env.NEXT_PUBLIC_APP_URL}/dashboard

---
SocialGuard - Monitoring quotidien automatique`;
  }

  /**
   * Génère l'HTML de l'email avec style
   */
  private generateHTMLEmail(subject: string, textContent: string, priority: 'low' | 'normal' | 'high'): string {
    const priorityColors = {
      low: '#10b981',
      normal: '#3b82f6', 
      high: '#ef4444'
    };

    const color = priorityColors[priority];

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .content pre { background: #f3f4f6; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: inherit; }
        .footer { background: #f9fafb; padding: 15px 20px; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
        .btn { display: inline-block; background: ${color}; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ SocialGuard</h1>
        </div>
        <div class="content">
            <h2>${subject}</h2>
            <pre>${textContent}</pre>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Voir le Dashboard</a>
        </div>
        <div class="footer">
            <p>SocialGuard - Monitoring des réseaux sociaux<br>
            Vous recevez cet email car vous avez configuré des alertes dans votre compte.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Obtient les statistiques d'usage email
   */
  getEmailStats() {
    return {
      monthlyCount: this.monthlyEmailCount,
      maxEmails: this.maxMonthlyEmails,
      usagePercent: (this.monthlyEmailCount / this.maxMonthlyEmails) * 100,
      remainingEmails: this.maxMonthlyEmails - this.monthlyEmailCount,
      resetDate: this.emailResetDate,
      canSend: this.canSendEmail()
    };
  }

  /**
   * Test du service email Resend
   */
  async testEmailService(testEmail: string): Promise<{ success: boolean; message: string; emailId?: string }> {
    if (!this.isConfigured() || !this.resend) {
      return {
        success: false,
        message: 'Service email non configuré - RESEND_API_KEY requis dans .env.local'
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [testEmail],
        subject: '🧪 Test SocialGuard - Configuration Email Resend',
        text: 'Ceci est un email de test pour vérifier la configuration de SocialGuard avec Resend API.\n\nSi vous recevez cet email, les alertes par email fonctionnent parfaitement !',
        html: this.generateHTMLEmail(
          'Test SocialGuard', 
          'Configuration email Resend fonctionnelle ✅\n\nVotre système d\'alertes est maintenant opérationnel.',
          'normal'
        )
      });

      if (error) {
        return {
          success: false,
          message: `Erreur Resend: ${error.message}`
        };
      }

      if (data?.id) {
        this.monthlyEmailCount += 1;
        return {
          success: true,
          message: 'Email de test envoyé avec succès via Resend',
          emailId: data.id
        };
      }

      return {
        success: false,
        message: 'Réponse Resend inattendue'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erreur test email Resend: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Traite les alertes en attente depuis la base de données
   */
  async processOutstandingAlerts(): Promise<number> {
    try {
      const supabase = createAdminClient();
      
      // Récupérer les alertes non notifiées de moins de 1 heure
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select(`
          *,
          cases (
            id,
            name,
            owner_id,
            profiles (
              email,
              full_name
            )
          ),
          mentions (
            content,
            platform
          )
        `)
        .eq('status', 'new')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (error) throw error;

      let sentCount = 0;

      for (const alert of alerts || []) {
        const ownerEmail = alert.cases?.profiles?.email;
        const mentionContent = alert.mentions?.content || '';

        if (ownerEmail) {
          const sent = await this.sendCriticalMentionAlert(
            alert,
            mentionContent,
            ownerEmail
          );

          if (sent) {
            // Marquer l'alerte comme notifiée
            await supabase
              .from('alerts')
              .update({ 
                status: 'acknowledged',
                notified_users: [ownerEmail]
              })
              .eq('id', alert.id);

            sentCount++;
          }
        }

        // Petite pause pour éviter le spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`📧 ${sentCount} alertes email traitées`);
      return sentCount;

    } catch (error) {
      console.error('Erreur traitement alertes email:', error);
      return 0;
    }
  }
}

// Instance singleton
export const emailAlerts = new EmailAlertsService();
export default emailAlerts;
