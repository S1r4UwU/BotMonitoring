import { apiRegistry, SocialMediaAPI } from './api-registry';

export interface SearchFilters {
  languages?: string[];
  excludeLanguages?: string[];
}

export interface SearchResult {
  id: string;
  platform: string;
  external_id: string;
  content: string;
  title?: string;
  author?: string;
  url?: string;
  published_at: Date | string;
  metrics?: Record<string, any>;
  sentiment_score?: number;
  status: 'new' | 'processed' | 'responded' | 'ignored';
}

export interface PlatformInfo {
  key: string;
  name: string;
  icon: string;
  free: boolean;
  enabled: boolean;
}

export class MultiPlatformMonitoringService {
  private platforms: Map<string, SocialMediaAPI> = new Map();

  constructor() {
    // Charger depuis le registry existant
    apiRegistry.getAvailablePlatforms().forEach(key => {
      const api = apiRegistry.getAPI(key);
      if (api) this.platforms.set(key, api);
    });
  }

  async searchAllPlatforms(
    keywords: string[],
    enabledPlatforms: string[],
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    const searchPromises = enabledPlatforms.map(async (platformName) => {
      const platform = this.platforms.get(platformName);
      if (!platform) return [] as SearchResult[];
      try {
        const results = await platform.search(keywords, filters as any);
        return results as unknown as SearchResult[];
      } catch {
        return [] as SearchResult[];
      }
    });

    const platformResults = await Promise.all(searchPromises);
    const allResults = platformResults.flat();
    return this.deduplicateResults(allResults);
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(r => {
      const key = r.url || r.external_id;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getAvailablePlatforms(): PlatformInfo[] {
    const keys = Array.from(this.platforms.keys());
    return keys.map(key => ({
      key,
      name: this.labelFor(key),
      icon: this.iconFor(key),
      free: ['reddit','youtube','hackernews','newsapi','mastodon','telegram','discord'].includes(key),
      enabled: true
    }));
  }

  private labelFor(key: string): string {
    switch (key) {
      case 'reddit': return 'Reddit';
      case 'youtube': return 'YouTube';
      case 'hackernews': return 'Hacker News';
      case 'newsapi': return 'News API';
      case 'mastodon': return 'Mastodon';
      case 'telegram': return 'Telegram';
      case 'discord': return 'Discord';
      case 'facebook': return 'Facebook';
      default: return key;
    }
  }

  private iconFor(key: string): string {
    switch (key) {
      case 'reddit': return '🔴';
      case 'youtube': return '📺';
      case 'hackernews': return '🟠';
      case 'newsapi': return '📰';
      case 'mastodon': return '🐘';
      case 'telegram': return '✈️';
      case 'discord': return '💬';
      case 'facebook': return '📘';
      default: return '🔌';
    }
  }
}
