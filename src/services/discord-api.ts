import { Mention } from '@/models/types';

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

  async search(_keywords: string[]): Promise<Mention[]> {
    // Sans connexion Gateway/discord.js et intents, on ne peut pas lister messages arbitraires.
    // Stratégie: retourner vide mais garder l’interface prête.
    return [];
  }

  getRateLimitInfo() { return null; }
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) return { success: false, message: 'DISCORD_BOT_TOKEN manquant' };
    // Sans gateway, on se contente de valider la présence du token.
    return { success: true, message: 'Token Discord présent (implémentation lecture à brancher si besoin)' };
  }
}

export const discordAPI = new DiscordAPIService();
export default discordAPI;


