import { Mention } from '@/models/types';

class NewsAPIService {
  private apiKey: string;
  private baseURL = 'https://newsapi.org/v2';

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('News API non configurée : NEWS_API_KEY manquante');
    }
  }

  isConfigured(): boolean { return !!this.apiKey; }

  async search(keywords: string[], languages: string[] = []): Promise<Mention[]> {
    if (!this.isConfigured()) return [];
    const mentions: Mention[] = [];
    for (const keyword of keywords) {
      const articles = await this.searchArticles(keyword, languages[0]);
      mentions.push(...articles);
    }
    return mentions;
  }

  private async searchArticles(keyword: string, language?: string): Promise<Mention[]> {
    const params = new URLSearchParams({
      q: keyword,
      sortBy: 'publishedAt',
      pageSize: '50',
      apiKey: this.apiKey
    });
    if (language) params.append('language', language);

    const res = await fetch(`${this.baseURL}/everything?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'ok') return [];
    const nowIso = new Date().toISOString();
    return (data.articles || []).map((article: any) => {
      const external = `news_${(article.url || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
      return {
        id: external,
        case_id: '',
        platform: 'news',
        external_id: external,
        content: `${article.title} ${article.description || ''}`.slice(0, 2000),
        author_name: article.author || article.source?.name,
        url: article.url,
        published_at: new Date(article.publishedAt).toISOString(),
        discovered_at: nowIso,
        urgency_score: 5,
        keywords_matched: [keyword],
        status: 'new',
        metadata: {
          source: article.source?.name
        },
        created_at: nowIso
      } as Mention;
    });
  }

  getRateLimitInfo() { return null; }
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) return { success: false, message: 'NEWS_API_KEY manquante' };
    try {
      await this.searchArticles('test');
      return { success: true, message: 'Connexion NewsAPI OK' };
    } catch {
      return { success: false, message: 'Erreur NewsAPI' };
    }
  }
}

export const newsAPI = new NewsAPIService();
export default newsAPI;


