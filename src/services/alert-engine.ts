import { Mention } from '@/models/types';
import { emailAlerts } from '@/services/email-alerts';

export interface AlertRule {
  id: string;
  name: string;
  type: 'sentiment_drop' | 'volume_spike' | 'keyword_match' | 'quota_limit';
  condition: {
    operator: 'gt' | 'lt' | 'eq' | 'contains';
    value: number | string;
    timeframe?: '5m' | '15m' | '1h' | '24h';
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: {
    email?: boolean;
    slack?: boolean;
    webhook?: string;
  };
  enabled: boolean;
}

export class AlertEngine {
  private rules: Map<string, AlertRule> = new Map();

  addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
  }

  async evaluateAlerts(mentions: Mention[], caseId: string) {
    const alerts: Array<Record<string, unknown>> = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const isTriggered = await this.evaluateRule(rule, mentions);

      if (isTriggered) {
        const alert = await this.createAlert(rule, mentions, caseId);
        alerts.push(alert);

        await this.executeAlertActions(rule, alert);
      }
    }

    return alerts;
  }

  private async evaluateRule(rule: AlertRule, mentions: Mention[]): Promise<boolean> {
    switch (rule.type) {
      case 'sentiment_drop': {
        if (mentions.length === 0) return false;
        const avgSentiment = mentions.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / mentions.length;
        return rule.condition.operator === 'lt' && avgSentiment < (rule.condition.value as number);
      }
      case 'volume_spike': {
        const recentCount = mentions.filter(
          (m) => new Date((m.created_at || new Date().toISOString())).getTime() > Date.now() - 15 * 60 * 1000
        ).length;
        return rule.condition.operator === 'gt' && recentCount > (rule.condition.value as number);
      }
      case 'keyword_match': {
        return mentions.some((m) =>
          (m.content || '').toLowerCase().includes(String(rule.condition.value).toLowerCase())
        );
      }
      default:
        return false;
    }
  }

  private async createAlert(rule: AlertRule, mentions: Mention[], caseId: string) {
    const title = `Règle déclenchée: ${rule.name}`;
    const description = `Type: ${rule.type} | Condition: ${rule.condition.operator} ${rule.condition.value}`;
    return {
      case_id: caseId,
      type: rule.type,
      title,
      description,
      severity: rule.severity,
      status: 'new',
      notified_users: [],
      created_at: new Date().toISOString(),
    };
  }

  private async executeAlertActions(rule: AlertRule, alert: Record<string, unknown>) {
    if (rule.actions.email) {
      try {
        await emailAlerts.sendCriticalMentionAlert(
          {
            id: 'rule',
            case_id: String(alert.case_id || caseId),
            type: 'keyword_match',
            title: String(alert.title || 'Alerte'),
            severity: rule.severity,
            status: 'new',
            notified_users: [],
            created_at: new Date().toISOString(),
          } as unknown as import('@/models/types').Alert,
          String((mentions[0]?.content) || ''),
          ''
        );
      } catch {}
    }
    if (rule.actions.webhook) {
      try {
        await this.callWebhook(rule.actions.webhook, alert);
      } catch {}
    }
  }

  private async callWebhook(url: string, payload: unknown) {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}

export const alertEngine = new AlertEngine();


