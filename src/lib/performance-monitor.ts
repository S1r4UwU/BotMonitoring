import type { Platform } from '@/models/types';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordAPICall(platform: Platform, responseTime: number, success: boolean) {
    const key = `${platform}_${success ? 'success' : 'error'}`;
    const times = this.metrics.get(key) || [];
    times.push(responseTime);
    if (times.length > 100) times.shift();
    this.metrics.set(key, times);
  }

  getAPIPerformance(): Record<Platform, { success_rate: number; avg_response_time: number }> {
    const platforms: Platform[] = ['reddit', 'youtube', 'facebook', 'newsapi', 'mastodon', 'telegram', 'discord', 'hackernews', 'instagram'];
    const performance: Record<string, { success_rate: number; avg_response_time: number }> = {};

    platforms.forEach(platform => {
      const successTimes = this.metrics.get(`${platform}_success`) || [];
      const errorTimes = this.metrics.get(`${platform}_error`) || [];
      const totalCalls = successTimes.length + errorTimes.length;
      performance[platform] = {
        success_rate: totalCalls > 0 ? (successTimes.length / totalCalls) * 100 : 0,
        avg_response_time: successTimes.length > 0
          ? successTimes.reduce((sum, time) => sum + time, 0) / successTimes.length
          : 0
      };
    });

    return performance as Record<Platform, { success_rate: number; avg_response_time: number }>;
  }
}

export const performanceMonitor = new PerformanceMonitor();


