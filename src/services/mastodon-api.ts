import { Mention } from '@/models/types';

class MastodonAPIService {
  private instanceURL: string;

  constructor() {
    this.instanceURL = process.env.MASTODON_INSTANCE_URL || 'https://mastodon.social';
  }

  async search(keywords: string[], limitPerKeyword = 40): Promise<Mention[]> {
    const mentions: Mention[] = [];
    for (const keyword of keywords) {
      const posts = await this.searchPosts(keyword, limitPerKeyword);
      mentions.push(...posts);
    }
    return mentions;
  }

  private async searchPosts(keyword: string, limit: number): Promise<Mention[]> {
    const url = `${this.instanceURL}/api/v2/search?q=${encodeURIComponent(keyword)}&type=statuses&limit=${limit}`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    const nowIso = new Date().toISOString();
    return (data.statuses || []).map((status: any) => ({
      id: `mastodon_${status.id}`,
      case_id: '',
      platform: 'mastodon',
      external_id: String(status.id),
      content: this.stripHTML(status.content).slice(0, 2000),
      author_name: status.account?.username,
      url: status.url || status.uri,
      published_at: new Date(status.created_at).toISOString(),
      discovered_at: nowIso,
      urgency_score: 5,
      keywords_matched: [keyword],
      status: 'new',
      metadata: {
        favourites: status.favourites_count || 0,
        replies: status.replies_count || 0,
        reblogs: status.reblogs_count || 0
      },
      created_at: nowIso
    }));
  }

  private stripHTML(html: string): string {
    return (html || '').replace(/<[^>]*>/g, '').trim();
  }

  getRateLimitInfo() { return null; }
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.searchPosts('test', 1);
      return { success: true, message: 'Connexion Mastodon OK' };
    } catch {
      return { success: false, message: 'Erreur Mastodon' };
    }
  }
}

export const mastodonAPI = new MastodonAPIService();
export default mastodonAPI;


