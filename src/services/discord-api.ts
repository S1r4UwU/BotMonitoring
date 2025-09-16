/**
 * Discord: Lecture requiert généralement un bot ajouté aux serveurs/canaux et l'intent MESSAGE CONTENT.
 * Ici on prévoit un endpoint custom backend (non implémenté) ou un cache; à défaut, on retourne vide si non accessible.
 * On fournit un mode "gateway-less" fictif pour structure, à remplacer par une implémentation via librairie discord.js si souhaité.
 */
class DiscordAPIService {
  private botToken: string;

  constructor() {
    this.botToken = process.env.DISCORD_BOT_TOKEN || '';
    if (!this.botToken) console.warn('Discord API non configurée : DISCORD_BOT_TOKEN manquant');
  }

  isConfigured(): boolean { return !!this.botToken; }

  async search(keywords: string[]): Promise<Array<{ id: string; case_id: string; platform: 'discord'; external_id: string; content: string; author_name?: string; url?: string; published_at?: string; discovered_at: string; urgency_score: number; keywords_matched: string[]; status: 'new' | 'processed' | 'responded' | 'ignored'; metadata: Record<string, unknown>; created_at: string }>> {
    void keywords.length; // Utilise le paramètre pour éviter l'avertissement
    return [];
  }

  getRateLimitInfo() { return null; }
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) return { success: false, message: 'DISCORD_BOT_TOKEN manquant' };
    return { success: true, message: 'Token Discord présent (implémentation lecture à brancher si besoin)' };
  }
}

export const discordAPI = new DiscordAPIService();
export default discordAPI;


