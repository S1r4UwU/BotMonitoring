import { Mention } from '@/models/types';
import { facebookAPI } from './facebook-api';
import { redditAPI } from './reddit-api';
import { youtubeAPI } from './youtube-api';
import { hackerNewsAPI } from './hackernews-api';
import { newsAPI } from './news-api';
import { mastodonAPI } from './mastodon-api';
import { telegramAPI } from './telegram-api';
import { discordAPI } from './discord-api';

export interface SearchFilters {
  languages?: string[];
  excludeLanguages?: string[];
}

export abstract class SocialMediaAPI {
  abstract key: string;
  abstract async search(keywords: string[], filters?: SearchFilters): Promise<Mention[]>;
  abstract async authenticate(): Promise<boolean>;
  abstract getRateLimit(): any;
}

class FacebookAdapter extends SocialMediaAPI {
  key = 'facebook';
  async search(keywords: string[], _filters?: SearchFilters): Promise<Mention[]> {
    return facebookAPI.searchFacebookPosts(keywords, 25);
  }
  async authenticate(): Promise<boolean> { return true; }
  getRateLimit() { return facebookAPI.getRateLimitInfo?.(); }
}

class RedditAdapter extends SocialMediaAPI {
  key = 'reddit';
  async search(keywords: string[], _filters?: SearchFilters): Promise<Mention[]> {
    return redditAPI.searchPosts(keywords, [], 25);
  }
  async authenticate(): Promise<boolean> { return true; }
  getRateLimit() { return redditAPI.getRateLimitInfo?.(); }
}

class YouTubeAdapter extends SocialMediaAPI {
  key = 'youtube';
  async search(keywords: string[], _filters?: SearchFilters): Promise<Mention[]> {
    return youtubeAPI.search(keywords, 25);
  }
  async authenticate(): Promise<boolean> { return true; }
  getRateLimit() { return youtubeAPI.getRateLimitInfo?.(); }
}

class HackerNewsAdapter extends SocialMediaAPI {
  key = 'hackernews';
  async search(keywords: string[], _filters?: SearchFilters): Promise<Mention[]> {
    return hackerNewsAPI.search(keywords, 50);
  }
  async authenticate(): Promise<boolean> { return true; }
  getRateLimit() { return hackerNewsAPI.getRateLimitInfo?.(); }
}

class NewsAdapter extends SocialMediaAPI {
  key = 'newsapi';
  async search(keywords: string[], filters?: SearchFilters): Promise<Mention[]> {
    return newsAPI.search(keywords, filters?.languages || []);
  }
  async authenticate(): Promise<boolean> { return true; }
  getRateLimit() { return newsAPI.getRateLimitInfo?.(); }
}

class MastodonAdapter extends SocialMediaAPI {
  key = 'mastodon';
  async search(keywords: string[], _filters?: SearchFilters): Promise<Mention[]> {
    return mastodonAPI.search(keywords, 40);
  }
  async authenticate(): Promise<boolean> { return true; }
  getRateLimit() { return mastodonAPI.getRateLimitInfo?.(); }
}

class TelegramAdapter extends SocialMediaAPI {
  key = 'telegram';
  async search(keywords: string[], _filters?: SearchFilters): Promise<Mention[]> {
    return telegramAPI.search(keywords, 100);
  }
  async authenticate(): Promise<boolean> { return true; }
  getRateLimit() { return telegramAPI.getRateLimitInfo?.(); }
}

class DiscordAdapter extends SocialMediaAPI {
  key = 'discord';
  async search(keywords: string[], _filters?: SearchFilters): Promise<Mention[]> {
    return discordAPI.search(keywords);
  }
  async authenticate(): Promise<boolean> { return true; }
  getRateLimit() { return discordAPI.getRateLimitInfo?.(); }
}

export class TwitterAPI extends SocialMediaAPI {
  key = 'twitter';
  async search(): Promise<Mention[]> { return []; }
  async authenticate(): Promise<boolean> { return false; }
  getRateLimit() { return null; }
}

export class YouTubeAPI extends SocialMediaAPI {
  key = 'youtube';
  async search(): Promise<Mention[]> { return []; }
  async authenticate(): Promise<boolean> { return false; }
  getRateLimit() { return null; }
}

export class TikTokAPI extends SocialMediaAPI {
  key = 'tiktok';
  async search(): Promise<Mention[]> { return []; }
  async authenticate(): Promise<boolean> { return false; }
  getRateLimit() { return null; }
}

export class LinkedInAPI extends SocialMediaAPI {
  key = 'linkedin';
  async search(): Promise<Mention[]> { return []; }
  async authenticate(): Promise<boolean> { return false; }
  getRateLimit() { return null; }
}

export class APIRegistry {
  private apis: Map<string, SocialMediaAPI> = new Map();

  constructor() {
    // Enregistrer les implémentations existantes
    this.register(new FacebookAdapter());
    this.register(new RedditAdapter());
    this.register(new YouTubeAdapter());
    this.register(new HackerNewsAdapter());
    this.register(new NewsAdapter());
    this.register(new MastodonAdapter());
    this.register(new TelegramAdapter());
    this.register(new DiscordAdapter());
  }

  register(api: SocialMediaAPI) {
    this.apis.set(api.key, api);
  }

  getAPI(platform: string): SocialMediaAPI | undefined {
    return this.apis.get(platform);
  }

  getAvailablePlatforms(): string[] {
    return Array.from(this.apis.keys());
  }
}

export const apiRegistry = new APIRegistry();

