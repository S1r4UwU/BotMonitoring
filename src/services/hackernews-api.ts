import { Mention } from '@/models/types';

class HackerNewsAPIService {
  private baseURL = 'https://hn.algolia.com/api/v1';

  async search(keywords: string[], hitsPerPage = 50): Promise<Mention[]> {
    const mentions: Mention[] = [];
    for (const keyword of keywords) {
      const [stories, comments] = await Promise.all([
        this.searchStories(keyword, hitsPerPage),
        this.searchComments(keyword, hitsPerPage)
      ]);
      mentions.push(...stories, ...comments);
    }
    return mentions;
  }

  private async searchStories(keyword: string, hits: number): Promise<Mention[]> {
    const url = `${this.baseURL}/search?query=${encodeURIComponent(keyword)}&tags=story&hitsPerPage=${hits}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const nowIso = new Date().toISOString();
    return (data.hits || []).map((item: any) => ({
      id: `hn_story_${item.objectID}`,
      case_id: '',
      platform: 'hackernews',
      external_id: item.objectID,
      content: `${item.title} ${item.story_text || ''}`.slice(0, 2000),
      author_name: item.author,
      url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
      published_at: new Date(item.created_at).toISOString(),
      discovered_at: nowIso,
      urgency_score: 5,
      keywords_matched: [keyword],
      status: 'new',
      metadata: {
        points: item.points || 0,
        comments: item.num_comments || 0
      },
      created_at: nowIso
    }));
  }

  private async searchComments(keyword: string, hits: number): Promise<Mention[]> {
    const url = `${this.baseURL}/search?query=${encodeURIComponent(keyword)}&tags=comment&hitsPerPage=${hits}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const nowIso = new Date().toISOString();
    return (data.hits || []).map((item: any) => ({
      id: `hn_comment_${item.objectID}`,
      case_id: '',
      platform: 'hackernews',
      external_id: item.objectID,
      content: item.comment_text || '',
      author_name: item.author,
      url: `https://news.ycombinator.com/item?id=${item.objectID}`,
      published_at: new Date(item.created_at).toISOString(),
      discovered_at: nowIso,
      urgency_score: 5,
      keywords_matched: [keyword],
      status: 'new',
      metadata: {},
      created_at: nowIso
    }));
  }

  getRateLimitInfo() {
    return null;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.searchStories('test', 1);
      return { success: true, message: 'Connexion HN OK' };
    } catch {
      return { success: false, message: 'Erreur HN' };
    }
  }
}

export const hackerNewsAPI = new HackerNewsAPIService();
export default hackerNewsAPI;


