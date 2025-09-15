export type Operator = 'ET' | 'OU' | 'NON';

export interface KeywordGroup {
  operator: Operator;
  keywords: string[];
}

export class AdvancedSearchEngine {
  static parseQueryToGroups(query: string): KeywordGroup[] {
    if (!query) return [];
    const et: string[] = [];
    const ou: string[] = [];
    const non: string[] = [];
    // Très simple parser: mots entre guillemets successifs = ET; (a OR b) => OU; -"x" => NON
    const orMatch = query.match(/\(([^)]+)\)/);
    if (orMatch) {
      orMatch[1].split(/\s+OR\s+/i).forEach(p => {
        const t = p.replace(/^["']|["']$/g, '').trim();
        if (t) ou.push(t);
      });
    }
    const negMatches = query.match(/-"([^"]+)"/g) || [];
    negMatches.forEach(m => {
      const t = m.replace(/-"|"/g, '').trim();
      if (t) non.push(t);
    });
    const cleaned = query
      .replace(/\(([^)]+)\)/g, ' ')
      .replace(/-"([^"]+)"/g, ' ')
      .trim();
    const etMatches = cleaned.match(/"([^"]+)"/g) || [];
    etMatches.forEach(m => {
      const t = m.replace(/"/g, '').trim();
      if (t) et.push(t);
    });
    return [
      { operator: 'ET', keywords: et },
      { operator: 'OU', keywords: ou },
      { operator: 'NON', keywords: non }
    ];
  }
  buildSearchQuery(keywordGroups: KeywordGroup[]): string {
    const etGroup = keywordGroups.find(g => g.operator === 'ET');
    const ouGroup = keywordGroups.find(g => g.operator === 'OU');
    const nonGroup = keywordGroups.find(g => g.operator === 'NON');

    let query = '';

    if (etGroup && etGroup.keywords.length > 0) {
      const etTerms = etGroup.keywords.filter(Boolean).map(k => `"${k}"`).join(' ');
      query += etTerms;
    }

    if (ouGroup && ouGroup.keywords.length > 0) {
      const ouTerms = ouGroup.keywords.filter(Boolean).map(k => `"${k}"`).join(' OR ');
      const block = ouTerms ? `(${ouTerms})` : '';
      query += block ? (query ? ` ${block}` : block) : '';
    }

    if (nonGroup && nonGroup.keywords.length > 0) {
      const nonTerms = nonGroup.keywords.filter(Boolean).map(k => `-"${k}"`).join(' ');
      if (nonTerms) query += (query ? ` ${nonTerms}` : nonTerms);
    }

    // Nettoyage final: retirer parenthèses vides et espaces
    return query
      .replace(/\(\s*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  matchesCriteria(content: string, keywordGroups: KeywordGroup[]): boolean {
    const lowerContent = (content || '').toLowerCase();

    const etGroup = keywordGroups.find(g => g.operator === 'ET');
    const ouGroup = keywordGroups.find(g => g.operator === 'OU');
    const nonGroup = keywordGroups.find(g => g.operator === 'NON');

    if (etGroup && etGroup.keywords.length > 0) {
      const hasAllRequired = etGroup.keywords.every(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      );
      if (!hasAllRequired) return false;
    }

    if (ouGroup && ouGroup.keywords.length > 0) {
      const hasAtLeastOne = ouGroup.keywords.some(keyword =>
        lowerContent.includes(keyword.toLowerCase())
      );
      if (!hasAtLeastOne) return false;
    }

    if (nonGroup && nonGroup.keywords.length > 0) {
      const hasExcluded = nonGroup.keywords.some(keyword =>
        lowerContent.includes(keyword.toLowerCase())
      );
      if (hasExcluded) return false;
    }

    return true;
  }
}

export default AdvancedSearchEngine;

