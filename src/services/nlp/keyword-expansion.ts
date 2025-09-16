import { } from 'tslib';

export function expandKeywords(baseKeywords: string[], languageHint?: string): string[] {
  const expanded = new Set<string>(baseKeywords);

  const fr = {
    rapide: ['vite', 'rapido', 'express'],
    
  } as const;

  const en = {
    fast: ['quick', 'rapid', 'speedy'],
  } as const;

  // Simple expansion based on hint
  if (languageHint === 'fr') {
    baseKeywords.forEach(k => {
      if (fr.rapide.includes(k as 'vite')) {
        expanded.add('rapide');
      }
    });
  } else {
    baseKeywords.forEach(k => {
      if (en.fast.includes(k as 'quick')) {
        expanded.add('fast');
      }
    });
  }

  return Array.from(expanded);
}

