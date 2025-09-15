export class KeywordExpansionService {
  private synonymDatabase: Record<string, string[]> = {
    'maladies sexuellement transmissibles': ['MST', 'IST', 'infections sexuellement transmissibles', 'maladies vénériennes'],
    'mst': ['maladies sexuellement transmissibles', 'IST', 'infections sexuellement transmissibles'],
    'ist': ['infections sexuellement transmissibles', 'MST', 'maladies sexuellement transmissibles'],
    'quick': ['Quick Burger', 'restaurants Quick', 'chaîne Quick'],
    'mcdonalds': ["McDonald's", 'McDo', 'Mac Do', 'restaurants McDonald'],
    'burger king': ['BK', 'Burger King restaurant', 'King burger'],
    'intelligence artificielle': ['IA', 'AI', 'machine learning', 'apprentissage automatique'],
    'ia': ['intelligence artificielle', 'AI', 'artificial intelligence'],
    'voiture électrique': ['VE', 'véhicule électrique', 'auto électrique', 'voiture électrifiée'],
    've': ['voiture électrique', 'véhicule électrique']
  };

  expandKeywords(keywords: string[], language: string = 'fr'): string[] {
    const expanded = new Set<string>(keywords);
    keywords.forEach(keyword => {
      const normalized = keyword.toLowerCase().trim();
      if (this.synonymDatabase[normalized]) {
        this.synonymDatabase[normalized].forEach(s => expanded.add(s));
      }
      Object.keys(this.synonymDatabase).forEach(key => {
        if (normalized.includes(key) || key.includes(normalized)) {
          this.synonymDatabase[key].forEach(s => expanded.add(s));
        }
      });
    });
    return Array.from(expanded);
  }

  suggestSynonyms(keyword: string): string[] {
    const normalized = keyword.toLowerCase().trim();
    return this.synonymDatabase[normalized] || [];
  }
}

export default KeywordExpansionService;

