import type { Alert, Mention } from '@/models/types';

export class PersonalAlertEngine {
  async checkCyberSecurityAlerts(mentions: Mention[]): Promise<Alert[]> {
    const alerts: Alert[] = [];
    for (const mention of mentions) {
      if (this.containsCriticalKeywords(mention.content, [
        'faille de sécurité', 'vulnérabilité critique', 'breach',
        'ransomware', 'cyberattaque', 'data leak'
      ])) {
        alerts.push({
          id: `cyber_${Date.now()}`,
          case_id: mention.case_id,
          mention_id: mention.id,
          type: 'crisis',
          title: `🚨 Alerte Cybersécurité - ${mention.platform}`,
          description: `Vulnérabilité détectée: ${mention.content.substring(0, 100)}...`,
          severity: 'critical',
          status: 'new',
          notified_users: [],
          created_at: new Date().toISOString()
        } as unknown as Alert);
      }
    }
    return alerts;
  }

  async checkBusinessOpportunities(mentions: Mention[]): Promise<Alert[]> {
    const businessKeywords = [
      'recherche consultant', 'besoin cybersécurité', "appel d'offres",
      'startup recherche', 'investissement Lyon', 'partenariat'
    ];
    return mentions
      .filter(m => this.containsBusinessKeywords(m.content, businessKeywords))
      .map(mention => ({
        id: `business_${Date.now()}`,
        case_id: mention.case_id,
        mention_id: mention.id,
        type: 'keyword_match',
        title: `💼 Opportunité Business - ${mention.platform}`,
        description: `Opportunité détectée: ${mention.content.substring(0, 100)}...`,
        severity: 'high',
        status: 'new',
        notified_users: [],
        created_at: new Date().toISOString()
      } as unknown as Alert));
  }

  async checkCryptoSentiment(mentions: Mention[]): Promise<Alert[]> {
    const cryptoMentions = mentions.filter(m =>
      this.containsCriticalKeywords((m.content || '').toLowerCase(), [
        'bitcoin', 'ethereum', 'crypto', 'defi', 'trading bot'
      ])
    );

    if (cryptoMentions.length === 0) return [];

    const avgSentiment = cryptoMentions.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / cryptoMentions.length;
    if (avgSentiment < -3) {
      return [{
        id: `crypto_bearish_${Date.now()}`,
        case_id: 'crypto_monitoring',
        mention_id: cryptoMentions[0].id,
        type: 'sentiment_drop',
        title: `📉 Sentiment Crypto Très Négatif`,
        description: `Sentiment moyen: ${avgSentiment.toFixed(1)} sur ${cryptoMentions.length} mentions`,
        severity: 'high',
        status: 'new',
        notified_users: [],
        created_at: new Date().toISOString()
      } as unknown as Alert];
    }
    return [];
  }

  private containsCriticalKeywords(content: string, keywords: string[]): boolean {
    const lowercaseContent = (content || '').toLowerCase();
    return keywords.some(keyword => lowercaseContent.includes(keyword.toLowerCase()));
  }

  private containsBusinessKeywords = this.containsCriticalKeywords;
}

export const personalAlertEngine = new PersonalAlertEngine();


