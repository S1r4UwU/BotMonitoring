import { Redis } from '@upstash/redis';
import type { Mention, DashboardMetrics } from '@/models/types';

export class CacheService {
  private redis: Redis | null;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.redis = url && token ? new Redis({ url, token }) : null;
    if (!this.redis) {
      console.warn('[Cache] Upstash Redis non configuré. Le cache est désactivé.');
    }
  }

  private ensure(): asserts this is { redis: Redis } {
    if (!this.redis) {
      throw new Error('Cache Redis non configuré');
    }
  }

  async cacheMentions(caseId: string, mentions: Mention[]) {
    this.ensure();
    await this.redis.set(`mentions:${caseId}`, mentions, { ex: 900 }); // 15 min
  }

  async getCachedMentions(caseId: string): Promise<Mention[] | null> {
    this.ensure();
    return (await this.redis.get(`mentions:${caseId}`)) as Mention[] | null;
  }

  async cacheStats(stats: DashboardMetrics) {
    this.ensure();
    await this.redis.set('dashboard:stats', stats, { ex: 300 }); // 5 min
  }

  async getCachedStats(): Promise<DashboardMetrics | null> {
    this.ensure();
    return (await this.redis.get('dashboard:stats')) as DashboardMetrics | null;
  }

  async cacheAPIResponse<T>(key: string, data: T, ttl: number) {
    this.ensure();
    await this.redis.set(key, data, { ex: ttl });
  }

  async getAPIResponse<T>(key: string): Promise<T | null> {
    this.ensure();
    return (await this.redis.get(key)) as T | null;
  }

  async delete(key: string): Promise<void> {
    this.ensure();
    await this.redis.del(key);
  }
}

export const cacheService = new CacheService();


