export class SubredditTargetingService {
  private subredditsByLanguage: Record<string, any> = {
    fr: {
      general: ['france', 'french', 'rance', 'quebec', 'belgium', 'switzerland', 'luxembourg'],
      cities: ['paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'lille', 'nantes', 'strasbourg', 'montpellier', 'rennes'],
      topics: {
        food: ['france', 'cuisine', 'paris', 'lyon'],
        business: ['entrepreneur', 'startup_france', 'france', 'vosfinances'],
        politics: ['france', 'politique', 'actualites'],
        health: ['france', 'conseiljuridique', 'besoindeparler'],
        tech: ['france', 'informatique', 'jeuxvideo'],
        culture: ['france', 'musique', 'cinema', 'livres']
      }
    },
    en: {
      general: ['AskReddit', 'news', 'worldnews', 'todayilearned'],
      cities: ['london', 'nyc', 'chicago', 'losangeles', 'toronto'],
      topics: {
        food: ['food', 'cooking', 'recipes', 'FastFood'],
        business: ['entrepreneur', 'business', 'startups', 'personalfinance'],
        politics: ['politics', 'worldpolitics', 'news'],
        health: ['Health', 'medical', 'askdocs'],
        tech: ['technology', 'programming', 'gaming']
      }
    }
  };

  suggestSubreddits(keywords: string[], targetLanguages: string[]): string[] {
    const suggestions = new Set<string>();

    targetLanguages.forEach(lang => {
      const langSubs = this.subredditsByLanguage[lang];
      if (!langSubs) return;

      // généraux
      (langSubs.general || []).forEach((s: string) => suggestions.add(s));

      // contextuels
      keywords.forEach(k => {
        const lk = k.toLowerCase();
        if (['quick','mcdonald','burger','restaurant','food','pizza','kebab'].some(f => lk.includes(f))) {
          (langSubs.topics?.food || []).forEach((s: string) => suggestions.add(s));
        }
        if (['startup','entreprise','business','investissement','finance'].some(b => lk.includes(b))) {
          (langSubs.topics?.business || []).forEach((s: string) => suggestions.add(s));
        }
        if (['macron','gouvernement','politique','election','parti'].some(p => lk.includes(p))) {
          (langSubs.topics?.politics || []).forEach((s: string) => suggestions.add(s));
        }
        if (['tech','ai','intelligence','application','logiciel','code'].some(t => lk.includes(t))) {
          (langSubs.topics?.tech || []).forEach((s: string) => suggestions.add(s));
        }
        if (['santé','maladie','médecin','health','medical','doctor'].some(h => lk.includes(h))) {
          (langSubs.topics?.health || []).forEach((s: string) => suggestions.add(s));
        }
      });
    });

    return Array.from(suggestions).slice(0, 10);
  }
}

export default SubredditTargetingService;

