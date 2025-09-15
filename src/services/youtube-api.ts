import { Mention } from '@/models/types';

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
  private apiKey: string;
  private baseURL = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YouTube API non configurée : YOUTUBE_API_KEY manquante');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
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
    const url = `${this.baseURL}/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&order=relevance&maxResults=${maxResults}&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items: YouTubeSearchItem[] = data.items || [];
    const nowIso = new Date().toISOString();
    return items.map(item => ({
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
  }

  private async searchComments(videoId: string, keyword: string): Promise<Mention[]> {
    const url = `${this.baseURL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items: YouTubeCommentThreadItem[] = data.items || [];
    const nowIso = new Date().toISOString();
    return items
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
  }

  getRateLimitInfo() {
    return null;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'YOUTUBE_API_KEY manquante' };
    }
    // Ping léger: recherche sur un mot-clé commun
    try {
      await this.searchVideos('test', 1);
      return { success: true, message: 'Connexion YouTube OK' };
    } catch (e) {
      return { success: false, message: 'Erreur YouTube' };
    }
  }
}

export const youtubeAPI = new YouTubeAPIService();
export default youtubeAPI;


