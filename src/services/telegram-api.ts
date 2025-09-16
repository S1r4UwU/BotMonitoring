import { Mention } from '@/models/types';

/**
 * Telegram Bot API - limitations: pas de recherche historique sans que le bot soit membre/admin.
 * On lit les mises à jour récentes (channel_post/message) et on filtre par mots-clés.
 */
class TelegramAPIService {
  private botToken: string;
  private baseURL: string;
  private lastUpdateId = 0;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseURL = this.botToken ? `https://api.telegram.org/bot${this.botToken}` : '';
    if (!this.botToken) console.warn('Telegram API non configurée : TELEGRAM_BOT_TOKEN manquant');
  }

  isConfigured(): boolean { return !!this.botToken; }

  async search(keywords: string[], limitPerBatch = 100): Promise<Mention[]> {
    if (!this.isConfigured()) return [];
    const url = `${this.baseURL}/getUpdates?timeout=0&allowed_updates=%5B%22channel_post%22,%22message%22%5D${this.lastUpdateId ? `&offset=${this.lastUpdateId + 1}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data: { result?: Array<{ update_id?: number; channel_post?: { [key: string]: unknown }; message?: { [key: string]: unknown } }> } = await res.json();
    const results: Mention[] = [];
    const nowIso = new Date().toISOString();
    const updates = data.result || [];
    for (const upd of updates) {
      this.lastUpdateId = Math.max(this.lastUpdateId, upd.update_id ?? 0);
      const msg = (upd.channel_post as { [key: string]: unknown }) || (upd.message as { [key: string]: unknown });
      if (!msg) continue;
      const text: string = (msg.text as string) || (msg.caption as string) || '';
      const matched = keywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));
      if (matched.length === 0) continue;
      const chat = (msg.chat as { [key: string]: unknown }) || {};
      const messageId = msg.message_id as number;
      const url = chat.username ? `https://t.me/${chat.username}/${messageId}` : undefined;
      results.push({
        id: `telegram_${chat.id}_${messageId}`,
        case_id: '',
        platform: 'telegram',
        external_id: `${chat.id}_${messageId}`,
        content: text.slice(0, 2000),
        author_name: (chat.username as string) || (chat.title as string) || String(chat.id),
        url,
        published_at: new Date(((msg.date as number) || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        discovered_at: nowIso,
        urgency_score: 5,
        keywords_matched: matched,
        status: 'new',
        metadata: { chat_id: chat.id, message_id: messageId, chat_type: chat.type },
        created_at: nowIso
      });
      if (results.length >= limitPerBatch) break;
    }
    return results;
  }

  getRateLimitInfo() { return null; }
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) return { success: false, message: 'TELEGRAM_BOT_TOKEN manquant' };
    try {
      await this.search(['test'], 1);
      return { success: true, message: 'Connexion Telegram OK (getUpdates)' };
    } catch {
      return { success: false, message: 'Erreur Telegram' };
    }
  }
}

export const telegramAPI = new TelegramAPIService();
export default telegramAPI;


