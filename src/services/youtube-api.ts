import { Mention } from '@/models/types';
import { cacheService } from '@/lib/cache';

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
  };
}

interface YouTubeCommentThreadItem {
  id: string;
  snippet: {
    totalReplyCount: number;
    topLevelComment: {
      snippet: {
        textDisplay: string;
        authorDisplayName: string;
        publishedAt: string;
        likeCount: number;
      };
    };
  };
}

class YouTubeAPIService {
  private async callWithRetry<T>(operation: () => Promise<T>, maxRetries = 3, timeoutMs = 15000): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout ${timeoutMs}ms`)), timeoutMs))
        ]);
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`[ERROR] YouTubeAPIService failed after ${maxRetries} attempts:`, error);
          throw error;
        }
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.warn(`[RETRY] YouTube attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('Impossible de joindre YouTube API');
  }
  private apiKey: string;
  private baseURL = 'https://www.googleapis.com/youtube/v3';
  private quotaUsed = 0;
  private quotaLimit = 10000;
  private quotaResetTime = new Date(new Date().setHours(24,0,0,0)).toISOString();

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YouTube API non configurée : YOUTUBE_API_KEY manquante');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getNextDayStart(): string {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next.toISOString();
  }

  private trackQuotaUsage(cost: number) {
    this.quotaUsed += cost;
    if (new Date().toISOString() > this.quotaResetTime) {
      this.quotaUsed = 0;
      this.quotaResetTime = this.getNextDayStart();
    }
    if (this.quotaUsed >= this.quotaLimit * 0.8) {
      console.warn('YouTube quota at 80%');
    }
  }

  async search(keywords: string[], maxPerKeyword = 25): Promise<Mention[]> {
    if (!this.isConfigured()) return [];

    const mentions: Mention[] = [];
    for (const keyword of keywords) {
      const videos = await this.searchVideos(keyword, maxPerKeyword);
      mentions.push(...videos);

      const topVideos = videos.slice(0, 5);
      for (const v of topVideos) {
        const videoId = v.external_id.replace(/^youtube_video_/, '');
        const comments = await this.searchComments(videoId, keyword);
        mentions.push(...comments);
      }
    }
    return mentions;
  }

  private async searchVideos(keyword: string, maxResults: number): Promise<Mention[]> {
    // Cache (5 min) clé par keyword
    const cacheKey = `yt:search:${keyword}:${maxResults}`;
    try {
      const cached = await cacheService.getAPIResponse<Mention[]>(cacheKey);
      if (cached) return cached;
    } catch {}

    // Coût typique: search.list ~ 100 unités
    const url = `${this.baseURL}/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&order=relevance&maxResults=${maxResults}&key=${this.apiKey}`;
    const res = await this.callWithRetry(() => fetch(url));
    if (!res.ok) return [];
    const data = await res.json();
    const items: YouTubeSearchItem[] = data.items || [];
    this.trackQuotaUsage(100);
    const nowIso = new Date().toISOString();
    const out = items.map(item => ({
      id: `youtube_video_${item.id.videoId}`,
      case_id: '',
      platform: 'youtube',
      external_id: `youtube_video_${item.id.videoId}`,
      content: `${item.snippet.title} ${item.snippet.description || ''}`.slice(0, 2000),
      author_name: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      published_at: new Date(item.snippet.publishedAt).toISOString(),
      discovered_at: nowIso,
      urgency_score: 5,
      keywords_matched: [keyword],
      status: 'new',
      metadata: {
        type: 'video'
      },
      created_at: nowIso
    }));
    try { await cacheService.cacheAPIResponse(cacheKey, out, 300); } catch {}
    return out;
  }

  private async searchComments(videoId: string, keyword: string): Promise<Mention[]> {
    // Cache (5 min) par vidéo+keyword
    const cacheKey = `yt:comments:${videoId}:${keyword}`;
    try {
      const cached = await cacheService.getAPIResponse<Mention[]>(cacheKey);
      if (cached) return cached;
    } catch {}

    // Coût typique: commentThreads.list ~ 1 unité
    const url = `${this.baseURL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${this.apiKey}`;
    const res = await this.callWithRetry(() => fetch(url));
    if (!res.ok) return [];
    const data = await res.json();
    const items: YouTubeCommentThreadItem[] = data.items || [];
    this.trackQuotaUsage(1);
    const nowIso = new Date().toISOString();
    const out = items
      .filter(i => (i.snippet.topLevelComment.snippet.textDisplay || '').toLowerCase().includes(keyword.toLowerCase()))
      .map(i => {
        const c = i.snippet.topLevelComment.snippet;
        return {
          id: `youtube_comment_${i.id}`,
          case_id: '',
          platform: 'youtube',
          external_id: `youtube_comment_${i.id}`,
          content: c.textDisplay,
          author_name: c.authorDisplayName,
          url: `https://www.youtube.com/watch?v=${videoId}&lc=${i.id}`,
          published_at: new Date(c.publishedAt).toISOString(),
          discovered_at: nowIso,
          urgency_score: 5,
          keywords_matched: [keyword],
          status: 'new',
          metadata: {
            type: 'comment',
            likes: c.likeCount || 0,
            replies: i.snippet.totalReplyCount || 0
          },
          created_at: nowIso
        } as Mention;
      });
    try { await cacheService.cacheAPIResponse(cacheKey, out, 300); } catch {}
    return out;
  }

  getRateLimitInfo() {
    return { quotaUsed: this.quotaUsed, quotaLimit: this.quotaLimit, resetAt: this.quotaResetTime };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.search(['test'], 1);
      return { success: true, message: 'Connexion YouTube OK' };
    } catch {
      return { success: false, message: 'Erreur YouTube' };
    }
  }
}

export const youtubeAPI = new YouTubeAPIService();
export default youtubeAPI;


