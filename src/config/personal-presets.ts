import type { Platform } from '@/models/types';

export const PERSONAL_MONITORING_PRESETS = {
  cybersecurity_lyon: {
    name: 'Cybersécurité Lyon',
    keywords: [
      'cybersécurité Lyon', 'sécurité informatique Rhône-Alpes',
      'ANSSI Lyon', 'sécurité IT France', 'pentest Lyon',
      'consultant cybersécurité Lyon', 'audit sécurité Lyon'
    ],
    platforms: ['reddit', 'newsapi', 'mastodon'] as Platform[],
    filters: { languages: ['fr', 'en'], countries: ['FR'] }
  },
  crypto_trading: {
    name: 'Trading Crypto France',
    keywords: [
      'trading bot France', 'DeFi France', 'crypto France',
      'Pionex avis', 'bot trading crypto', 'investissement crypto France',
      'réglementation crypto France', 'fiscalité crypto France'
    ],
    platforms: ['reddit', 'telegram', 'discord', 'newsapi'] as Platform[],
    filters: { languages: ['fr', 'en'] }
  },
  ai_development: {
    name: 'Développement IA',
    keywords: [
      'Claude API', 'Cursor IDE', 'development AI tools',
      'TypeScript AI', 'Next.js AI integration', 'AI coding assistant'
    ],
    platforms: ['reddit', 'hackernews', 'discord'] as Platform[],
    filters: { languages: ['en', 'fr'] }
  },
  business_opportunities: {
    name: 'Opportunités Business Lyon',
    keywords: [
      'startup Lyon', 'incubateur Lyon', 'investisseur Lyon',
      'French Tech Lyon', "aide création entreprise Lyon",
      'marché cybersécurité France'
    ],
    platforms: ['newsapi', 'reddit', 'mastodon'] as Platform[],
    filters: { languages: ['fr'], countries: ['FR'] }
  }
} as const;

export function createPersonalCase(presetKey: keyof typeof PERSONAL_MONITORING_PRESETS) {
  const preset = PERSONAL_MONITORING_PRESETS[presetKey];
  return {
    ...preset,
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}


